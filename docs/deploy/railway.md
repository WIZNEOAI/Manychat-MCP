# Deploy on Railway

This guide is for the **remote MCP HTTP** surface. The CLI stays the primary product;
Railway is one of the shorter paths to putting the MCP gateway behind HTTPS. The same
variables work on any container platform — see [vps-docker.md](./vps-docker.md) for the
Docker route and [mcp-gateway-vps.md](./mcp-gateway-vps.md) for a VM.

## What Railway runs

Set the start command explicitly:

```bash
pnpm run start:mcp:http
```

That command starts:

- `POST /mcp`
- `GET /health`
- optional OAuth discovery routes when `MCP_REMOTE_AUTH=oauth`

It uses `PORT` automatically.

## Production modes

Choose **one** auth mode before deploy:

| Mode | `MCP_REMOTE_AUTH` | Best for | Redis required |
| --- | --- | --- | --- |
| Header / direct ManyChat key | `manychat_header` | simple self-host, agencies, single workspace | no |
| OAuth / MCP token | `oauth` | Claude Desktop remote connectors, hosted-style UX | yes |
| Hosted control plane | `hosted_token` | a gateway in front of your own control plane | no |

## Minimal environment for header mode

Set these Railway variables:

```env
NODE_ENV=production
MCP_REMOTE_AUTH=manychat_header
```

Then choose one execution-credential pattern:

### Option A: one ManyChat key for the whole deployment

```env
MANYCHAT_API_KEY=mc_...
```

Every connected MCP client uses the server-level ManyChat API key.

### Option B: each client sends its own ManyChat key

Do **not** set `MANYCHAT_API_KEY`.

Clients must send:

```http
X-ManyChat-API-Key: mc_...
```

This keeps the product story API-key-first without needing OAuth.

## Environment for OAuth mode

Set these Railway variables:

```env
NODE_ENV=production
MCP_REMOTE_AUTH=oauth
MCP_BASE_URL=https://your-service.up.railway.app
OAUTH_STORE=redis
REDIS_URL=redis://...
```

Important:

- production OAuth will fail fast unless `OAUTH_STORE=redis`
- `MCP_BASE_URL` must be a stable public HTTPS URL
- OAuth is for the MCP client credential layer; ManyChat API keys still remain the
  execution credential underneath

## Environment for hosted_token mode

Hosted mode keeps ManyChat API keys off the MCP client: the gateway resolves a bearer
token against a control plane that holds the vault. Ours is a separate proprietary
codebase, so this mode is only useful if you run a control plane of your own that speaks
[the documented contract](../control-plane-contract.md).

```env
NODE_ENV=production
MCP_REMOTE_AUTH=hosted_token
HOSTED_CONTROL_PLANE_URL=https://your-control-plane.example.com
HOSTED_CONTROL_PLANE_SECRET=replace-with-a-long-random-shared-secret
```

The control plane must set the same value as `MCP_INTERNAL_SHARED_SECRET`. Flow:

1. the MCP client sends `Authorization: Bearer mcp_live_...`
2. the gateway calls `POST /api/internal/mcp/resolve` on the control plane
3. the control plane verifies the token hash, applies its own limits, decrypts the ManyChat key, and returns the execution credential
4. the gateway uses that key for the request without exposing it to the client

The vault master key lives only on the control plane; the gateway keeps no plan table and
no credential store of its own.

## Deploy commands

If you use the Railway CLI:

```bash
railway login
railway link
railway variables set NODE_ENV=production
railway variables set MCP_REMOTE_AUTH=manychat_header
railway variables set MANYCHAT_API_KEY=mc_...
railway up
```

If you are using OAuth mode:

```bash
railway variables set NODE_ENV=production
railway variables set MCP_REMOTE_AUTH=oauth
railway variables set MCP_BASE_URL=https://your-service.up.railway.app
railway variables set OAUTH_STORE=redis
railway variables set REDIS_URL=redis://...
railway up
```

If you prefer the Railway dashboard, the same variables apply there.

## A CDN or WAF in front

Optional, and worth it once the gateway is public. A reasonable baseline:

- proxy the Railway hostname through Cloudflare or an equivalent
- enable WAF managed rules
- rate-limit `POST /mcp`, `GET /health`, and the auth helper routes
- cap burst traffic per IP before it reaches the gateway

## Health check

After deploy:

```bash
curl https://your-service.up.railway.app/health
```

Expected shape:

```json
{
  "status": "ok",
  "server": "manychat-mcp",
  "version": "0.1.0",
  "transport": "http",
  "authMode": "manychat_header",
  "baseUrl": "https://your-service.up.railway.app"
}
```

## Verify the MCP endpoint

At minimum, verify the server answers on `/mcp` and returns a session error instead
of crashing:

```bash
curl -i https://your-service.up.railway.app/mcp
```

For a real smoke test, use an MCP client from `docs/connect/mcp-clients.md`.

## Production warnings

### 1. Replicas are fine; sticky routing is not needed

MCP revision `2026-07-28` removed protocol sessions, so any request may land on any
instance. Scale `numReplicas` freely. `tests/stateless-multi-instance.test.ts` drives a
full MCP flow across three processes behind round-robin routing.

### 2. OAuth without Redis is not production-safe

Authorization codes, refresh tokens, and access tokens must survive process restarts, so
the server refuses to start production OAuth without Redis.

### 3. Header mode is simpler than OAuth

If you do not need Claude Desktop remote connectors or hosted-style login, use:

```env
MCP_REMOTE_AUTH=manychat_header
```

That is the cleanest open-source self-host path.

### 4. hosted_token needs a control plane

Use hosted mode only if you run a control plane that implements
[the contract](../control-plane-contract.md): token verification, a credential vault, and
usage recording. For a single team, `manychat_header` is simpler and needs none of it.
