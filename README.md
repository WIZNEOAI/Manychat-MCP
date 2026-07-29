# ManyChat MCP

**Give your AI agents ManyChat superpowers.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-self--host-ready-2496ED)](docs/deploy/vps-docker.md)

🌐 **English** · [Español](README.es.md)

A CLI + Model Context Protocol (MCP) server that lets AI agents — Claude, Cursor, Codex, OpenCode — **operate ManyChat**: read and segment subscribers, manage tags and custom fields, send flows and messages, and inspect a page.

What makes it different: a built-in **Meta policy-validation layer**. Before an agent sends anything, `validate_message` checks it against ManyChat's 24-hour / messaging-window rules — so your agent can't get the account flagged. **No other ManyChat MCP encodes that policy.**

> Open-source and self-hostable forever (CLI + MCP). An optional hosted control plane — **Revenue Operator** — adds an encrypted vault, hosted MCP tokens, usage/audit, and billing on top. The OSS runtime is never a gated demo.

---

## Install in 60 seconds

```bash
git clone https://github.com/WIZNEOAI/Manychat-MCP.git
cd Manychat-MCP
pnpm install
pnpm build
```

Set your ManyChat API key ([how to generate one](https://help.manychat.com/hc/en-us/articles/14959510331420-How-to-generate-a-token-for-the-Manychat-API-and-where-to-get-parameters)):

```bash
export MANYCHAT_API_KEY=mc_...
```

Verify:

```bash
node dist/index.js doctor      # checks key + connectivity
node dist/index.js page info   # prints your page
```

## Connect your agent

The MCP server runs locally over stdio. Point any MCP client at it.

**Claude Desktop / Claude Code** (`claude_desktop_config.json` or `.mcp.json`):

```json
{
  "mcpServers": {
    "manychat": {
      "command": "node",
      "args": ["/absolute/path/to/Manychat-MCP/dist/index.js", "mcp", "serve", "--transport", "stdio"],
      "env": { "MANYCHAT_API_KEY": "mc_..." }
    }
  }
}
```

**Cursor** (`~/.cursor/mcp.json`): same shape as above.

**Codex** (`~/.codex/config.toml`):

```toml
[mcp_servers.manychat]
command = "node"
args = ["/absolute/path/to/Manychat-MCP/dist/index.js", "mcp", "serve", "--transport", "stdio"]
env = { MANYCHAT_API_KEY = "mc_..." }
```

Remote (HTTP) and hosted-token modes are documented in [`docs/connect/mcp-clients.md`](docs/connect/mcp-clients.md).

## What your agent gets

**28 tools** — the full operating surface:

| Group | Tools |
|---|---|
| Page & policy | `get_page_info`, `validate_message` (policy wedge), `health_check`, `list_bot_fields`, `set_bot_field`, `list_growth_tools`, `list_otn_topics` |
| Subscribers | `get_subscriber`, `find_subscriber_by_email`, `find_subscriber_by_phone`, `find_subscriber_by_name`, `create_subscriber`, `update_subscriber`, `add_tag_to_subscriber`(`_by_name`), `remove_tag_from_subscriber`(`_by_name`) |
| Tags | `list_tags`, `create_tag` |
| Custom fields | `list_custom_fields`, `create_custom_field`, `set_custom_field`(`_by_name`), `set_custom_fields_bulk` |
| Flows | `list_flows`, `send_flow` |
| Messaging | `send_content`, `send_text_message` |

**6 prompts** (ready-made agent playbooks): `onboard_subscriber`, `recover_lead`, `send_campaign`, `analyze_subscriber`, `segment_audience`, `diagnose_automation`.

**8 resources** (live context): `page-info`, `tag-catalog`, `custom-fields-catalog`, `bot-fields`, `flow-catalog`, `otn-topics`, `subscriber-schema`, `api-limits`.

## The policy wedge

Meta enforces strict messaging windows (24-hour rule, message-tag limits). An agent that sends blindly will get the account restricted. Before any send, call:

```jsonc
validate_message({ subscriberId, channel, payload })
// → { allowed: boolean, reason, window, suggestion }
```

It checks the subscriber's last-interaction window and the channel's policy and tells the agent whether the send is safe — and if not, what to do instead. This guard is the core differentiator and stays in the OSS layer.

## Agent skills

Two installable skills wrap common operator workflows:

- **`manychat-operator`** — day-to-day account operation
- **`manychat-growth-engine`** — lead capture → nurture → recovery loops

See [`docs/connect/agent-skills.md`](docs/connect/agent-skills.md). The skills live in [`skills/`](skills/).

## CLI

The CLI is the source of truth; MCP reuses the same execution layer.

```
manychat doctor
manychat page info
manychat tags list|create
manychat fields list|create|set|set-bulk
manychat flows list|send
manychat subscribers get|find|create|update
manychat subscribers tags add|remove
manychat send text|content
manychat raw get|post
manychat mcp serve
```

Output contract: JSON on `stdout`, diagnostics on `stderr`. Exit codes: `0` ok · `2` bad input · `3` auth/config · `4` API error · `5` rate limit.

## Hosted (Revenue Operator)

Don't want to self-host? The hosted control plane lets you paste a ManyChat key once (stored encrypted), issue MCP tokens, and connect any agent without managing a server — plus usage and audit.

Three tiers — **Free** for evaluation, **Supporter** for builders running agents daily, **Pro** for agencies and multi-brand operators. Current prices and per-tier limits live on the product page, which is the single source of truth for them; this README deliberately does not restate numbers it cannot enforce.

The control plane is a separate, proprietary codebase. Nothing here depends on it: the gateway talks to it over the three endpoints in [`docs/control-plane-contract.md`](docs/control-plane-contract.md), and only when you set `MCP_REMOTE_AUTH=hosted_token`. Every other mode runs standalone.

## Self-host the gateway

For a persistent multi-tenant remote MCP, deploy the gateway (`src/`, Dockerfile, `GET /health`) to a stable host — **EasyPanel/VPS** or any container platform. See [`docs/deploy/mcp-gateway-vps.md`](docs/deploy/mcp-gateway-vps.md) and [`docs/deploy/vps-docker.md`](docs/deploy/vps-docker.md).

## Development

```bash
pnpm install
pnpm run lint     # tsc --noEmit
pnpm run build    # tsc
pnpm test         # vitest — 91
```

All three must pass before a commit; there is no CI on pull requests. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for what we look for in a change, plus [`CLAUDE.md`](CLAUDE.md) and [`AGENTS.md`](AGENTS.md).

## Safety

- Never assume a send is safe outside the 24-hour window — use `validate_message`.
- Don't rely on Message Tags as a default Messenger fallback after 2026-02-09.
- Read-before-write, verify-after-write for mutations.

## License

[AGPL-3.0-or-later](LICENSE). Self-host freely; network use must share source.

---

Built by [Gnosix / WIZNEO](https://wizneo.org). Not affiliated with ManyChat.
