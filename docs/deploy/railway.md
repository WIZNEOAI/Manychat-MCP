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
| Hosted control plane | `hosted_token` | Vercel dashboard + Convex + Railway gateway | no |

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

Hosted mode keeps ManyChat API keys off the MCP client and moves vaulting +
authorization into the web control plane.

Set these Railway variables:

```env
NODE_ENV=production
MCP_REMOTE_AUTH=hosted_token
HOSTED_CONTROL_PLANE_URL=https://your-app.vercel.app
HOSTED_CONTROL_PLANE_SECRET=replace-with-a-long-random-shared-secret
```

Set the matching secret on the Vercel app:

```env
MCP_INTERNAL_SHARED_SECRET=replace-with-the-same-shared-secret
VAULT_MASTER_KEY=replace-with-a-long-random-vault-key
VAULT_KEY_VERSION=v1
NEXT_PUBLIC_CONVEX_URL=https://...
```

Hosted mode flow:

1. the MCP client sends `Authorization: Bearer mcp_live_...`
2. Railway calls `POST /api/internal/mcp/resolve` on the web control plane
3. the control plane verifies the token hash, checks plan limits, decrypts the ManyChat key, and returns the execution credential
4. Railway injects that key into the MCP runtime without exposing it to the client

Important:

- `HOSTED_CONTROL_PLANE_SECRET` on Railway and `MCP_INTERNAL_SHARED_SECRET` on Vercel must match
- `VAULT_MASTER_KEY` exists only on the control plane; do not put it on Railway
- hosted request quotas are enforced during token resolution and recorded back into the control plane

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

## Cloudflare in front of Railway

For the hosted SaaS deployment, place Cloudflare in front of the Railway public URL.

Recommended baseline:

- proxy the Railway hostname through Cloudflare
- enable WAF managed rules
- add rate limits on `POST /mcp`, `GET /health`, and the auth helper routes
- restrict burst traffic per IP before it hits Railway
- keep Vercel for the dashboard/docs domain and Railway for the MCP gateway domain

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

### 4. hosted_token is the SaaS path, not the OSS path

Use hosted mode only when you have the web control plane deployed with:

- Clerk auth
- Convex workspace data
- encrypted ManyChat vault
- MCP product token issuance

If you only need a single-team deployment, `manychat_header` remains the simpler option.
