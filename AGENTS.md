# Agent Entry Point

This repository is a CLI-first ManyChat toolkit.

Primary product:
- `manychat` CLI
- API-key-first access to the ManyChat Account Public API
- JSON-first output for automation and agent consumption

Secondary product:
- MCP compatibility mode through `manychat mcp serve`

Read in this order:
1. `README.md`
2. `docs/context/product-baseline.md`
3. `docs/context/manychat-official-baseline.md`
4. `docs/context/cli-spec.md`
5. `docs/context/safety-model.md`
6. `docs/context/mcp-migration-map.md`

Core rules:
- Treat `API Key` auth as the default and only supported auth path for the CLI.
- Treat MCP OAuth, Redis token stores, and HTTP MCP sessions as legacy compatibility concerns.
- Prefer read-before-write and verify-after-write when calling mutating commands.
- Do not assume messages can be sent outside channel policy windows.
- Keep stdout machine-readable. Put diagnostics on stderr.

Primary CLI surface:
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

Non-goals for v1:
- Native ManyChat app distribution via `App Key`
- CLI-managed OAuth login flows
- Promising deliverability outside ManyChat and Meta policy windows

## Cursor Cloud specific instructions

### Services overview

| Service | How to run | Notes |
|---|---|---|
| CLI (dev) | `npx tsx src/index.ts <command>` | Runs TypeScript directly; no build step needed |
| CLI (built) | `node dist/index.js <command>` | Requires `npm run build` first |
| MCP HTTP server | `MCP_TRANSPORT=http npx tsx src/index.ts mcp serve --port 3000` | Exposes `/mcp` and `/health` |

### Standard commands

Lint, test, and build commands are in `package.json`:
- `npm run lint` — type-check via `tsc --noEmit`
- `npm test` — runs `vitest run` (all tests use mocked fetch; no external services required)
- `npm run build` — compiles to `dist/`

### Non-obvious caveats

- All CLI commands that hit the ManyChat API require `MANYCHAT_API_KEY` (via `--api-key` flag, env var, or profile). Without it, commands exit with a JSON error (`config_error`) on stdout — this is expected, not a crash.
- Diagnostics/logs are written to **stderr** as structured JSON. Only command output goes to stdout.
- The MCP HTTP server defaults to `OAUTH_STORE=memory` in dev; Redis is only needed when `OAUTH_STORE=redis`.
- No Docker, Redis, or other external services are needed for local development or running the test suite.
