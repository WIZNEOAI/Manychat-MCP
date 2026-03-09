import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { createOAuthRouter } from "../src/auth/oauth-routes.js";
import {
  resolveApiKeyFromToken,
  setOAuthStoreForTesting,
  createAuthorizationCode,
  exchangeCodeForToken,
  registerClient,
  revokeToken,
} from "../src/auth/oauth.js";
import { MemoryOAuthStore } from "../src/auth/oauth-store.js";

function codeChallengeS256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

describe("OAuth flow", () => {
  beforeEach(() => {
    setOAuthStoreForTesting(new MemoryOAuthStore());
  });

  it("runs register -> authorize -> token -> refresh -> revoke", async () => {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(createOAuthRouter("http://localhost:3000"));

    const registerRes = await request(app)
      .post("/register")
      .send({
        client_name: "test-client",
        redirect_uris: ["https://example.com/callback"],
      })
      .expect(201);

    const clientId = registerRes.body.client_id as string;
    expect(clientId).toBeTruthy();

    const verifier = "test-verifier-12345";
    const challenge = codeChallengeS256(verifier);

    await request(app)
      .get("/authorize")
      .query({
        client_id: clientId,
        redirect_uri: "https://example.com/callback",
        response_type: "code",
        code_challenge: challenge,
        code_challenge_method: "S256",
        state: "abc",
      })
      .expect(200);

    const authorizePost = await request(app)
      .post("/authorize")
      .type("form")
      .send({
        client_id: clientId,
        redirect_uri: "https://example.com/callback",
        code_challenge: challenge,
        code_challenge_method: "S256",
        state: "abc",
        api_key: "manychat-api-key-xyz",
      })
      .expect(302);

    const location = authorizePost.headers.location as string;
    const code = new URL(location).searchParams.get("code");
    expect(code).toBeTruthy();

    const tokenRes = await request(app)
      .post("/token")
      .send({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        code_verifier: verifier,
        redirect_uri: "https://example.com/callback",
      })
      .expect(200);

    expect(tokenRes.body.access_token).toBeTruthy();
    expect(tokenRes.body.refresh_token).toBeTruthy();
    expect(tokenRes.body.token_type).toBe("Bearer");

    const mappedApiKey = await resolveApiKeyFromToken(tokenRes.body.access_token);
    expect(mappedApiKey).toBe("manychat-api-key-xyz");

    const refreshRes = await request(app)
      .post("/token")
      .send({
        grant_type: "refresh_token",
        refresh_token: tokenRes.body.refresh_token,
        client_id: clientId,
      })
      .expect(200);

    expect(refreshRes.body.access_token).toBeTruthy();
    expect(refreshRes.body.refresh_token).toBeTruthy();

    await request(app)
      .post("/revoke")
      .send({
        token: refreshRes.body.access_token,
        token_type_hint: "access_token",
      })
      .expect(200);

    const revokedTokenApiKey = await resolveApiKeyFromToken(refreshRes.body.access_token);
    expect(revokedTokenApiKey).toBeNull();
  });

  it("rejects redirect_uri mismatch during code exchange", async () => {
    const client = await registerClient("mismatch-client", [
      "https://example.com/callback",
    ]);
    const verifier = "verifier-abc";
    const challenge = codeChallengeS256(verifier);
    const code = await createAuthorizationCode(
      client.clientId,
      challenge,
      "S256",
      "https://example.com/callback",
      "key-12345678",
    );

    const token = await exchangeCodeForToken(
      code,
      client.clientId,
      verifier,
      "https://example.com/wrong",
    );
    expect(token).toBeNull();
  });

  it("rejects token after explicit revocation", async () => {
    const client = await registerClient("revocation-client", [
      "https://example.com/callback",
    ]);
    const verifier = "verifier-xyz";
    const challenge = codeChallengeS256(verifier);
    const code = await createAuthorizationCode(
      client.clientId,
      challenge,
      "S256",
      "https://example.com/callback",
      "key-abcdefgh",
    );

    const token = await exchangeCodeForToken(
      code,
      client.clientId,
      verifier,
      "https://example.com/callback",
    );
    expect(token).not.toBeNull();

    await revokeToken(token!.access_token, "access_token");
    const apiKey = await resolveApiKeyFromToken(token!.access_token);
    expect(apiKey).toBeNull();
  });
});
