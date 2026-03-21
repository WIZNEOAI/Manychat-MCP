# Deploy on Railway

This guide is for the **remote MCP HTTP** surface.

The CLI remains the primary product, but Railway is the quickest way to self-host
the MCP compatibility layer behind HTTPS.

## What Railway runs

Phase 0 makes Railway use a single explicit production command:

```bash
npm run start:mcp:http
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

### 1. Railway must stay single-replica

Phase 0 keeps MCP HTTP sessions in process memory.

That means:

- keep `numReplicas = 1`
- clients must reconnect after restarts
- do not expect cross-replica session sharing yet

### 2. OAuth without Redis is not production-safe

Authorization codes, refresh tokens, and access tokens must survive process
restarts. Phase 0 enforces Redis for this mode.

### 3. Header mode is simpler than OAuth

If you do not need Claude Desktop remote connectors or hosted-style login, use:

```env
MCP_REMOTE_AUTH=manychat_header
```

This is the cleanest open-source self-host path for Phase 0.
