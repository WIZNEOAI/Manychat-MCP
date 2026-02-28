import { randomUUID, randomBytes, createHash } from "node:crypto";
import { log } from "../lib/logger.js";

interface AuthorizationCode {
  code: string;
  clientId: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  redirectUri: string;
  apiKey: string;
  expiresAt: number;
}

interface AccessToken {
  token: string;
  clientId: string;
  apiKey: string;
  createdAt: number;
}

interface RegisteredClient {
  clientId: string;
  clientName: string;
  redirectUris: string[];
  createdAt: number;
}

const authCodes = new Map<string, AuthorizationCode>();
const accessTokens = new Map<string, AccessToken>();
const registeredClients = new Map<string, RegisteredClient>();

const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function resolveApiKeyFromToken(bearerToken: string): string | null {
  const entry = accessTokens.get(bearerToken);
  return entry?.apiKey ?? null;
}

export function registerClient(
  clientName: string,
  redirectUris: string[],
): RegisteredClient {
  const clientId = randomUUID();
  const client: RegisteredClient = {
    clientId,
    clientName,
    redirectUris,
    createdAt: Date.now(),
  };
  registeredClients.set(clientId, client);
  log.info("oauth_client_registered", { clientId, clientName });
  return client;
}

export function getClient(clientId: string): RegisteredClient | undefined {
  return registeredClients.get(clientId);
}

export function createAuthorizationCode(
  clientId: string,
  codeChallenge: string,
  codeChallengeMethod: string,
  redirectUri: string,
  apiKey: string,
): string {
  const code = randomBytes(32).toString("hex");
  authCodes.set(code, {
    code,
    clientId,
    codeChallenge,
    codeChallengeMethod,
    redirectUri,
    apiKey,
    expiresAt: Date.now() + CODE_TTL_MS,
  });
  log.info("oauth_code_created", { clientId });
  return code;
}

export function exchangeCodeForToken(
  code: string,
  clientId: string,
  codeVerifier: string,
  redirectUri: string,
): { access_token: string; token_type: string } | null {
  const entry = authCodes.get(code);
  if (!entry) return null;

  authCodes.delete(code);

  if (entry.expiresAt < Date.now()) return null;
  if (entry.clientId !== clientId) return null;
  if (entry.redirectUri !== redirectUri) return null;

  const challenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  if (challenge !== entry.codeChallenge) return null;

  const token = randomBytes(48).toString("hex");
  accessTokens.set(token, {
    token,
    clientId,
    apiKey: entry.apiKey,
    createdAt: Date.now(),
  });

  log.info("oauth_token_issued", { clientId });

  return {
    access_token: token,
    token_type: "Bearer",
  };
}

export function revokeToken(token: string): boolean {
  return accessTokens.delete(token);
}

setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of authCodes) {
    if (entry.expiresAt < now) authCodes.delete(code);
  }
}, 60_000);
