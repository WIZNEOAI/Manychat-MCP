# Cursor — local stdio

Follow [secret preparation](../connect.md#prepare-the-secret-yourself--outside-agent-chat). The user prepares `MANYCHAT_API_KEY` in their own launch environment/secret store outside chat. Launch/restart Cursor from that environment; a terminal export does not update an existing GUI process.

Merge into **user-level** `~/.cursor/mcp.json`, without an env value:

```json
{
  "mcpServers": {
    "manychat": {
      "command": "npx",
      "args": ["-y", "mcp-manychat", "mcp", "serve", "--transport", "stdio"]
    }
  }
}
```

The MCP child must inherit the variable. If your installed Cursor filters it, use its documented environment-reference syntax or a local secret-manager launcher; never put a literal key in workspace/global JSON or CLI arguments. Reload MCP in Settings → Tools & MCP.

With account-owner approval, verify only `get_page_info` (`{}`). Published 0.2.0 supports reads/CRM inspection; sends and guarded writes fail closed. No live client-version test is claimed. For a remote, [self-host your own](../self-host.md); no public WIZNEO gateway is offered.
