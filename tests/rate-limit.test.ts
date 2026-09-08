import { describe, expect, it } from "vitest";
import {
  MemoryRateLimiter,
  createRateLimiter,
  rateLimitKeyFor,
  resolveRateLimitConfig,
} from "../src/mcp/rate-limit.js";

describe("gateway rate limit", () => {
  it("allows up to the ceiling within a window, then refuses with a retry hint", async () => {
    let now = 1_000_000;
    const limiter = new MemoryRateLimiter(3, () => now);
    const a = await limiter.hit("tok:a");
    const b = await limiter.hit("tok:a");
    const c = await limiter.hit("tok:a");
    const d = await limiter.hit("tok:a");
    expect([a.allowed, b.allowed, c.allowed, d.allowed]).toEqual([true, true, true, false]);
    expect(d.remaining).toBe(0);
    expect(d.retryAfterSec).toBeGreaterThan(0);
    expect(d.retryAfterSec).toBeLessThanOrEqual(60);
    // A different credential has its own counter.
    expect((await limiter.hit("tok:b")).allowed).toBe(true);
    // The next window starts clean.
    now += 60_000;
    expect((await limiter.hit("tok:a")).allowed).toBe(true);
  });

  it("keys hosted tokens by id and API keys by a hash, never by the key itself", () => {
    const key = rateLimitKeyFor({ apiKey: "12345:abcdefSECRET" });
    expect(key.startsWith("key:")).toBe(true);
    expect(key).not.toContain("SECRET");
    expect(rateLimitKeyFor({ tokenId: "t1", apiKey: "x" })).toBe("tok:t1");
    expect(rateLimitKeyFor({ ip: "10.0.0.1" })).toBe("ip:10.0.0.1");
  });

  it("defaults to 120/min in memory, and 0 disables it", () => {
    expect(resolveRateLimitConfig({})).toEqual({ perMinute: 120, store: "memory", redisUrl: undefined });
    expect(createRateLimiter(resolveRateLimitConfig({ MCP_RATE_LIMIT_PER_MINUTE: "0" }))).toBeNull();
    expect(() => resolveRateLimitConfig({ MCP_RATE_LIMIT_PER_MINUTE: "-1" })).toThrow();
    expect(() => resolveRateLimitConfig({ MCP_RATE_LIMIT_STORE: "redis" })).toThrow(/REDIS_URL/);
  });
});
