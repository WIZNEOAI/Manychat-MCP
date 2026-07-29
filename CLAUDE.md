# ManyChat CLI + MCP — Claude Code Context

## Project Identity

CLI-first ManyChat toolkit for agents and operators. Wraps the ManyChat Account Public API with a CLI, an MCP server (local stdio + remote HTTP), and a web control plane.

- **Binaries**: `manychat`, `manychat-mcp` → both point to `dist/index.js`
- **Version**: 0.1.0 (defined in `src/product.ts`)
- **License**: AGPL v3 or later
- **Repo**: github.com/WIZNEOAI/Manychat-MCP

## Commands

This is a **pnpm workspace** (root CLI/MCP + `apps/web`). Install once at the root: `pnpm install`.

```bash
# Root (CLI + MCP)
pnpm run lint     # tsc --noEmit
pnpm run build    # tsc
pnpm test         # vitest

# Web app (apps/web)
pnpm run web:dev      # Next.js dev server
pnpm run web:build    # production build
pnpm run web:lint     # eslint
pnpm run web:test     # vitest
pnpm run convex:dev   # convex dev server
```

## Architecture

```
src/
├── index.ts              # CLI entry (shebang), routes "mcp serve" to HTTP
├── server.ts             # MCP server factory: 28 tools (incl. validate_message wedge) + 6 prompts + 8 resources
├── product.ts            # Version constant
├── cli/app.ts            # CLI router (1,254 lines): doctor|page|tags|fields|flows|subscribers|send|raw
├── auth/
│   ├── manychat-client.ts  # REST client, 3 retries, exponential backoff on 429/5xx
│   ├── oauth.ts            # OAuth 2.0 + PKCE (SHA256)
│   ├── oauth-routes.ts     # Express: .well-known, /register, /authorize, /token, /revoke
│   └── oauth-store.ts      # MemoryOAuthStore + RedisOAuthStore
├── mcp/
│   ├── serve.ts            # Express + createMcpHandler (stateless), per-request credential resolution
│   ├── cache-hints.ts      # ttlMs/cacheScope per cacheable method (SEP-2549)
│   └── http-entry.ts       # Production HTTP entry
├── tools/                  # MCP tool groups
│   ├── subscribers.ts      # get, find, create, update
│   ├── tags.ts             # list, create, add/remove
│   ├── custom-fields.ts    # list, create, set (text/number/date/datetime/boolean)
│   ├── flows.ts            # list (with folders), send
│   ├── messaging.ts        # send content (Dynamic Content v2), send text
│   └── page.ts             # page info, bot fields, growth tools, OTN topics, health
├── resources/index.ts      # 8 MCP resources: page-info, tags, custom-fields, bot-fields, flows, otn-topics, subscriber-schema, api-limits
├── prompts/index.ts        # 6 agent prompts: onboard_subscriber, recover_lead, send_campaign, analyze_subscriber, segment_audience, diagnose_automation
├── types/manychat.ts       # TS interfaces: Page, Subscriber, Tag, CustomField, Flow, etc.
└── lib/logger.ts           # Structured JSON logging, secret redaction

tests/
├── cli.test.ts             # 5 tests: CLI commands with mocked API
├── manychat-client.test.ts # 3 tests: retry on 429, error handling
├── mcp-http-config.test.ts # 4 tests: HTTP config, localhost, prod OAuth, Railway
├── oauth.test.ts           # 3 tests: full OAuth flow (register→authorize→token→refresh→revoke)
├── stateless-multi-instance.test.ts # 3 processes behind round-robin, no sticky routing
└── mcp-2026-conformance.test.ts     # ttlMs/cacheScope, resultType, serverInfo _meta, error codes

apps/web/                   # Next.js 16 + React 19 + Tailwind 4
├── middleware.ts           # Clerk auth, protects /dashboard
└── convex/                 # Convex backend
    ├── schema.ts           # users (clerkUserId index), workspaces (ownerUserId, plan enum, stripeCustomerId)
    ├── users.ts, dashboard.ts, billing.ts, stripeActions.ts, http.ts
    └── auth.config.ts

docs/context/               # Product specs (read order in AGENTS.md)
skills/                     # Codex skills (manychat-mcp-ops)
```

## Key Conventions

- **MCP protocol revision `2026-07-28`**, served from `@modelcontextprotocol/server@2.0.0`
  (pinned exact) via `createMcpHandler`. 2025-era clients keep working through the
  handler's default `legacy: 'stateless'` leg; there are no protocol sessions and no
  `Mcp-Session-Id`, so `GET`/`DELETE /mcp` answer `405`.
- **Every request builds its own `McpServer`** from the credential resolved for that
  request. Nothing may be cached across requests except immutable registry data —
  tool/prompt schemas are hoisted to module scope for exactly that reason.
- **ESM-only** — `"type": "module"`, `NodeNext` module resolution
- **Strict TypeScript** — `strict: true`, target ES2022
- **stdout = machine-readable JSON** — diagnostics go to stderr only
- **API Key auth** is the default and only supported CLI path
- **Read-before-write, verify-after-write** for all mutating commands
- **CLI exit codes**: 0 success, 2 usage, 3 config, 4 API error, 5 rate limit

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `MANYCHAT_API_KEY` | API authentication | required |
| `MCP_TRANSPORT` | stdio or http | stdio |
| `MCP_REMOTE_AUTH` | manychat_header, oauth or hosted_token | manychat_header |
| `MCP_BASE_URL` | HTTP server base URL | — |
| `PORT` | HTTP server port | 3000 |
| `OAUTH_STORE` | memory or redis | memory |
| `REDIS_URL` | Redis connection | — |
| `LOG_LEVEL` | debug/info/warn/error | info |
| `RAILWAY_PUBLIC_DOMAIN` | Railway deployment URL | — |

## Deployment

- **Dockerfile**: multi-stage (Node 22-alpine, pnpm), exposes :3000
- **Gateway host**: EasyPanel/VPS (persistent, multi-tenant; Railway retired). Start `pnpm run start:mcp:http`, health `GET /health`.
- **apps/web**: Vercel + Convex + Clerk + Stripe.
- **Smithery**: schema with baseUrl, useOAuth, manychatApiKey

## Testing Patterns

- Tests use `vitest` with mocked HTTP responses (no real API calls)
- ManyChatClient tests verify retry logic and error classification
- OAuth tests cover full PKCE flow lifecycle
- CLI tests mock API and verify stdout JSON output
- **The full gate must pass before any commit**: root `pnpm test` (91) + `pnpm run web:test` (118), plus lint + build on both. There is no CI on PRs — see [CONTRIBUTING.md](CONTRIBUTING.md)

## What NOT to do

- Don't assume messages can be sent outside ManyChat channel policy windows
- Don't use OAuth/Redis paths for new features — those are legacy compatibility
- Don't introduce state that outlives a request in `src/mcp/serve.ts`; cross-call state
  must be a server-minted handle passed as a tool argument (2026-07-28 statelessness)
- Don't emit JSON-RPC codes in `-32000..-32019` (legacy sub-range) or `-32020..-32099`
  (reserved for the spec) from our own code
- Don't modify `apps/web` without reading `apps/web/AGENTS.md` first (Next.js 16 breaking changes)
- Don't add dependencies without checking both root and apps/web package.json
- Don't log secrets — `lib/logger.ts` has redaction, use it
- Don't add a plan/limits table to the gateway. Ceilings are enforced control-plane
  side; the gateway parses what it is sent per `docs/control-plane-contract.md`
