import type { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

const WINDOW_MS = 60_000;

function clientKey(request: NextRequest, routeKey: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${routeKey}:${ip}`;
}

/**
 * Best-effort in-memory rate limit (per server instance). Returns true if allowed.
 */
export function rateLimitAllow(
  request: NextRequest,
  routeKey: string,
  maxPerWindow: number,
): boolean {
  const key = clientKey(request, routeKey);
  const now = Date.now();
  let bucket = store.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, bucket);
  }
  if (bucket.count >= maxPerWindow) {
    return false;
  }
  bucket.count += 1;
  return true;
}
