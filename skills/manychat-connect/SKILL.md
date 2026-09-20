---
name: manychat-connect
description: Wire the ManyChat MCP server into this agent over local stdio. Use when ManyChat tools are missing, the user asks to connect or install mcp-manychat, set up Claude/Cursor/Codex/OpenCode/Claude Desktop/Hermes, or paste an API key. Triggers: connect ManyChat, install MCP, mcp-manychat, wire the server, API key in config.
---

# ManyChat Connect

Get this agent talking to a live ManyChat page. **Local stdio is the product.** You write a config file, the server starts with `npx`, the API key lives in that file (or `~/.hermes/.env`), and it never comes back into the chat.

## Outcome

- MCP server `manychat` is connected over **stdio**
- `MANYCHAT_API_KEY` is in the client env (or Hermes `.env`) — not in this transcript, not in git, not in a README
- `validate_message` is in the tool list
- Next skill to load: `manychat-operator`

## Do this, in order

1. **See which client you are.** Claude Code, Cursor, Codex, OpenCode, Claude Desktop, or Hermes. If you know, do not ask. Per-client files: `references/clients.md`.
2. **Ask for the key only when you are about to write the file.** ManyChat → Settings → API → Generate your API Key (Pro). Shown once. Full access to the page.
3. **Write the config.** Command for every client:
   ```
   npx -y mcp-manychat mcp serve --transport stdio
   ```
   Put `MANYCHAT_API_KEY` in that client's env field (Hermes: `~/.hermes/.env`, referenced from yaml). Never print the key. Never paste it back into this chat. Never write it into markdown, an issue, or a commit.
4. **Reload MCP** the way that client reloads (see the reference). Confirm tools loaded.
5. **Smoke.** `get_page_info` (or `manychat doctor` in a terminal). Then stop. Do not send.

## Tools that must exist after connect

`find_subscriber_by_email`, `find_subscriber_by_phone`, `find_subscriber_by_name`, `get_subscriber`, `add_tag_to_subscriber`, `set_custom_field`, `set_custom_fields_bulk` (max 20 fields), `send_flow`, `send_text_message`, `send_content`, `validate_message`.

There is **no** `recover_lead` tool. Cold recovery is tag + wait for a fresh 24-hour window, then `send_flow` or `send_text_message` through `manychat-operator`.

## Hard rules

- Stdio first. Do not invent an HTTP install unless the user already runs their own gateway.
- Do **not** send the user to `https://mcp.wizneo.org` or tell them to set `X-ManyChat-API-Key` on a public URL. That is not a public BYOK product. The OSS landing is `https://mc-mcp.wizneo.org` (copy-the-prompt). A hosted vault + revocable tokens is a separate app, not open on that landing.
- If `manychat connect` JSON still has a `hosted` block, ignore `hosted.mcpUrl` / sign-up until the user has an actual hosted dashboard. Wire stdio.
- Self-host HTTP is optional and uses **their** origin (`mcp.example.com` in `docs/connect/mcp-clients.md`), never the WIZNEO gateway as a paste-your-key door.
- This runtime is unofficial and AGPL-3.0. Not affiliated with ManyChat, Inc.

## After it is green

Load `manychat-operator` before any send. Setup-coach is for taxonomy, not for this wiring step.
