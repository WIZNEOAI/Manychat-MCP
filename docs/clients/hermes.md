# Hermes — local stdio

Follow [secret preparation](../connect.md#prepare-the-secret-yourself--outside-agent-chat). The user prepares `MANYCHAT_API_KEY` through their launch environment or secret-manager integration outside chat. Do not ask the agent to open secret files, populate `.env`, or read/copy a key.

Hermes may filter child-process variables. In your own `~/.hermes/config.yaml`, use a **variable reference**, never a literal credential:

```yaml
mcp_servers:
  manychat:
    command: npx
    args: [-y, mcp-manychat, mcp, serve, --transport, stdio]
    env:
      MANYCHAT_API_KEY: "${MANYCHAT_API_KEY}"
```

Confirm variable expansion against the [installed Hermes MCP guide](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp). If unsupported, use its documented passthrough or a local secret-manager launcher, not a copied value. Restart/reload MCP from the prepared environment. Do not modify another user's profile.

With account-owner approval, verify only `get_page_info` (`{}`). Published 0.2.0 supports reads/CRM inspection; sends and guarded writes fail closed. No live client-version test is claimed. For a remote, [self-host your own](../self-host.md); no public WIZNEO gateway is offered.
