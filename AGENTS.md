# AGENTS.md

Agent entry point for the root of the ManyChat CLI + MCP repository.

## Product identity

This codebase is a **CLI-first ManyChat toolkit** for agents and operators.

Primary product:
- `manychat` CLI
- API-key-first access to the ManyChat Account Public API
- JSON-first output for automation and scripting

Compatibility and secondary surfaces:
- `manychat mcp serve` for MCP clients
- remote MCP over HTTP for self-hosted deployments
- `apps/web` for the web shell / hosted control-plane direction

Treat the CLI as the source of truth. MCP and web layers should reuse the same execution model rather than redefining product behavior.

## Read this first

Read in this order before making product or architecture changes:

1. `README.md`
2. `docs/context/product-baseline.md`
3. `docs/context/manychat-official-baseline.md`
4. `docs/context/cli-spec.md`
5. `docs/context/safety-model.md`
6. `docs/context/mcp-migration-map.md`

Helpful supplemental context:
- `CLAUDE.md` for repo-specific command and architecture notes
- `docs/deploy/*.md` for hosting behavior
- `docs/product/*.md` for hosted control-plane direction

## Core rules

- Treat **API key auth** as the default and only supported auth path for the CLI.
- Treat MCP OAuth, Redis token stores, and HTTP MCP session machinery as **compatibility concerns**, not the core product.
- Prefer **read-before-write** and **verify-after-write** for mutating workflows.
- Do **not** assume messages can be sent outside ManyChat / Meta policy windows.
- Keep **stdout machine-readable**. Put diagnostics and human-facing logs on **stderr**.
- Preserve **strict TypeScript**, **ESM-only** behavior, and current CLI exit code semantics.
- Do not log secrets. Use the existing redacting logger utilities.

## Repository map

### Root runtime

- `src/index.ts` — CLI entrypoint and MCP routing
- `src/cli/app.ts` — main CLI command router
- `src/core/manychat-client.ts` — typed ManyChat API execution layer
- `src/auth/manychat-client.ts` — compatibility re-export used by MCP codepaths
- `src/server.ts` — MCP server factory
- `src/mcp/` — HTTP/stdio MCP serving and transport glue
- `src/tools/` — MCP tool groups (`subscribers`, `tags`, `custom-fields`, `flows`, `messaging`, `page`)
- `src/resources/index.ts` — MCP resources
- `src/prompts/index.ts` — MCP prompts
- `src/lib/logger.ts` — structured logging and secret redaction
- `src/types/manychat.ts` — shared API types

### Web app

- `apps/web/` — Next.js 16 + React 19 + Tailwind 4 + Clerk + Convex

If you touch anything under `apps/web`, **read `apps/web/AGENTS.md` first** and follow its Next.js-specific constraints.

### Tests

- `tests/cli.test.ts`
- `tests/manychat-client.test.ts`
- `tests/mcp-http-config.test.ts`
- `tests/oauth.test.ts`

Tests are mocked and should not require live ManyChat API access.

## Command reference

Run from the repository root unless stated otherwise.

### Root

```bash
npm run lint
npm test
npm run build
```

### CLI / MCP

```bash
npm start
npm run start:mcp:stdio
npm run start:mcp:http
```

### Web

```bash
npm run web:dev
npm run web:build
npm run web:lint
npm run convex:dev
npm run convex:deploy
```

## Primary CLI surface

- `manychat doctor`
- `manychat page info`
- `manychat tags list|create`
- `manychat fields list|create|set|set-bulk`
- `manychat flows list|send`
- `manychat subscribers get|find|create|update`
- `manychat subscribers tags add|remove`
- `manychat send text|content`
- `manychat raw get|post`
- `manychat mcp serve`

## Output and behavior contracts

When editing CLI behavior:

- keep JSON on `stdout`
- keep diagnostics on `stderr`
- preserve exit codes:
  - `0` success
  - `2` usage / invalid input
  - `3` auth or config error
  - `4` ManyChat API error
  - `5` rate limit or retry exhaustion

When editing API behavior:

- preserve retry and error classification behavior in the ManyChat client
- do not silently widen write behavior
- keep safety assumptions explicit around delivery windows and message eligibility

When editing MCP behavior:

- keep the CLI-first layering intact
- preserve local stdio support
- preserve HTTP MCP support and `GET /health`
- only expose OAuth discovery and related routes when OAuth mode is enabled

## Environment variables

Most commonly relevant:

- `MANYCHAT_API_KEY`
- `MCP_TRANSPORT`
- `MCP_REMOTE_AUTH`
- `MCP_BASE_URL`
- `PORT`
- `OAUTH_STORE`
- `REDIS_URL`
- `LOG_LEVEL`
- `RAILWAY_PUBLIC_DOMAIN`

## Change guidance by area

### CLI changes

- Keep the CLI ergonomic for operators, but machine-readable by default.
- Avoid introducing flows that require browser-based auth or hosted state for normal CLI use.

### ManyChat API integration

- Prefer implementing new behavior in the shared client / execution layer first.
- Keep request and response modeling close to the official ManyChat API.
- Verify mutating commands with a follow-up read when practical.

### MCP changes

- Reuse the same behavior as the CLI wherever possible.
- Do not let MCP-only abstractions become the primary domain model.

### Web / control plane changes

- The web app is important, but it is not the runtime source of truth for ManyChat execution.
- Read `apps/web/AGENTS.md` before editing web code.
- Follow Convex schema/function rules when touching the Convex backend.

## Validation expectations

Choose the smallest relevant validation set for the area you changed:

- root TypeScript changes: `npm run lint && npm test && npm run build`
- MCP transport or auth changes: always run tests
- web-only changes: `npm run web:lint && npm run web:build`
- Convex-facing web changes: run the relevant web checks and validate generated types / schema usage

## Non-goals for v1

- Native ManyChat app distribution via `App Key`
- CLI-managed OAuth login flows
- Reframing OAuth as the primary product auth story
- Promising deliverability outside ManyChat and Meta policy windows
