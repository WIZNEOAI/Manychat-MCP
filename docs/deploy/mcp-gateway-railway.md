# MCP gateway on Railway (hosted_token)

This complements [railway.md](./railway.md) with the **hosted SaaS** path: gateway resolves product tokens against your Vercel/Next control plane.

## Environment

```env
NODE_ENV=production
MCP_REMOTE_AUTH=hosted_token
PORT=3000
MCP_BASE_URL=https://your-service.up.railway.app
HOSTED_CONTROL_PLANE_URL=https://your-app.vercel.app
HOSTED_CONTROL_PLANE_SECRET=<same as MCP_INTERNAL_SHARED_SECRET on Vercel>
```

## Start command

```bash
npm run start:mcp:http
```

Railway should expose **one** instance for MCP HTTP (sessions are process-local). See [railway.md](./railway.md) for scaling caveats.

## Verification

1. `GET /health` returns `status: ok` and `authMode` consistent with config.
2. Dashboard-issued token works with `Authorization: Bearer ...` on `POST /mcp`.
3. Control plane receives calls to `/api/internal/mcp/resolve`, `/authorize`, `/record` (check Vercel logs in beta).

## Troubleshooting

| Symptom | Check |
| --- | --- |
| 401 on resolve | Secret mismatch; token revoked; wrong `HOSTED_CONTROL_PLANE_URL` |
| 429 from control plane | Workspace hit daily/monthly limits (dashboard usage panel) |
| OAuth errors | You are not in `oauth` mode; hosted uses static shared secret only |
