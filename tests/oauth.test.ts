import { beforeEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  resolveApiKeyFromToken,
  setOAuthStoreForTesting,
  createAuthorizationCode,
  exchangeCodeForToken,
  refreshAccessToken,
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
    const client = await registerClient("test-client", [
      "https://example.com/callback",
    ]);
    expect(client.clientId).toBeTruthy();
    const verifier = "test-verifier-12345";
    const challenge = codeChallengeS256(verifier);
    const code = await createAuthorizationCode(
      client.clientId,
      challenge,
      "S256",
      "https://example.com/callback",
      "manychat-api-key-xyz",
    );
    expect(code).toBeTruthy();

    const token = await exchangeCodeForToken(
      code,
      client.clientId,
      verifier,
      "https://example.com/callback",
    );
    expect(token).not.toBeNull();
    expect(token!.access_token).toBeTruthy();
    expect(token!.refresh_token).toBeTruthy();
    expect(token!.token_type).toBe("Bearer");

    const mappedApiKey = await resolveApiKeyFromToken(token!.access_token);
    expect(mappedApiKey).toBe("manychat-api-key-xyz");

    const refreshed = await refreshAccessToken(token!.refresh_token, client.clientId);
    expect(refreshed).not.toBeNull();
    expect(refreshed!.access_token).toBeTruthy();
    expect(refreshed!.refresh_token).toBeTruthy();

    await revokeToken(refreshed!.access_token, "access_token");

    const revokedTokenApiKey = await resolveApiKeyFromToken(refreshed!.access_token);
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
