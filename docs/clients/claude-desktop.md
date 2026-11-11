# Claude Desktop — local stdio

Follow [secret preparation](../connect.md#prepare-the-secret-yourself--outside-agent-chat). The user prepares `MANYCHAT_API_KEY` in their local launch environment or OS keychain/secret store outside chat. No literal key belongs in `claude_desktop_config.json`.

Merge this secret-free definition into the local Desktop config:

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

Fully quit and relaunch Desktop from the prepared environment or a local secret-manager launcher that injects the variable into the client/MCP child. An export in an unrelated terminal does not update a running GUI. Do not assume JSON expands `${MANYCHAT_API_KEY}`: use only a reference mechanism documented by your installed client, or the launcher. Never replace a reference with a literal key.

With account-owner approval, verify only `get_page_info` (`{}`). Published 0.2.0 is for reads/CRM inspection; sends and guarded writes fail closed. This example is not a live test of every Desktop/OS version. For a remote, [self-host your own](../self-host.md); no public WIZNEO gateway is offered.
