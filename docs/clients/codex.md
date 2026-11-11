# Codex — local stdio

Follow [secret preparation](../connect.md#prepare-the-secret-yourself--outside-agent-chat). The user sets `MANYCHAT_API_KEY` in their own environment/secret store, outside chat, before launching Codex.

Add to user-level `~/.codex/config.toml`. `env_vars` passes **the name**, not a credential value:

```toml
[mcp_servers.manychat]
command = "npx"
args = ["-y", "mcp-manychat", "mcp", "serve", "--transport", "stdio"]
env_vars = ["MANYCHAT_API_KEY"]
```

Restart from the prepared environment. Do not add a literal-valued `env` table or an inline credential flag. Confirm this passthrough option against the installed Codex version; do not dump its environment to debug it.

With account-owner approval, verify only `get_page_info` (`{}`). Published 0.2.0 supports reads/CRM inspection; sends and guarded writes fail closed. No live client-version test is claimed. For a remote, [self-host your own](../self-host.md); no public WIZNEO gateway is offered.
