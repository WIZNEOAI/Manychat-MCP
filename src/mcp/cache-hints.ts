import type { CacheHint } from "@modelcontextprotocol/server";

/**
 * Which tenancy model the server instance is serving. `multi_tenant` covers
 * every deployment where a single endpoint answers for more than one ManyChat
 * account (the hosted control-plane mode); `single_tenant` covers stdio and the
 * self-hosted HTTP modes where the caller supplies its own ManyChat key.
 */
export type McpCacheProfile = "single_tenant" | "multi_tenant";

/**
 * The six cacheable operations of protocol revision 2026-07-28 (SEP-2549).
 * `server/discover` is absent from the changelog but present in the schema, so
 * it is included here on purpose.
 */
export type CacheableResultMethod =
  | "tools/list"
  | "prompts/list"
  | "resources/list"
  | "resources/templates/list"
  | "resources/read"
  | "server/discover";

export type McpCacheHints = Partial<Record<CacheableResultMethod, CacheHint>>;

/** Catalog results are stable for a process lifetime; five minutes is generous but safe. */
const CATALOG_TTL_MS = 300_000;

/**
 * `resources/read` proxies live ManyChat data (page info, tags, custom fields).
 * A stale read is worse than a re-fetch, so it is always marked immediately stale.
 */
const LIVE_READ_TTL_MS = 0;

/**
 * Cache hints for the 2026-07-28 cacheable results.
 *
 * `cacheScope` is `"private"` for every method under `multi_tenant`: the visible
 * tool surface varies with the tenant's `capabilityBundle`, so a shared proxy
 * that treated a list as `"public"` could serve an `admin` tenant's catalog to a
 * `read_only` one. `resources/read` is `"private"` under every profile because
 * its payload is account data.
 */
export function resolveCacheHints(profile: McpCacheProfile): McpCacheHints {
  const catalogScope = profile === "multi_tenant" ? "private" : "public";

  return {
    "tools/list": { ttlMs: CATALOG_TTL_MS, cacheScope: catalogScope },
    "prompts/list": { ttlMs: CATALOG_TTL_MS, cacheScope: catalogScope },
    "resources/list": { ttlMs: CATALOG_TTL_MS, cacheScope: catalogScope },
    "resources/templates/list": { ttlMs: CATALOG_TTL_MS, cacheScope: catalogScope },
    "server/discover": { ttlMs: CATALOG_TTL_MS, cacheScope: catalogScope },
    "resources/read": { ttlMs: LIVE_READ_TTL_MS, cacheScope: "private" },
  };
}
