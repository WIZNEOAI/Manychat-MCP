# ManyChat MCP Server

Open-source [Model Context Protocol](https://modelcontextprotocol.io/) server to automate ManyChat with AI agents.

## What this server does

- Exposes ManyChat operations as MCP tools/resources/prompts
- Supports `stdio` (local) and `http` (remote) transports
- Supports two HTTP auth modes:
  - MCP OAuth bearer tokens (`Authorization: Bearer <token>`)
  - Direct BYO ManyChat API key (`X-ManyChat-API-Key: <key>`)

## Auth model (important)

This project has two separate auth layers:

1. **ManyChat authentication**
   - Uses user-provided ManyChat API keys
   - This server does **not** implement native ManyChat OAuth
2. **MCP authentication**
   - OAuth 2.0 Authorization Code + PKCE for MCP clients
   - Tokens map to each user’s ManyChat API key in the OAuth store

## Features

- 24 tools for subscribers, tags, fields, flows, messaging, and page operations
- 8 MCP resources and 6 reusable prompts
- Retry/backoff and structured logs
- OAuth store backends:
  - `memory` for local development
  - `redis` for production multi-instance deployments

## Quick start

```bash
git clone https://github.com/gnosix/manychat-mcp.git
cd manychat-mcp
npm install
cp .env.example .env
npm run build
```

For local stdio usage, set:

```env
MANYCHAT_API_KEY=your_key_here
MCP_TRANSPORT=stdio
```

Run:

```bash
npm start
```

## HTTP server mode

Set:

```env
MCP_TRANSPORT=http
BASE_URL=https://your-domain.example
```

Run:

```bash
npm start
```

Health check:

- `GET /health`

MCP endpoint:

- `POST /mcp`

OAuth discovery:

- `GET /.well-known/oauth-protected-resource`
- `GET /.well-known/oauth-authorization-server`

## OAuth configuration

Environment variables:

| Variable | Required | Default | Description |
|---|---|---|---|
| `OAUTH_STORE` | no | `memory` | `memory` or `redis` |
| `REDIS_URL` | when `OAUTH_STORE=redis` | - | Redis/Upstash connection URL |
| `OAUTH_AUTH_CODE_TTL_SEC` | no | `300` | Authorization code TTL |
| `OAUTH_ACCESS_TOKEN_TTL_SEC` | no | `3600` | Access token TTL |
| `OAUTH_REFRESH_TOKEN_TTL_SEC` | no | `2592000` | Refresh token TTL |

Production safety:

- `NODE_ENV=production` requires `OAUTH_STORE=redis` and `REDIS_URL`

## Transport auth contract

For HTTP `/mcp`, clients can send either:

1. `Authorization: Bearer <mcp_access_token>`
2. `X-ManyChat-API-Key: <manychat_api_key>`

If both are present, bearer token resolution is attempted first.

## Deploy on Railway

1. Create Railway project from this repo
2. Set env vars:
   - `MCP_TRANSPORT=http`
   - `BASE_URL=https://<your-railway-domain>`
   - `NODE_ENV=production`
   - `OAUTH_STORE=redis`
   - `REDIS_URL=<your-redis-url>`
3. Deploy
4. Validate:
   - `GET /health`
   - OAuth well-known endpoints
   - `POST /mcp` initialize request

## Publish in Smithery

This repo includes [`smithery.yaml`](smithery.yaml) for Smithery registry config.

Steps:

1. Ensure deployed HTTPS MCP endpoint is reachable
2. Keep `smithery.yaml` in repo root
3. Publish/update registry entry via Smithery workflow
4. Test install from Smithery and confirm `/mcp` connection

## Endpoint coverage matrix

See [`docs/manychat-endpoint-matrix.md`](docs/manychat-endpoint-matrix.md) for ManyChat endpoint-to-tool mapping and verification notes.

## Skills for agents

Repo includes a production-oriented skill at:

- `skills/manychat-mcp-ops`

It contains:

- `SKILL.md`
- `references/` for tool maps and troubleshooting
- `scripts/` for smoke tests and connection checks
- Install/sync notes: [`docs/skills.md`](docs/skills.md)

## Release workflow (recommended)

1. `npm run lint`
2. `npm test`
3. `npm run build`
4. Verify OAuth + MCP contract on staging
5. Tag release
6. Deploy Railway
7. Publish/update Smithery entry
8. Run post-release smoke checks

Rollback:

- Redeploy previous Git tag
- Re-run health and OAuth discovery checks
- Full checklist: [`docs/release.md`](docs/release.md)

## Development commands

```bash
npm run dev
npm run lint
npm test
npm run build
```

## License

MIT. See [LICENSE](LICENSE).
