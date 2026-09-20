# Client configs (stdio)

Same command everywhere:

```
npx -y mcp-manychat mcp serve --transport stdio
```

Replace `THE_KEY` only in the file you write. Never in the reply.

Landing copy-paste prompts (same content): https://mc-mcp.wizneo.org/#install

## Claude Code

Preferred:

```bash
claude mcp add manychat -e MANYCHAT_API_KEY=THE_KEY -- npx -y mcp-manychat mcp serve --transport stdio
```

Equivalent `.mcp.json` (repo root or user-level):

```json
{
  "mcpServers": {
    "manychat": {
      "command": "npx",
      "args": ["-y", "mcp-manychat", "mcp", "serve", "--transport", "stdio"],
      "env": { "MANYCHAT_API_KEY": "THE_KEY" }
    }
  }
}
```

Then `/mcp` and confirm the server is connected.

## Cursor

`~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (this project):

```json
{
  "mcpServers": {
    "manychat": {
      "command": "npx",
      "args": ["-y", "mcp-manychat", "mcp", "serve", "--transport", "stdio"],
      "env": { "MANYCHAT_API_KEY": "THE_KEY" }
    }
  }
}
```

Reload MCP in Cursor Settings → Tools & MCP until the server shows green.

## Codex

`~/.codex/config.toml`:

```toml
[mcp_servers.manychat]
command = "npx"
args = ["-y", "mcp-manychat", "mcp", "serve", "--transport", "stdio"]

[mcp_servers.manychat.env]
MANYCHAT_API_KEY = "THE_KEY"
```

If this is the first MCP in Codex, enable `rmcp` under `[beta]` as their docs require. Restart Codex.

## OpenCode

OpenCode does not use `mcpServers` (that is Cursor / Claude). Current V2 uses `mcp.servers`.

`opencode.json` at the project root, or `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "manychat": {
        "type": "local",
        "command": ["npx", "-y", "mcp-manychat", "mcp", "serve", "--transport", "stdio"],
        "environment": { "MANYCHAT_API_KEY": "THE_KEY" }
      }
    }
  }
}
```

If that shape is rejected, the install is still on V1 — drop the `servers` wrapper and put `manychat` directly under `mcp`, with `"type": "local"`, the same command array, `"environment"`, and `"enabled": true`.

## Claude Desktop

`claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/`, Windows: `%APPDATA%\Claude\`):

```json
{
  "mcpServers": {
    "manychat": {
      "command": "npx",
      "args": ["-y", "mcp-manychat", "mcp", "serve", "--transport", "stdio"],
      "env": { "MANYCHAT_API_KEY": "THE_KEY" }
    }
  }
}
```

Restart Claude Desktop after saving.

## Hermes (Nous Research)

Hermes stdio servers get a filtered environment. Put the key in `~/.hermes/.env`, then reference it from yaml — do not paste the literal key into yaml.

`~/.hermes/config.yaml`:

```yaml
mcp_servers:
  manychat:
    command: "npx"
    args: ["-y", "mcp-manychat", "mcp", "serve", "--transport", "stdio"]
    env:
      MANYCHAT_API_KEY: "${MANYCHAT_API_KEY}"
```

`~/.hermes/.env`:

```
MANYCHAT_API_KEY=THE_KEY
```

Reload with `/reload-mcp` or restart `hermes chat`. Confirm `validate_message` loaded.
