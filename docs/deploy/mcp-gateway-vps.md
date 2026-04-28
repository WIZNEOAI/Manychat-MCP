# MCP gateway on a VPS (Docker)

Use this when running the HTTP MCP server on your own VM with Docker. For build instructions see [vps-docker.md](./vps-docker.md).

## Self-host with direct ManyChat API key

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

Or use [docker-compose.yml](../../docker-compose.yml) at the repo root with a `.env` file containing `MANYCHAT_API_KEY`.

## Hosted multi-tenant gateway (hosted_token)

The gateway does **not** store ManyChat keys; it calls your Vercel app:

```bash
docker run -d \
  --name manychat-mcp \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MCP_REMOTE_AUTH=hosted_token \
  -e MCP_BASE_URL=https://mcp.example.com \
  -e HOSTED_CONTROL_PLANE_URL=https://your-app.vercel.app \
  -e HOSTED_CONTROL_PLANE_SECRET=your-shared-secret \
  manychat-mcp:latest
```

## Reverse proxy

- Terminate TLS at nginx, Caddy, or Traefik.
- Forward `POST /mcp`, `GET /mcp`, `DELETE /mcp`, and `GET /health`.
- Do not cache `/mcp`.

## Health check

```bash
curl -fsS https://mcp.example.com/health
```

Docker Compose includes a `healthcheck` using Node `fetch` against `/health`.
