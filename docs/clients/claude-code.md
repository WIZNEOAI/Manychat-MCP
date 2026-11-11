# Claude Code — local stdio

First follow [secret preparation](../connect.md#prepare-the-secret-yourself--outside-agent-chat). The user sets `MANYCHAT_API_KEY` in their own environment/secret store, outside chat, then launches Claude Code from that environment. Never use an inline `-e` credential flag or a literal value in `.mcp.json`.

Register a user-level server without reading the key:

```sh
claude mcp add --scope user --transport stdio manychat -- npx -y mcp-manychat mcp serve --transport stdio
```

The MCP child must inherit `MANYCHAT_API_KEY`. If your installed client filters variables, use its documented environment reference or a local secret-manager launcher; do not copy the value into config. Reload `/mcp` and check status without displaying credentials.

With account-owner approval, verify only `get_page_info` (`{}`). 0.2.0 is published for reads/CRM inspection; sends and guarded writes fail closed. No live third-party client test is claimed by this example. For a remote, [self-host your own](../self-host.md); no public WIZNEO gateway is offered.
