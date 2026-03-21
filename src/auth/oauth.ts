import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  type AccessToken,
  type AuthorizationCode,
  type OAuthStore,
  type RefreshToken,
  type RegisteredClient,
  createOAuthStoreFromEnv,
} from "./oauth-store.js";
import { log } from "../lib/logger.js";

interface OAuthTtlConfig {
  authCodeTtlSec: number;
  accessTokenTtlSec: number;
  refreshTokenTtlSec: number;
}

interface OAuthTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
}

const ttlConfig: OAuthTtlConfig = {
  authCodeTtlSec: parseTtl("OAUTH_AUTH_CODE_TTL_SEC", 300),
  accessTokenTtlSec: parseTtl("OAUTH_ACCESS_TOKEN_TTL_SEC", 3600),
  refreshTokenTtlSec: parseTtl("OAUTH_REFRESH_TOKEN_TTL_SEC", 60 * 60 * 24 * 30),
};

let oauthStore: OAuthStore | null = null;

function parseTtl(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number of seconds.`);
  }
  return Math.floor(value);
}

function expiresAtFromNow(ttlSec: number): number {
  return Date.now() + ttlSec * 1000;
}

function verifyPkce(codeVerifier: string, codeChallenge: string): boolean {
  const challenge = createHash("sha256").update(codeVerifier).digest("base64url");
  return challenge === codeChallenge;
}

async function appendAuditEvent(
  event: string,
  clientId?: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await getOAuthStore().appendAuditEvent({
    id: randomUUID(),
    event,
    clientId,
    details,
    createdAt: Date.now(),
  });
}

export function setOAuthStoreForTesting(store: OAuthStore): void {
  oauthStore = store;
}

function getOAuthStore(): OAuthStore {
  if (!oauthStore) {
    oauthStore = createOAuthStoreFromEnv();
  }

  return oauthStore;
}

export async function resolveApiKeyFromToken(
  bearerToken: string,
): Promise<string | null> {
  const entry = await getOAuthStore().getAccessToken(bearerToken);
  return entry?.apiKey ?? null;
}

export async function registerClient(
  clientName: string,
  redirectUris: string[],
): Promise<RegisteredClient> {
  const client = await getOAuthStore().registerClient(clientName, redirectUris);
  await appendAuditEvent("oauth_client_registered", client.clientId, {
    redirectUrisCount: redirectUris.length,
  });
  log.info("oauth_client_registered", { clientId: client.clientId, clientName });
  return client;
}

export async function getClient(clientId: string): Promise<RegisteredClient | null> {
  return getOAuthStore().getClient(clientId);
}

export async function createAuthorizationCode(
  clientId: string,
  codeChallenge: string,
  codeChallengeMethod: "S256",
  redirectUri: string,
  apiKey: string,
): Promise<string> {
  const code = randomBytes(32).toString("hex");
  const payload: AuthorizationCode = {
    code,
    clientId,
    codeChallenge,
    codeChallengeMethod,
    redirectUri,
    apiKey,
    createdAt: Date.now(),
    expiresAt: expiresAtFromNow(ttlConfig.authCodeTtlSec),
  };

  await getOAuthStore().saveAuthorizationCode(payload);
  await appendAuditEvent("oauth_code_created", clientId, {
    codeTtlSec: ttlConfig.authCodeTtlSec,
  });
  return code;
}

function buildAccessTokenRecord(clientId: string, apiKey: string): AccessToken {
  return {
    token: randomBytes(48).toString("hex"),
    clientId,
    apiKey,
    createdAt: Date.now(),
    expiresAt: expiresAtFromNow(ttlConfig.accessTokenTtlSec),
    revokedAt: null,
  };
}

function buildRefreshTokenRecord(clientId: string, apiKey: string): RefreshToken {
  return {
    token: randomBytes(48).toString("hex"),
    clientId,
    apiKey,
    createdAt: Date.now(),
    expiresAt: expiresAtFromNow(ttlConfig.refreshTokenTtlSec),
    revokedAt: null,
  };
}

function formatTokenResponse(
  access: AccessToken,
  refresh: RefreshToken,
): OAuthTokenResponse {
  return {
    access_token: access.token,
    token_type: "Bearer",
    expires_in: ttlConfig.accessTokenTtlSec,
    refresh_token: refresh.token,
  };
}

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<OAuthTokenResponse | null> {
  const entry = await getOAuthStore().takeAuthorizationCode(code);
  if (!entry) {
    await appendAuditEvent("oauth_code_exchange_failed", clientId, { reason: "missing_code" });
    return null;
  }

  if (entry.clientId !== clientId || entry.redirectUri !== redirectUri) {
    await appendAuditEvent("oauth_code_exchange_failed", clientId, { reason: "client_or_redirect_mismatch" });
    return null;
  }

  if (entry.codeChallengeMethod !== "S256" || !verifyPkce(codeVerifier, entry.codeChallenge)) {
    await appendAuditEvent("oauth_code_exchange_failed", clientId, { reason: "pkce_failed" });
    return null;
  }

  const access = buildAccessTokenRecord(clientId, entry.apiKey);
  const refresh = buildRefreshTokenRecord(clientId, entry.apiKey);

  const store = getOAuthStore();
  await store.saveAccessToken(access);
  await store.saveRefreshToken(refresh);
  await appendAuditEvent("oauth_token_issued", clientId, {
    accessExpiresAt: access.expiresAt,
    refreshExpiresAt: refresh.expiresAt,
  });

  return formatTokenResponse(access, refresh);
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
): Promise<OAuthTokenResponse | null> {
  const store = getOAuthStore();
  const refresh = await store.takeRefreshToken(refreshToken);
  if (!refresh || refresh.clientId !== clientId) {
    await appendAuditEvent("oauth_refresh_failed", clientId, { reason: "invalid_refresh_token" });
    return null;
  }

  const access = buildAccessTokenRecord(clientId, refresh.apiKey);
  const nextRefresh = buildRefreshTokenRecord(clientId, refresh.apiKey);
  await store.saveAccessToken(access);
  await store.saveRefreshToken(nextRefresh);
  await appendAuditEvent("oauth_refresh_succeeded", clientId, {
    accessExpiresAt: access.expiresAt,
  });
  return formatTokenResponse(access, nextRefresh);
}

export async function revokeToken(token: string, hint?: string): Promise<boolean> {
  if (hint === "refresh_token") {
    const revokedRefresh = await getOAuthStore().revokeRefreshToken(token);
    if (revokedRefresh) await appendAuditEvent("oauth_refresh_revoked");
    return revokedRefresh;
  }

  if (hint === "access_token") {
    const revokedAccess = await getOAuthStore().revokeAccessToken(token);
    if (revokedAccess) await appendAuditEvent("oauth_access_revoked");
    return revokedAccess;
  }

  // Default behavior: attempt both to tolerate clients that omit token_type_hint.
  const store = getOAuthStore();
  const [revokedAccess, revokedRefresh] = await Promise.all([
    store.revokeAccessToken(token),
    store.revokeRefreshToken(token),
  ]);
  if (revokedAccess || revokedRefresh) {
    await appendAuditEvent("oauth_token_revoked", undefined, { hint: "none" });
  }
  return revokedAccess || revokedRefresh;
}
