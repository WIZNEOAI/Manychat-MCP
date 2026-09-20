# Skills usage

This repo ships seven agent skills under [`skills/`](../skills/). See
[`skills/README.md`](../skills/README.md) for what each one covers and the recommended load
order, and [`connect/agent-skills.md`](./connect/agent-skills.md) for how to install them.

`manychat-mcp-ops` is the operational one: gateway, auth, rate-limit and runtime
diagnostics. It carries the smoke script below.

## Smoke-test a running HTTP gateway

```bash
export MCP_BASE_URL="https://mcp.example.com"
export MANYCHAT_API_KEY="your_manychat_api_key"
node skills/manychat-mcp-ops/scripts/smoke_http_mcp.mjs
```

PowerShell:

```powershell
$env:MCP_BASE_URL="https://mcp.example.com"
$env:MANYCHAT_API_KEY="your_manychat_api_key"
node .\skills\manychat-mcp-ops\scripts\smoke_http_mcp.mjs
```
