import { describe, expect, it } from "vitest";
import { rateLimitAllow } from "./rate-limit";
import type { NextRequest } from "next/server";

function mockRequest(ip: string): NextRequest {
  return {
    headers: {
      get: (name: string) => (name === "x-forwarded-for" ? ip : null),
    },
  } as unknown as NextRequest;
}

describe("rateLimitAllow", () => {
  it("allows first request", () => {
    const req = mockRequest("10.0.0.1");
    expect(rateLimitAllow(req, "test-route", 5)).toBe(true);
  });

  it("allows up to maxPerWindow", () => {
    const req = mockRequest("10.0.0.2");
    let allowed = 0;
    for (let i = 0; i < 5; i++) {
      if (rateLimitAllow(req, "test-route-2", 5)) allowed++;
    }
    expect(allowed).toBe(5);
  });

  it("blocks after maxPerWindow exceeded", () => {
    const req = mockRequest("10.0.0.3");
    for (let i = 0; i < 10; i++) {
      rateLimitAllow(req, "test-route-3", 3);
    }
    expect(rateLimitAllow(req, "test-route-3", 3)).toBe(false);
  });

  it("separates different routes", () => {
    const req = mockRequest("10.0.0.4");
    for (let i = 0; i < 3; i++) {
      rateLimitAllow(req, "route-a", 3);
    }
    expect(rateLimitAllow(req, "route-a", 3)).toBe(false);
    expect(rateLimitAllow(req, "route-b", 3)).toBe(true);
  });

  it("separates different IPs", () => {
    const req1 = mockRequest("10.0.0.5");
    const req2 = mockRequest("10.0.0.6");
    for (let i = 0; i < 3; i++) {
      rateLimitAllow(req1, "route-c", 3);
    }
    expect(rateLimitAllow(req1, "route-c", 3)).toBe(false);
    expect(rateLimitAllow(req2, "route-c", 3)).toBe(true);
  });

  it("handles missing x-forwarded-for gracefully", () => {
    const req = {
      headers: { get: () => null },
    } as unknown as NextRequest;
    expect(rateLimitAllow(req, "fallback-route", 3)).toBe(true);
  });
});
