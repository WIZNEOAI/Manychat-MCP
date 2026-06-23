# Connect MCP clients to ManyChat MCP

This repository exposes ManyChat in three ways:

1. **CLI** — primary product
2. **local MCP over stdio** — local compatibility mode
3. **remote MCP over HTTP** — self-hosted or future hosted access layer

This document covers **remote MCP over HTTP**.

## Choose your auth pattern first

### Pattern A: direct ManyChat API key

Best for Phase 0 self-host.

Use one of:

- `MANYCHAT_API_KEY` on the server
- `X-ManyChat-API-Key` from the MCP client

This keeps the product identity API-key-first.

### Pattern B: OAuth / MCP token

Best when the MCP client expects an OAuth-style remote connector.

Use:

```env
MCP_REMOTE_AUTH=oauth
OAUTH_STORE=redis
REDIS_URL=redis://...
```

Important:

- OAuth is the **client access layer**
- the ManyChat API key is still the **execution credential**
- production OAuth requires Redis in Phase 0

## Shared values used below

```env
MANYCHAT_MCP_URL=https://mcp.example.com/mcp
MANYCHAT_API_KEY=mc_...
MANYCHAT_MCP_TOKEN=your-issued-bearer-token
```

> **Hosted (Revenue Operator):** use `MANYCHAT_MCP_URL=https://mcp.wizneo.org/mcp` and the
> `MANYCHAT_MCP_TOKEN` you issue from the dashboard. `mcp.example.com` is the generic
> placeholder for **self-hosted** gateways — replace it with your own domain.

For the hosted SaaS path, `MANYCHAT_MCP_TOKEN` is the main client credential.
The ManyChat API key stays in the hosted vault and is never pasted into Claude,
Cursor, or Codex.

## Claude Code

Official docs support remote HTTP MCP servers and custom headers.

### Header mode

```bash
claude mcp add --transport http manychat "$MANYCHAT_MCP_URL" \
  --header "X-ManyChat-API-Key: $MANYCHAT_API_KEY"
```

### Bearer token mode

```bash
claude mcp add --transport http manychat "$MANYCHAT_MCP_URL" \
  --header "Authorization: Bearer $MANYCHAT_MCP_TOKEN"
```

This is the recommended hosted setup.

### OAuth mode

If your server is running with `MCP_REMOTE_AUTH=oauth`:

```bash
claude mcp add --transport http manychat "$MANYCHAT_MCP_URL"
```

Then inside Claude Code:

```text
/mcp
```

Complete the browser auth flow.

### Project config example

`.mcp.json`

```json
{
  "mcpServers": {
    "manychat": {
      "type": "http",
      "url": "${MANYCHAT_MCP_URL}",
      "headers": {
        "X-ManyChat-API-Key": "${MANYCHAT_API_KEY}"
      }
    }
  }
}
```

## Cursor

Cursor supports remote MCP servers through `.cursor/mcp.json` or `~/.cursor/mcp.json`.

### Header mode

```json
{
  "mcpServers": {
    "manychat": {
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "X-ManyChat-API-Key": "mc_..."
      }
    }
  }
}
```

### Bearer token mode

```json
{
  "mcpServers": {
    "manychat": {
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer your-issued-bearer-token"
      }
    }
  }
}
```

Notes:

- for Cloud Agents, store secrets in Cursor-managed secret fields when possible
- restart Cursor after editing the config file
- hosted product tokens map to a workspace and enforce bundle + quota limits server-side

## Codex

Codex uses `~/.codex/config.toml` or `.codex/config.toml`.

### Header mode through environment variables

```toml
[mcp_servers.manychat]
url = "https://mcp.example.com/mcp"
env_http_headers = { "X-ManyChat-API-Key" = "MANYCHAT_API_KEY" }
```

### Bearer token mode

```toml
[mcp_servers.manychat]
url = "https://mcp.example.com/mcp"
bearer_token_env_var = "MANYCHAT_MCP_TOKEN"
```

If your Codex version supports a literal bearer token field instead, the hosted
dashboard also emits:

```toml
[mcp_servers.manychat]
url = "https://mcp.example.com/mcp"
bearer_token = "mcp_live_..."
```

### Static headers example

```toml
[mcp_servers.manychat]
url = "https://mcp.example.com/mcp"
http_headers = { "X-ManyChat-API-Key" = "mc_..." }
```

Codex notes:

- `env_http_headers` is safer than hardcoding secrets
- OAuth-capable servers can also be authenticated with `codex mcp login`

## Claude Desktop

For **remote** MCP servers, Claude Desktop follows the remote connector flow from
Claude rather than `claude_desktop_config.json`.

That means:

- add the remote server through **Claude / claude.ai Settings > Connectors**
- Claude Desktop syncs those remote connectors

### Recommended Phase 0 path for Claude Desktop

Use **OAuth mode** on the server for remote connector UX, or use a hosted bearer
token flow if your Claude environment can attach custom headers.

OAuth server mode:

```env
MCP_REMOTE_AUTH=oauth
OAUTH_STORE=redis
REDIS_URL=redis://...
MCP_BASE_URL=https://mcp.example.com
```

Why:

- Claude Desktop remote connectors support authless and OAuth-based remote servers
- the desktop remote flow is not the place to depend on custom header injection
- OAuth is the most compatible path for hosted-style remote access

Hosted note:

- if your Claude environment supports a raw remote HTTP connector with bearer headers,
  you can also use the hosted MCP token directly
- otherwise, keep Claude Desktop on OAuth and use hosted bearer tokens for Claude Code,
  Cursor, and Codex

### Local fallback for Claude Desktop

If you want direct API-key-first usage without remote OAuth, use the **local stdio**
mode instead of remote HTTP:

```json
{
  "mcpServers": {
    "manychat": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js", "mcp", "serve", "--transport", "stdio"],
      "env": {
        "MANYCHAT_API_KEY": "mc_..."
      }
    }
  }
}
```

That keeps the execution credential as the ManyChat API key with no extra remote
auth layer.

## Which mode should you choose?

| Client | Recommended Phase 0 mode |
| --- | --- |
| Claude Code | header mode, hosted bearer token, or OAuth |
| Cursor | header mode or hosted bearer token |
| Codex | header mode or hosted bearer token |
| Claude Desktop | OAuth for remote, stdio for local |

## Production reminders

- keep HTTPS in front of remote MCP
- keep Railway/VPS single-replica in Phase 0
- do not treat OAuth as the core product identity
- ManyChat API key remains the upstream execution credential
- for hosted mode, prefer MCP bearer tokens over sharing raw ManyChat keys with clients
