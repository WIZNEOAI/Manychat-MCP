import { Router } from "express";
import {
  registerClient,
  getClient,
  createAuthorizationCode,
  exchangeCodeForToken,
  refreshAccessToken,
  revokeToken,
} from "./oauth.js";
import { log } from "../lib/logger.js";

export function createOAuthRouter(serverBaseUrl: string): Router {
  const router = Router();

  router.get("/.well-known/oauth-protected-resource", (_req, res) => {
    res.json({
      resource: serverBaseUrl,
      authorization_servers: [serverBaseUrl],
      bearer_methods_supported: ["header"],
    });
  });

  router.get("/.well-known/oauth-authorization-server", (_req, res) => {
    res.json({
      issuer: serverBaseUrl,
      authorization_endpoint: `${serverBaseUrl}/authorize`,
      token_endpoint: `${serverBaseUrl}/token`,
      registration_endpoint: `${serverBaseUrl}/register`,
      revocation_endpoint: `${serverBaseUrl}/revoke`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"],
    });
  });

  router.post("/register", async (req, res) => {
    const { client_name, redirect_uris } = req.body ?? {};
    if (!client_name || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
      res.status(400).json({
        error: "invalid_request",
        error_description: "client_name and redirect_uris are required",
      });
      return;
    }
    const validUris = redirect_uris.every((uri) => {
      try {
        const parsed = new URL(uri);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch {
        return false;
      }
    });
    if (!validUris) {
      res.status(400).json({
        error: "invalid_redirect_uri",
        error_description: "All redirect_uris must be absolute HTTP(S) URLs",
      });
      return;
    }

    const client = await registerClient(client_name, redirect_uris);
    res.status(201).json({
      client_id: client.clientId,
      client_name: client.clientName,
      redirect_uris: client.redirectUris,
    });
  });

  router.get("/authorize", async (req, res) => {
    const {
      client_id,
      redirect_uri,
      response_type,
      code_challenge,
      code_challenge_method,
      state,
    } = req.query as Record<string, string>;

    if (response_type !== "code") {
      res.status(400).json({
        error: "unsupported_response_type",
        error_description: "Only response_type=code is supported",
      });
      return;
    }

    if (!code_challenge || code_challenge_method !== "S256") {
      res.status(400).json({
        error: "invalid_request",
        error_description: "PKCE with S256 is required",
      });
      return;
    }

    const client = await getClient(client_id);
    if (!client) {
      res.status(400).json({
        error: "invalid_client",
        error_description: "Unknown client_id",
      });
      return;
    }

    if (!client.redirectUris.includes(redirect_uri)) {
      res.status(400).json({
        error: "invalid_request",
        error_description: "redirect_uri not registered",
      });
      return;
    }

    res.setHeader("Content-Type", "text/html");
    res.send(renderAuthPage(client_id, redirect_uri, code_challenge, code_challenge_method, state));
  });

  router.post("/authorize", async (req, res) => {
    const {
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method,
      state,
      api_key,
    } = req.body ?? {};

    if (typeof api_key !== "string" || api_key.trim().length < 8) {
      res.status(400).json({
        error: "invalid_request",
        error_description: "api_key is required and must be a valid key string",
      });
      return;
    }

    const client = await getClient(client_id);
    if (!client) {
      res.status(400).json({ error: "invalid_client" });
      return;
    }

    if (!client.redirectUris.includes(redirect_uri)) {
      res.status(400).json({
        error: "invalid_request",
        error_description: "redirect_uri not registered",
      });
      return;
    }

    if (!code_challenge || code_challenge_method !== "S256") {
      res.status(400).json({
        error: "invalid_request",
        error_description: "PKCE with S256 is required",
      });
      return;
    }

    const code = await createAuthorizationCode(
      client_id,
      code_challenge,
      code_challenge_method as "S256",
      redirect_uri,
      api_key.trim(),
    );

    const url = new URL(redirect_uri);
    url.searchParams.set("code", code);
    if (state) url.searchParams.set("state", state);
    res.redirect(302, url.toString());
  });

  router.post("/token", async (req, res) => {
    const {
      grant_type,
      code,
      client_id,
      code_verifier,
      redirect_uri,
      refresh_token,
    } = req.body ?? {};

    if (grant_type === "authorization_code") {
      if (!code || !client_id || !code_verifier || !redirect_uri) {
        res.status(400).json({
          error: "invalid_request",
          error_description:
            "code, client_id, code_verifier, and redirect_uri are required",
        });
        return;
      }

      const result = await exchangeCodeForToken(code, client_id, code_verifier, redirect_uri);
      if (!result) {
        res.status(400).json({
          error: "invalid_grant",
          error_description: "Invalid or expired authorization code",
        });
        return;
      }

      res.json(result);
      return;
    }

    if (grant_type === "refresh_token") {
      if (!refresh_token || !client_id) {
        res.status(400).json({
          error: "invalid_request",
          error_description: "refresh_token and client_id are required",
        });
        return;
      }

      const result = await refreshAccessToken(refresh_token, client_id);
      if (!result) {
        res.status(400).json({
          error: "invalid_grant",
          error_description: "Invalid or expired refresh token",
        });
        return;
      }

      res.json(result);
      return;
    }

    res.status(400).json({
      error: "unsupported_grant_type",
      error_description: "Supported grant_types are authorization_code and refresh_token",
    });
  });

  router.post("/revoke", async (req, res) => {
    const { token, token_type_hint } = req.body ?? {};
    if (typeof token !== "string" || token.length === 0) {
      res.status(400).json({
        error: "invalid_request",
        error_description: "token is required",
      });
      return;
    }

    const revoked = await revokeToken(token, token_type_hint);
    if (!revoked) {
      log.warn("oauth_revoke_miss", { hint: token_type_hint });
    }
    res.status(200).json({ status: "ok" });
  });

  return router;
}

function renderAuthPage(
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  codeChallengeMethod: string,
  state: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Connect ManyChat</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: #1e293b;
      border-radius: 16px;
      padding: 40px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 25px 50px rgba(0,0,0,0.4);
    }
    .logo { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .logo span { color: #3b82f6; }
    .subtitle { color: #94a3b8; margin-bottom: 28px; font-size: 14px; }
    label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; }
    input[type="password"] {
      width: 100%; padding: 12px; border-radius: 8px;
      border: 1px solid #334155; background: #0f172a; color: #e2e8f0;
      font-size: 14px; margin-bottom: 8px;
    }
    input:focus { outline: none; border-color: #3b82f6; }
    .hint { color: #64748b; font-size: 12px; margin-bottom: 20px; }
    button {
      width: 100%; padding: 12px; border-radius: 8px;
      background: #3b82f6; color: white; border: none;
      font-size: 15px; font-weight: 600; cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #2563eb; }
    .security { color: #64748b; font-size: 11px; margin-top: 16px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">ManyChat <span>MCP</span></div>
    <p class="subtitle">Connect your ManyChat account to enable AI agent access.</p>
    <form method="POST" action="/authorize">
      <input type="hidden" name="client_id" value="${esc(clientId)}">
      <input type="hidden" name="redirect_uri" value="${esc(redirectUri)}">
      <input type="hidden" name="code_challenge" value="${esc(codeChallenge)}">
      <input type="hidden" name="code_challenge_method" value="${esc(codeChallengeMethod)}">
      <input type="hidden" name="state" value="${esc(state ?? "")}">
      <label for="api_key">ManyChat API Key</label>
      <input type="password" id="api_key" name="api_key" placeholder="Paste your API key" required>
      <p class="hint">Find it in ManyChat &rarr; Settings &rarr; API &rarr; Generate API Key</p>
      <button type="submit">Connect Account</button>
    </form>
    <p class="security">Your API key is encrypted in transit and never shared with third parties.</p>
  </div>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
