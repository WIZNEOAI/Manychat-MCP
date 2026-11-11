# OpenCode — local stdio

Follow [secret preparation](../connect.md#prepare-the-secret-yourself--outside-agent-chat). The user sets `MANYCHAT_API_KEY` in their own launch environment/secret store outside chat, then launches OpenCode from that environment.

Merge into user-level `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "manychat": {
      "type": "local",
      "command": ["npx", "-y", "mcp-manychat", "mcp", "serve", "--transport", "stdio"],
      "enabled": true
    }
  }
}
```

The MCP child must inherit the variable. If your installed version filters it or rejects this shape, consult its official MCP schema and use documented environment references or a local secret-manager launcher. Do not guess a `servers` wrapper or insert a literal key into an `environment` field. Reload MCP after configuration.

With account-owner approval, verify only `get_page_info` (`{}`). Published 0.2.0 supports reads/CRM inspection; sends and guarded writes fail closed. No live client-version test is claimed. For a remote, [self-host your own](../self-host.md); no public WIZNEO gateway is offered.
