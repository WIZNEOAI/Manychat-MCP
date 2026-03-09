# Skills usage

This repo ships one operational skill:

- `skills/manychat-mcp-ops`

## Install/sync into local Codex skills directory

PowerShell example:

```powershell
$target = "$env:CODEX_HOME\skills\manychat-mcp-ops"
Remove-Item -Recurse -Force $target -ErrorAction SilentlyContinue
Copy-Item -Recurse -Force ".\skills\manychat-mcp-ops" $target
```

## Validate smoke script

```powershell
$env:MCP_BASE_URL="https://your-app.up.railway.app"
$env:MANYCHAT_API_KEY="your_manychat_api_key"
node .\skills\manychat-mcp-ops\scripts\smoke_http_mcp.mjs
```
