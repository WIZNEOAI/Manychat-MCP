# Safe client setup

**0.2.0 is published** as [`mcp-manychat`](https://www.npmjs.com/package/mcp-manychat/v/0.2.0), with [GitHub release v0.2.0](https://github.com/WIZNEOAI/manychat-mcp/releases/tag/v0.2.0). Node 22+ is required. Reads and CRM inspection work; sends, flow dispatch and guarded writes fail closed because no trusted interaction-channel evidence provider is shipped.

Use your own ManyChat account and a suitable paid API plan. No public WIZNEO gateway or hosted signup is offered. Choose **local stdio** or [self-host your own remote](self-host.md); remote deployment remains unverified.

## Prepare the secret yourself — outside agent chat

1. Generate the key in ManyChat Settings → API. Treat it as a sensitive page credential.
2. Set `MANYCHAT_API_KEY` in your local launch environment or OS keychain/secret store **yourself**, not through an agent. Never type a key into chat, prompts, CLI arguments, client config literals or tracked files. Never ask the agent to read secret files, inspect its value or dump the environment.
3. Launch/restart the client so its MCP child receives the variable. GUI apps often do not inherit terminal exports. Use a local secret-manager launcher or the client's documented reference/passthrough mechanism. A config containing `${MANYCHAT_API_KEY}` is a reference only when that particular client supports it; JSON does not expand variables itself.
4. Tell the agent only that local preparation is complete. If you accidentally share a key, rotate it without repeating it.

For Bash users only, the **human** can run this in a private terminal outside the agent to avoid shell-history/argv exposure:

```sh
IFS= read -r -s -p 'ManyChat API key (hidden): ' MANYCHAT_API_KEY
export MANYCHAT_API_KEY
printf '\n'
```

The value is read interactively without echo, not included in the command. This is not a universal shell/GUI launcher. On Windows/macOS GUI clients use the OS secret-manager/launch mechanism appropriate to your installed client. Environment variables are still sensitive process data, not a substitute for a secure local account.

## Client guides

| Client | Guide |
|---|---|
| Claude Code | [User-level registration, inherited environment](clients/claude-code.md) |
| Claude Desktop | [Secret-free JSON, GUI launch environment](clients/claude-desktop.md) |
| Cursor | [User-level JSON, inherited environment](clients/cursor.md) |
| Codex | [Variable-name passthrough](clients/codex.md) |
| OpenCode | [Local MCP config, inherited environment](clients/opencode.md) |
| Hermes | [Variable reference for filtered environments](clients/hermes.md) |
| VS Code | [User MCP config, inherited environment](clients/vscode.md) |
| n8n | [Own HTTP server, credentials managed by n8n](clients/n8n.md) |

The published stdio command is:

```sh
npx -y mcp-manychat mcp serve --transport stdio
```

The package also provides `manychat` and `manychat-mcp` binaries. To pin 0.2.0, replace the package argument with `mcp-manychat@0.2.0`. Guides are configuration examples, **not claims of live testing every client/version**. If a client's environment is filtered, consult its official installed-version documentation; never fix it by copying the literal key into config.

## Verify without sending

- `npx -y mcp-manychat --help` needs no key and does not contact ManyChat.
- With account-owner permission, call `get_page_info` with `{}`; it performs a GET. Never print the credential or account data into a public report.
- Compare advertised tools with the README. Presence of a send/write tool does not mean the action is enabled.
- `validate_message` with an authorized subscriber ID reads context, not sends. Expect `CHANNEL_UNKNOWN` without trusted evidence; a fresh interaction does not establish channel.
- Do not send messages or mutate tags/fields as a setup test. A block does not tag or notify a human automatically.

## Your own HTTP endpoint

See [self-host.md](self-host.md) for Docker/HTTP, TLS, Redis and proxy/origin requirements. In `manychat_header` mode every `/mcp` request needs `X-ManyChat-API-Key`, supplied through the client's credential/secret store. HTTP does not fall back to `MANYCHAT_API_KEY` on the server. OAuth is an exclusive alternative and requires separate configuration; it is not bypassed by the header.

Provisioning is always a separate owner-approved step. Docker, Render and OAuth with real Redis are unverified in a real deployment. No guide or client setup unlocks the blocked sends/guarded writes.
