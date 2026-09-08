import { createHash } from "node:crypto";
import { Redis } from "ioredis";
import { log } from "../lib/logger.js";

/**
 * Per-credential request ceiling at the gateway edge.
 *
 * This is *not* a plan limit — those stay control-plane side per
 * docs/control-plane-contract.md. It is abuse protection: a fixed window per
 * minute so one runaway agent cannot saturate the gateway or the ManyChat API
 * for every other tenant on the same process. Memory by default (per process),
 * Redis when several gateway replicas must share the same counter.
 */
export interface RateLimitVerdict {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the current window resets. */
  retryAfterSec: number;
}

export interface RateLimiter {
  hit(key: string): Promise<RateLimitVerdict>;
  close(): Promise<void>;
}

export interface RateLimitConfig {
  perMinute: number;
  store: "memory" | "redis";
  redisUrl?: string;
}

const WINDOW_MS = 60_000;

export function resolveRateLimitConfig(env: NodeJS.ProcessEnv = process.env): RateLimitConfig {
  const raw = env.MCP_RATE_LIMIT_PER_MINUTE?.trim();
  const perMinute = raw === undefined || raw === "" ? 120 : Number(raw);
  if (!Number.isInteger(perMinute) || perMinute < 0) {
    throw new Error(`MCP_RATE_LIMIT_PER_MINUTE must be a non-negative integer, got ${raw}.`);
  }
  const store = (env.MCP_RATE_LIMIT_STORE ?? "memory").trim().toLowerCase();
  if (store !== "memory" && store !== "redis") {
    throw new Error("MCP_RATE_LIMIT_STORE must be 'memory' or 'redis'.");
  }
  if (store === "redis" && !env.REDIS_URL?.trim()) {
    throw new Error("REDIS_URL is required when MCP_RATE_LIMIT_STORE=redis.");
  }
  return { perMinute, store, redisUrl: env.REDIS_URL?.trim() };
}

export function createRateLimiter(config: RateLimitConfig): RateLimiter | null {
  if (config.perMinute === 0) return null;
  if (config.store === "redis") {
    return new RedisRateLimiter(config.perMinute, config.redisUrl!);
  }
  return new MemoryRateLimiter(config.perMinute);
}

/** Stable, non-reversible key for a credential. Never the credential itself. */
export function rateLimitKeyFor(parts: { tokenId?: string; apiKey?: string; ip?: string }): string {
  if (parts.tokenId) return `tok:${parts.tokenId}`;
  if (parts.apiKey) return `key:${createHash("sha256").update(parts.apiKey).digest("hex").slice(0, 24)}`;
  return `ip:${parts.ip ?? "unknown"}`;
}

export class MemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, { windowStart: number; count: number }>();
  private lastPrune = 0;

  constructor(
    private readonly perMinute: number,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async hit(key: string): Promise<RateLimitVerdict> {
    const t = this.now();
    const windowStart = t - (t % WINDOW_MS);
    this.prune(t);
    const entry = this.windows.get(key);
    const count = entry && entry.windowStart === windowStart ? entry.count + 1 : 1;
    this.windows.set(key, { windowStart, count });
    return verdict(this.perMinute, count, windowStart + WINDOW_MS - t);
  }

  async close(): Promise<void> {
    this.windows.clear();
  }

  private prune(t: number) {
    if (t - this.lastPrune < WINDOW_MS) return;
    this.lastPrune = t;
    for (const [key, entry] of this.windows) {
      if (t - entry.windowStart >= WINDOW_MS) this.windows.delete(key);
    }
  }
}

export class RedisRateLimiter implements RateLimiter {
  private readonly redis: Redis;

  constructor(
    private readonly perMinute: number,
    redisUrl: string,
  ) {
    this.redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
    this.redis.on("error", (error) => log.warn("rate_limit_redis_error", { error: error.message }));
  }

  async hit(key: string): Promise<RateLimitVerdict> {
    const t = Date.now();
    const windowStart = t - (t % WINDOW_MS);
    const redisKey = `mcp:rl:${key}:${windowStart}`;
    try {
      const count = await this.redis.incr(redisKey);
      if (count === 1) await this.redis.pexpire(redisKey, WINDOW_MS + 1000);
      return verdict(this.perMinute, count, windowStart + WINDOW_MS - t);
    } catch (error) {
      // Fail open: a Redis outage must not take the gateway down with it, and
      // the control plane still enforces the real ceilings.
      log.warn("rate_limit_redis_unavailable", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { allowed: true, limit: this.perMinute, remaining: this.perMinute, retryAfterSec: 0 };
    }
  }

  async close(): Promise<void> {
    await this.redis.quit().catch(() => undefined);
  }
}

function verdict(limit: number, count: number, msLeft: number): RateLimitVerdict {
  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    retryAfterSec: Math.max(1, Math.ceil(msLeft / 1000)),
  };
}
