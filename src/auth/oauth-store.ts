import { randomUUID } from "node:crypto";
import { Redis } from "ioredis";
import { log } from "../lib/logger.js";

export interface RegisteredClient {
  clientId: string;
  clientName: string;
  redirectUris: string[];
  createdAt: number;
}

export interface AuthorizationCode {
  code: string;
  clientId: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  redirectUri: string;
  apiKey: string;
  createdAt: number;
  expiresAt: number;
}

export interface AccessToken {
  token: string;
  clientId: string;
  apiKey: string;
  createdAt: number;
  expiresAt: number;
  revokedAt: number | null;
}

export interface RefreshToken {
  token: string;
  clientId: string;
  apiKey: string;
  createdAt: number;
  expiresAt: number;
  revokedAt: number | null;
}

export interface OAuthAuditEvent {
  id: string;
  event: string;
  clientId?: string;
  details?: Record<string, unknown>;
  createdAt: number;
}

export interface OAuthStore {
  registerClient(clientName: string, redirectUris: string[]): Promise<RegisteredClient>;
  getClient(clientId: string): Promise<RegisteredClient | null>;

  saveAuthorizationCode(code: AuthorizationCode): Promise<void>;
  takeAuthorizationCode(code: string): Promise<AuthorizationCode | null>;

  saveAccessToken(token: AccessToken): Promise<void>;
  getAccessToken(token: string): Promise<AccessToken | null>;
  revokeAccessToken(token: string): Promise<boolean>;

  saveRefreshToken(token: RefreshToken): Promise<void>;
  takeRefreshToken(token: string): Promise<RefreshToken | null>;
  revokeRefreshToken(token: string): Promise<boolean>;

  appendAuditEvent(event: OAuthAuditEvent): Promise<void>;
}

function isExpired(expiresAt: number): boolean {
  return expiresAt <= Date.now();
}

export class MemoryOAuthStore implements OAuthStore {
  private readonly clients = new Map<string, RegisteredClient>();
  private readonly authCodes = new Map<string, AuthorizationCode>();
  private readonly accessTokens = new Map<string, AccessToken>();
  private readonly refreshTokens = new Map<string, RefreshToken>();
  private readonly auditEvents: OAuthAuditEvent[] = [];

  constructor() {
    setInterval(() => this.cleanup(), 60_000).unref();
  }

  async registerClient(clientName: string, redirectUris: string[]): Promise<RegisteredClient> {
    const client: RegisteredClient = {
      clientId: randomUUID(),
      clientName,
      redirectUris,
      createdAt: Date.now(),
    };
    this.clients.set(client.clientId, client);
    return client;
  }

  async getClient(clientId: string): Promise<RegisteredClient | null> {
    return this.clients.get(clientId) ?? null;
  }

  async saveAuthorizationCode(code: AuthorizationCode): Promise<void> {
    this.authCodes.set(code.code, code);
  }

  async takeAuthorizationCode(code: string): Promise<AuthorizationCode | null> {
    const entry = this.authCodes.get(code);
    if (!entry) return null;
    this.authCodes.delete(code);
    if (isExpired(entry.expiresAt)) return null;
    return entry;
  }

  async saveAccessToken(token: AccessToken): Promise<void> {
    this.accessTokens.set(token.token, token);
  }

  async getAccessToken(token: string): Promise<AccessToken | null> {
    const entry = this.accessTokens.get(token);
    if (!entry) return null;
    if (entry.revokedAt || isExpired(entry.expiresAt)) return null;
    return entry;
  }

  async revokeAccessToken(token: string): Promise<boolean> {
    const entry = this.accessTokens.get(token);
    if (!entry) return false;
    this.accessTokens.set(token, { ...entry, revokedAt: Date.now() });
    return true;
  }

  async saveRefreshToken(token: RefreshToken): Promise<void> {
    this.refreshTokens.set(token.token, token);
  }

  async takeRefreshToken(token: string): Promise<RefreshToken | null> {
    const entry = this.refreshTokens.get(token);
    if (!entry) return null;
    this.refreshTokens.delete(token);
    if (entry.revokedAt || isExpired(entry.expiresAt)) return null;
    return entry;
  }

  async revokeRefreshToken(token: string): Promise<boolean> {
    const entry = this.refreshTokens.get(token);
    if (!entry) return false;
    this.refreshTokens.set(token, { ...entry, revokedAt: Date.now() });
    return true;
  }

  async appendAuditEvent(event: OAuthAuditEvent): Promise<void> {
    this.auditEvents.push(event);
    if (this.auditEvents.length > 5000) {
      this.auditEvents.splice(0, this.auditEvents.length - 5000);
    }
  }

  private cleanup() {
    for (const [code, entry] of this.authCodes.entries()) {
      if (isExpired(entry.expiresAt)) this.authCodes.delete(code);
    }
    for (const [token, entry] of this.accessTokens.entries()) {
      if (isExpired(entry.expiresAt)) this.accessTokens.delete(token);
    }
    for (const [token, entry] of this.refreshTokens.entries()) {
      if (isExpired(entry.expiresAt)) this.refreshTokens.delete(token);
    }
  }
}

export class RedisOAuthStore implements OAuthStore {
  private readonly redis: Redis;
  private readonly prefix: string;

  constructor(redisUrl: string, prefix = "manychat-mcp:oauth") {
    this.redis = new Redis(redisUrl, { lazyConnect: false });
    this.prefix = prefix;
  }

  async registerClient(clientName: string, redirectUris: string[]): Promise<RegisteredClient> {
    const client: RegisteredClient = {
      clientId: randomUUID(),
      clientName,
      redirectUris,
      createdAt: Date.now(),
    };
    await this.redis.set(
      this.key("client", client.clientId),
      JSON.stringify(client),
    );
    return client;
  }

  async getClient(clientId: string): Promise<RegisteredClient | null> {
    const raw = await this.redis.get(this.key("client", clientId));
    return raw ? (JSON.parse(raw) as RegisteredClient) : null;
  }

  async saveAuthorizationCode(code: AuthorizationCode): Promise<void> {
    const ttlSec = Math.max(1, Math.floor((code.expiresAt - Date.now()) / 1000));
    await this.redis.set(
      this.key("auth_code", code.code),
      JSON.stringify(code),
      "EX",
      ttlSec,
    );
  }

  async takeAuthorizationCode(code: string): Promise<AuthorizationCode | null> {
    const key = this.key("auth_code", code);
    const raw = await this.redis.call("GETDEL", key);
    if (!raw || typeof raw !== "string") return null;
    const entry = JSON.parse(raw) as AuthorizationCode;
    if (isExpired(entry.expiresAt)) return null;
    return entry;
  }

  async saveAccessToken(token: AccessToken): Promise<void> {
    const ttlSec = Math.max(1, Math.floor((token.expiresAt - Date.now()) / 1000));
    await this.redis.set(
      this.key("access_token", token.token),
      JSON.stringify(token),
      "EX",
      ttlSec,
    );
  }

  async getAccessToken(token: string): Promise<AccessToken | null> {
    const raw = await this.redis.get(this.key("access_token", token));
    if (!raw) return null;
    const entry = JSON.parse(raw) as AccessToken;
    if (entry.revokedAt || isExpired(entry.expiresAt)) return null;
    return entry;
  }

  async revokeAccessToken(token: string): Promise<boolean> {
    const key = this.key("access_token", token);
    const raw = await this.redis.get(key);
    if (!raw) return false;
    const entry = JSON.parse(raw) as AccessToken;
    entry.revokedAt = Date.now();
    const ttlSec = Math.max(1, Math.floor((entry.expiresAt - Date.now()) / 1000));
    await this.redis.set(key, JSON.stringify(entry), "EX", ttlSec);
    return true;
  }

  async saveRefreshToken(token: RefreshToken): Promise<void> {
    const ttlSec = Math.max(1, Math.floor((token.expiresAt - Date.now()) / 1000));
    await this.redis.set(
      this.key("refresh_token", token.token),
      JSON.stringify(token),
      "EX",
      ttlSec,
    );
  }

  async takeRefreshToken(token: string): Promise<RefreshToken | null> {
    const key = this.key("refresh_token", token);
    const raw = await this.redis.call("GETDEL", key);
    if (!raw || typeof raw !== "string") return null;
    const entry = JSON.parse(raw) as RefreshToken;
    if (entry.revokedAt || isExpired(entry.expiresAt)) return null;
    return entry;
  }

  async revokeRefreshToken(token: string): Promise<boolean> {
    return (await this.redis.del(this.key("refresh_token", token))) > 0;
  }

  async appendAuditEvent(event: OAuthAuditEvent): Promise<void> {
    const key = this.key("audit");
    await this.redis.multi()
      .lpush(key, JSON.stringify(event))
      .ltrim(key, 0, 4999)
      .exec();
  }

  private key(kind: string, id?: string): string {
    return id ? `${this.prefix}:${kind}:${id}` : `${this.prefix}:${kind}`;
  }
}

export function createOAuthStoreFromEnv(): OAuthStore {
  const mode = (process.env.OAUTH_STORE ?? "memory").toLowerCase();
  const isProd = process.env.NODE_ENV === "production";

  if (mode === "redis") {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error("REDIS_URL is required when OAUTH_STORE=redis.");
    }
    return new RedisOAuthStore(redisUrl);
  }

  if (isProd) {
    throw new Error("Production requires OAUTH_STORE=redis and REDIS_URL.");
  }

  log.warn("oauth_memory_store_enabled", {
    warning: "Using in-memory OAuth store. Tokens and clients are lost on restart.",
  });
  return new MemoryOAuthStore();
}
