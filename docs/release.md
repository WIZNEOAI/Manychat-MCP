# Release guide

## Prerequisites

- Green gate for `lint`, `test`, `build`
- Gateway host configured (see [docs/deploy/](./deploy/))
- Redis available when the production auth mode is OAuth
- `smithery.yaml` present and valid

## Release steps

1. Merge to main
2. Tag version (`vX.Y.Z`)
3. Deploy the gateway
4. Validate:
   - `/health`
   - MCP initialize call on `/mcp`
   - if `MCP_REMOTE_AUTH=oauth`:
     - `/.well-known/oauth-protected-resource`
     - `/.well-known/oauth-authorization-server`
5. Publish/update Smithery listing
6. Run smoke script:
   - `node skills/manychat-mcp-ops/scripts/smoke_http_mcp.mjs`

## Runtime contract

Start the HTTP MCP server explicitly:

```bash
pnpm run start:mcp:http
```

Do not rely on `node dist/index.js` alone for production HTTP MCP deploys — that is the
CLI entrypoint, not `dist/mcp/http-entry.js`.

## Rollback

1. Redeploy previous stable tag
2. Re-run health and OAuth discovery checks
3. Re-run smoke script
4. Announce rollback reason and follow-up fix ETA
