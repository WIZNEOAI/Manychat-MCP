# Release guide

## Prerequisites

- Green CI for `lint`, `test`, `build`
- Railway project configured
- Redis available for production OAuth store
- `smithery.yaml` present and valid

## Release steps

1. Merge to main
2. Tag version (`vX.Y.Z`)
3. Deploy to Railway
4. Validate:
   - `/health`
   - `/.well-known/oauth-protected-resource`
   - `/.well-known/oauth-authorization-server`
   - MCP initialize call on `/mcp`
5. Publish/update Smithery listing
6. Run smoke script:
   - `node skills/manychat-mcp-ops/scripts/smoke_http_mcp.mjs`

## Rollback

1. Redeploy previous stable tag
2. Re-run health and OAuth discovery checks
3. Re-run smoke script
4. Announce rollback reason and follow-up fix ETA
