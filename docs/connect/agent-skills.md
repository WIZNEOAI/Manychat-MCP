# Agent skills — give your AI agent ManyChat superpowers

This MCP ships two first-party Claude **agent skills** that make any agent operate ManyChat like a pro instead of poking raw tools:

- **`manychat-operator`** — discovery-before-mutation, the Meta-compliant safe-send protocol (always validate before sending), segmentation, and flow execution.
- **`manychat-growth-engine`** — social lead growth: comment-to-DM / keyword capture, qualification, nurture sequences, and compliant cold-lead re-engagement.

They live in [`skills/`](../../skills/). Install them, or just paste the system prompt below — your agent will use the MCP correctly either way.

## Install the skills (copy-paste)

**Claude Code** (per-user):

```bash
git clone https://github.com/WIZNEOAI/Manychat-MCP.git /tmp/manychat-mcp \
  && cp -r /tmp/manychat-mcp/skills/manychat-operator /tmp/manychat-mcp/skills/manychat-growth-engine ~/.claude/skills/ \
  && rm -rf /tmp/manychat-mcp
```

**Cursor / Codex / other agents**: copy the same two folders into that agent's skills directory (e.g. `~/.agents/skills/`, `~/.codex/skills/`). The skills are plain `SKILL.md` + reference markdown — no install step, no dependencies.

After installing, the skills auto-trigger from their `description` when you ask the agent to operate or grow your ManyChat.

## Or: paste this system prompt (no install)

Drop this into your agent's system prompt / Claude Project instructions. It primes the agent to use the MCP safely without the skill files.

```text
You operate a live ManyChat account through the ManyChat MCP. It drives real revenue — a non-compliant send can get the Meta page flagged. Rules:

1. Read before you write. Use get_page_info / list_tags / list_custom_fields / list_flows / get_subscriber before assuming any id, tag, or field exists.
2. NEVER call send_content or send_text_message without first reasoning about the 24-hour messaging window. When unsure, call validate_message first (pass channel, hours_since_last_interaction, message_tag, promotional). If the verdict is allowed:false, DO NOT SEND — fix the cause (re-engage the subscriber, or use a valid tag). Surface warn-level findings to the user.
3. Set within_24h_window and promotional truthfully on send tools, and pass message_tag only when one genuinely applies. Message tags (CONFIRMED_EVENT_UPDATE, POST_PURCHASE_UPDATE, ACCOUNT_UPDATE) must never carry promotional content. HUMAN_AGENT covers a 7-day human-support window only.
4. Promotional message to a cold (outside-window) lead? There is no compliant tag — re-engage first to open a fresh window, then offer.
5. Change one thing at a time, then re-read to verify. For bulk work, canary 1–3 first and stop on 429.
6. Execute tools without commentary; respond after the tools complete.
```

## Why this matters

Every other ManyChat integration hands an agent raw API tools and hopes. These skills + the `validate_message` guard encode Meta's policy so your agent is *structurally* prevented from the mistake that gets accounts flagged. That safety layer is the point.
