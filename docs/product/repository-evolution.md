# Repository evolution — web, API, and MCP service

This repo stays **CLI-first** and keeps `src/core`, `src/cli`, and `src/mcp` as the
runtime source of truth until a deliberate split. The goal here is a **clear,
low-risk path** toward a hosted product without a big-bang migration.

## Today (single package)

```text
src/
  core/     # ManyChat client + shared execution
  cli/      # Primary operator surface
  mcp/      # MCP adapter; http-entry for production HTTP
apps/
  web/      # Next.js marketing + docs + dashboard shell
docs/
```

- Root `npm run build` produces CLI + MCP artifacts.
- `npm run start:mcp:http` runs the HTTP MCP entrypoint explicitly.
- `apps/web` is an independent Next.js app with no backend coupling yet.

## Near future — add `apps/api` (control plane)

When hosted auth and persistence land:

```text
apps/
  web/      # Calls apps/api; still static/SSR marketing
  api/      # Workspace, vault, tokens, usage, billing webhooks
```

- **Owns:** sessions, Postgres (or equivalent), encrypted key storage, MCP token
  issuance metadata, usage aggregation.
- **Does not replace:** ManyChat execution in `src/core`; the MCP gateway still
  calls the same primitives after resolving tenant credentials.

Suggested stack (indicative): Node or a small framework, Prisma/Drizzle + Postgres,
same repo, deployed as a second Railway service or container.

## Near future — optional `apps/mcp` or dedicated MCP image

Two valid patterns:

1. **Thin gateway package** — new `apps/mcp` that imports built artifacts from
   `dist/` or a future `packages/manychat-mcp` and adds only HTTP + tenant
   resolution.
2. **Same binary, two deploy targets** — keep `src/mcp/http-entry.ts` but deploy
   it as its own service with different env (no dashboard, no Postgres in-process).

Criteria to split:

- different scaling profile (MCP connections vs REST)
- independent deploy cadence
- stricter network boundary (public MCP vs private API)

## Longer term — optional `packages/*`

Extract when duplication hurts:

- `packages/manychat-core` — typed client + retries (from `src/core`)
- `packages/cli` — thin wrapper if bin packaging needs isolation
- `packages/mcp-server` — MCP registration + tools

**Rule:** extract only after the second consumer (e.g. `apps/api` needs the same
types as `src/mcp`) stabilizes.

## Principles (do not break)

1. **CLI remains the source of truth** for command behavior and JSON contracts.
2. **ManyChat API key** remains the execution credential; hosted stores it, MCP
   clients never see it.
3. **MCP is transport + packaging**, not the product definition.
4. **OSS self-host** must keep working with env + header auth without Postgres.

See also: [`open-source-saas-blueprint.md`](../open-source-saas-blueprint.md),
[`hosted-control-plane.md`](./hosted-control-plane.md),
[`control-plane-contracts.md`](./control-plane-contracts.md).
