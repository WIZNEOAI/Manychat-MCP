# VS Code — local stdio

Follow [secret preparation](../connect.md#prepare-the-secret-yourself--outside-agent-chat). The user prepares `MANYCHAT_API_KEY` in their launch environment/OS secret store outside chat. Launch VS Code so its MCP child inherits the variable.

Use the **user MCP configuration**, without credential values:

```json
{
  "servers": {
    "manychat": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-manychat", "mcp", "serve", "--transport", "stdio"]
    }
  }
}
```

A workspace `.vscode/mcp.json` may contain only the same secret-free server definition, never the key. If inheritance is filtered, consult the installed version's variable-reference/secret-store mechanism or use a local secret-manager launcher. Do not copy the key into JSON or arguments. A running GUI may require a full restart, not just an integrated-terminal export.

With account-owner approval, verify only `get_page_info` (`{}`). Published 0.2.0 supports reads/CRM inspection; sends and guarded writes fail closed. No live client-version test is claimed. For a remote, [self-host your own](../self-host.md); no public WIZNEO gateway is offered.
