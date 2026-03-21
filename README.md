# ManyChat CLI + MCP

CLI-first toolkit for operating ManyChat through the Account Public API, with MCP
available as a compatibility and remote-access layer.

## What this product is

This repo is building the **agent operating layer for ManyChat**:

- **primary product:** `manychat` CLI
- **compatibility layer:** MCP server for local and remote MCP clients
- **deployment story:** self-host first (local, Railway, VPS/Docker)
- **future direction:** hosted remote MCP + web control plane

The core product identity is still:

> Bring your ManyChat API key, run the CLI or connect an MCP client, and operate
> ManyChat safely in minutes.

## Product surfaces

| Surface | Purpose | Status |
| --- | --- | --- |
| CLI | source of truth for execution and automation | primary |
| MCP local (`stdio`) | local compatibility for MCP clients | supported |
| MCP remote (`HTTP`) | self-hosted remote access layer | supported |
| Hosted SaaS | future control plane, tokens, billing, docs UX | not in Phase 0 |

## The auth model in one minute

### CLI

The CLI is **API-key-first**:

- `--api-key`
- `MANYCHAT_API_KEY`
- local profile

### Remote MCP

Phase 0 supports two remote auth patterns:

1. **direct ManyChat execution credential**
   - `MANYCHAT_API_KEY` on the server, or
   - `X-ManyChat-API-Key` from the client

2. **OAuth / bearer token**
   - for remote MCP clients that need it
   - production requires Redis-backed OAuth state

Important:

- the ManyChat API key remains the **execution credential**
- OAuth is a **client access layer**, not the core product identity

## Official source of truth

This repo is grounded in official ManyChat documentation:

- API key generation and parameter discovery:
  https://help.manychat.com/hc/en-us/articles/14959510331420-How-to-generate-a-token-for-the-Manychat-API-and-where-to-get-parameters
- App-based API access model, documented only as a v1 boundary:
  https://help.manychat.com/hc/en-us/articles/14281269835548-Dev-Program-Obtaining-API-Access-through-Apps
- Messaging windows and policy constraints:
  https://help.manychat.com/hc/en-us/articles/23358636027932-Understanding-messaging-windows
  https://help.manychat.com/hc/en-us/articles/14281199732892-How-to-send-messages-outside-the-24-hour-and-7-day-windows-in-Messenger-and-Instagram

## Quick start

### 1. Install and build

```bash
git clone https://github.com/gnosix/manychat-mcp.git
cd manychat-mcp
npm install
npm run build
```

### 2. Set your ManyChat API key

```env
MANYCHAT_API_KEY=mc_...
```

### 3. Run the CLI

```bash
node dist/index.js doctor
node dist/index.js page info
node dist/index.js tags list
```

## Quick start by surface

### CLI

```bash
node dist/index.js doctor
node dist/index.js subscribers get --subscriber-id 123
node dist/index.js tags list
```

### Local MCP over stdio

```bash
node dist/index.js mcp serve --transport stdio
```

### Remote MCP over HTTP

```bash
NODE_ENV=production \
MCP_REMOTE_AUTH=manychat_header \
MANYCHAT_API_KEY=mc_... \
PORT=3000 \
npm run start:mcp:http
```

Health check:

```bash
curl http://localhost:3000/health
```

## Stable production startup contract

Phase 0 removes the ambiguous "maybe CLI, maybe HTTP MCP" production behavior.

### Explicit commands

- CLI:

  ```bash
  npm start
  ```

- remote MCP HTTP:

  ```bash
  npm run start:mcp:http
  ```

- local MCP stdio:

  ```bash
  npm run start:mcp:stdio
  ```

### Production HTTP expectations

- uses `PORT`
- exposes `GET /health`
- exposes `POST /mcp`
- only exposes OAuth discovery routes when `MCP_REMOTE_AUTH=oauth`

## Production modes

| Mode | Required env | Best for |
| --- | --- | --- |
| `manychat_header` | `NODE_ENV=production`, `MCP_REMOTE_AUTH=manychat_header` | simplest open-source self-host |
| `oauth` | `NODE_ENV=production`, `MCP_REMOTE_AUTH=oauth`, `OAUTH_STORE=redis`, `REDIS_URL`, `MCP_BASE_URL` | remote OAuth connectors |

## Deployment docs

- Railway: [`docs/deploy/railway.md`](docs/deploy/railway.md)
- VPS + Docker: [`docs/deploy/vps-docker.md`](docs/deploy/vps-docker.md)

## MCP client connection docs

- Claude Code / Cursor / Codex / Claude Desktop:
  [`docs/connect/mcp-clients.md`](docs/connect/mcp-clients.md)

## CLI surface

Core commands:

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

Global flags:

- `--api-key`
- `--profile`
- `--base-url`
- `--json`
- `--pretty`
- `--verbose`
- `--quiet`

Output contract:

- JSON on `stdout`
- diagnostics on `stderr`
- exit codes:
  - `0` success
  - `2` invalid input
  - `3` auth/config error
  - `4` ManyChat API error
  - `5` rate limit or retry exhaustion

## CLI-first and MCP-second, explicitly

This repository is **not** trying to replace the CLI with MCP.

The intended layering is:

1. `src/core/` — typed ManyChat execution layer
2. `src/cli/` — primary operator and automation surface
3. `src/mcp/` — compatibility and remote access layer

That means:

- CLI remains the source of truth
- MCP reuses the same execution layer
- frontend and hosted control plane come later

## Self-host now, SaaS later

Today:

- local self-host
- Railway self-host
- VPS/Docker self-host
- bring your own ManyChat API key

Later:

- managed remote MCP
- token issuance and workspace model
- docs + onboarding UI
- dashboard and audit views

The open-source story should stay excellent even before the SaaS exists.

## Safety notes

- do not assume automated sends are safe outside the 24-hour window
- do not treat Message Tags as the default Messenger fallback after February 9, 2026
- prefer read-before-write and verify-after-write for mutations
- keep stdout machine-readable and diagnostics on stderr

## Architecture and product docs

- Agent entrypoint: [`AGENTS.md`](AGENTS.md)
- Product baseline: [`docs/context/product-baseline.md`](docs/context/product-baseline.md)
- Official ManyChat constraints:
  [`docs/context/manychat-official-baseline.md`](docs/context/manychat-official-baseline.md)
- CLI spec: [`docs/context/cli-spec.md`](docs/context/cli-spec.md)
- Safety model: [`docs/context/safety-model.md`](docs/context/safety-model.md)
- MCP migration map: [`docs/context/mcp-migration-map.md`](docs/context/mcp-migration-map.md)
- Open-source + SaaS blueprint:
  [`docs/open-source-saas-blueprint.md`](docs/open-source-saas-blueprint.md)
- Phase 1 frontend scaffold plan:
  [`docs/product/phase-1-web-scaffold.md`](docs/product/phase-1-web-scaffold.md)

## Development

```bash
npm run lint
npm test
npm run build
```

## License

MIT. See `LICENSE`.
