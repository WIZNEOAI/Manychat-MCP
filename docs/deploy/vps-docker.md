# Deploy on a VPS with Docker

This is the most direct self-host path for the remote MCP HTTP server.

Use this when you want:

- full control over your host
- reverse proxy + TLS on your own domain
- a clean separation between the CLI and the remote MCP gateway

## 1. Build the image

From the repo root:

```bash
docker build -t manychat-mcp:latest .
```

The container defaults to the production HTTP entrypoint:

```bash
node dist/mcp/http-entry.js
```

## 2. Header mode deployment

This is the recommended Phase 0 self-host setup.

### Option A: one ManyChat API key at the server level

```bash
docker run -d \
  --name manychat-mcp \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MCP_REMOTE_AUTH=manychat_header \
  -e MANYCHAT_API_KEY=mc_... \
  -e MCP_BASE_URL=https://mcp.example.com \
  manychat-mcp:latest
```

### Option B: each client sends its own ManyChat API key

```bash
docker run -d \
  --name manychat-mcp \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MCP_REMOTE_AUTH=manychat_header \
  -e MCP_BASE_URL=https://mcp.example.com \
  manychat-mcp:latest
```

In that mode, each remote MCP client must send:

```http
X-ManyChat-API-Key: mc_...
```

## 3. OAuth mode deployment

Use this only when you really need remote OAuth-style login.

Phase 0 requires Redis in production for OAuth token and authorization-code state.

### Create a dedicated Docker network

```bash
docker network create manychat-mcp
```

### Start Redis

```bash
docker run -d \
  --name manychat-redis \
  --restart unless-stopped \
  --network manychat-mcp \
  redis:7-alpine
```

### Start the MCP server

```bash
docker run -d \
  --name manychat-mcp \
  --restart unless-stopped \
  --network manychat-mcp \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MCP_REMOTE_AUTH=oauth \
  -e MCP_BASE_URL=https://mcp.example.com \
  -e OAUTH_STORE=redis \
  -e REDIS_URL=redis://manychat-redis:6379 \
  manychat-mcp:latest
```

## 4. Reverse proxy and TLS

Put the container behind HTTPS before exposing it to external MCP clients.

Required routes:

- `POST /mcp`
- `GET /mcp`
- `DELETE /mcp`
- `GET /health`
- optional OAuth endpoints when `MCP_REMOTE_AUTH=oauth`

Recommended proxy behavior:

- terminate TLS at the proxy
- forward all request headers
- keep request bodies untouched
- do not cache `/mcp`

## 5. Smoke checks

### Health

```bash
curl https://mcp.example.com/health
```

### Header-auth initialize prerequisite

If you are in per-client-key mode, validate that the server rejects missing
credentials with a clear error instead of failing silently:

```bash
curl -i -X POST https://mcp.example.com/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"smoke","version":"1.0.0"}}}'
```

Then test with a real client from `docs/connect/mcp-clients.md`.

## 5b. Hosted control plane (`hosted_token`) on Docker

When the MCP container acts as a **multi-tenant gateway**, users send a dashboard-issued bearer token and the container resolves the real ManyChat API key from your Next.js control plane:

```bash
docker run -d \
  --name manychat-mcp \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MCP_REMOTE_AUTH=hosted_token \
  -e MCP_BASE_URL=https://mcp.example.com \
  -e HOSTED_CONTROL_PLANE_URL=https://your-app.vercel.app \
  -e HOSTED_CONTROL_PLANE_SECRET=replace-with-shared-secret \
  manychat-mcp:latest
```

The same secret must be set on Vercel as `MCP_INTERNAL_SHARED_SECRET`. See [mcp-gateway-vps.md](./mcp-gateway-vps.md) and [production-beta.md](./production-beta.md).

You can also use root [docker-compose.yml](../../docker-compose.yml) and uncomment the hosted env lines.

## 6. Production warnings

### MCP sessions are still process-local

Phase 0 does **not** persist live MCP HTTP sessions in Redis yet.

So:

- run one replica
- expect reconnect after restart
- do not place this behind non-sticky multi-instance balancing

### Redis is required only for production OAuth in Phase 0

Redis currently hardens:

- OAuth clients
- authorization codes
- access tokens
- refresh tokens

It does **not** yet make active MCP HTTP sessions durable across restarts.

### Keep ManyChat API key handling simple

For the open-source self-host story, the clean default is still:

- `MANYCHAT_API_KEY` directly on the server, or
- `X-ManyChat-API-Key` directly from the client

OAuth is a compatibility layer for remote MCP clients that need it, not the core
product identity.
