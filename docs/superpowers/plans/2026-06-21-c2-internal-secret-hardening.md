# C2 — Stop the control-plane secret transiting as a logged Convex arg

> Ready-to-run fix. **Do NOT run blind** — execute with the Convex `dev:dusty-lobster-832` deployment and a working gateway→Next→Convex resolve E2E so the auth path is verified, not just compiled.

## Problem

`getGatewayTokenByPrefix` (query), `recordGatewayEvent` and `authorizeGatewayRequest` (mutations) in `apps/web/convex/hosted.ts` are **public** Convex functions that take `internalSecret` as an argument. Convex logs public-function args, so the shared secret lands in query/mutation history. The Next.js internal API routes already verify the secret at their boundary (`assertInternalSecret`), so the in-Convex secret arg is a redundant-but-leaky second layer.

## Fix (header-authenticated httpAction + internal functions)

1. **`apps/web/convex/hosted.ts`** — convert the three functions from `query`/`mutation` to `internalQuery`/`internalMutation` (import from `./_generated/server`). Remove the `internalSecret` arg and the `assertControlPlaneSecret(args.internalSecret)` call from each. Keep `constantTimeEqual` exported for reuse.

2. **`apps/web/convex/http.ts`** — add three `httpAction`s on the convex `.site` router:
   - `POST /internal/mcp/resolve-token`, `/record-event`, `/authorize`.
   - Each reads the secret from an `x-control-plane-secret` **header** (headers are not logged as function args), verifies it timing-safe against `MCP_INTERNAL_SHARED_SECRET ?? HOSTED_CONTROL_PLANE_SECRET`, parses the JSON body, then `await ctx.runQuery(internal.hosted.getGatewayTokenByPrefix, …)` / `ctx.runMutation(internal.hosted.*)`. Return JSON.

3. **`apps/web/app/api/internal/mcp/resolve/route.ts`, `authorize/route.ts`, `record/route.ts`, and `app/api/v1/workspaces/[workspaceId]/mcp-tokens/test/route.ts`** — replace the `convex.query/mutation(api.hosted.*, { …, internalSecret })` calls with `fetch(${CONVEX_SITE_URL}/internal/mcp/…, { method: "POST", headers: { "x-control-plane-secret": requireInternalControlPlaneSecret(), "content-type": "application/json" }, body: JSON.stringify(args) })`. Derive `CONVEX_SITE_URL` from `NEXT_PUBLIC_CONVEX_URL` (`.convex.cloud` → `.convex.site`).

## Verification (the part that must NOT be skipped)

1. `npx convex dev --once` against `dev:dusty-lobster-832` — confirms the functions + httpActions typecheck and deploy.
2. `npm --prefix apps/web run build` — Next routes compile.
3. **Live resolve E2E**: with the gateway running in `hosted_token` mode pointed at the dev web app, issue a `mcp_live_*` token from the dashboard and run `get_page_info` through it. Confirm the token resolves, usage increments, and an `auth_failure` path still rejects a bad token. Confirm the secret no longer appears in Convex function-arg logs.
4. Re-run the `reviewer` subagent; flip the C2 item to fixed.

## Why header, not arg

Convex records public-function arguments in its dashboard/log history; it does not record request headers of an httpAction the same way. Moving the secret to a header + making the resolvers `internal*` removes both the logging exposure and the public callable surface.
