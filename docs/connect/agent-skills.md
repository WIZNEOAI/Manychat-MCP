# Agent skills

The repo ships six agent skills in [`skills/`](../../skills/). They are playbooks that tell
an agent how to use the MCP tools in order, not extra permissions: every send still goes
through `validate_message`.

| Skill | Covers |
|---|---|
| `manychat-operator` | Read before write, the safe-send protocol, segmentation, flow execution |
| `manychat-lead-reply` | First replies, tone, in-thread qualification, handoff |
| `manychat-followup-os` | Sequences, reminders, cold recovery, stop rules |
| `manychat-growth-engine` | Comment-to-DM and keyword capture, qualification, nurture, re-engagement |
| `manychat-setup-coach` | Tag and field taxonomy, keywords, account hygiene |
| `manychat-mcp-ops` | Gateway, auth, rate-limit and runtime diagnostics |

[`skills/README.md`](../../skills/README.md) has the load order and what each one depends on.
Start with `manychat-operator` and add the others when you need them.

## Install them

**Claude Code** (per-user):

```bash
git clone https://github.com/WIZNEOAI/Manychat-MCP.git /tmp/manychat-mcp \
  && cp -r /tmp/manychat-mcp/skills/manychat-* ~/.claude/skills/ \
  && rm -rf /tmp/manychat-mcp
```

**Cursor / Codex / other agents**: copy the same folders into that agent's skills directory
(`~/.agents/skills/`, `~/.codex/skills/`). They are plain `SKILL.md` plus reference markdown,
with no install step and no dependencies. They also ship inside the npm package, so
`node_modules/mcp-manychat/skills/` works as a source too.

Once installed, each skill triggers from its own `description`.

If you would rather not install anything, the system prompt below covers the same rules.

## Or paste this system prompt

Drop this into your agent's system prompt or Claude Project instructions instead of
installing the skill files.

```text
You operate a live ManyChat account through the ManyChat MCP. It drives real revenue — a non-compliant send can get the Meta page flagged. Rules:

1. Read before you write. Use get_page_info / list_tags / list_custom_fields / list_flows / get_subscriber before assuming any id, tag, or field exists.
2. NEVER call send_content or send_text_message without first reasoning about the 24-hour messaging window. When unsure, call validate_message first (pass channel, hours_since_last_interaction, message_tag, promotional). If the verdict is allowed:false, DO NOT SEND — fix the cause (re-engage the subscriber, or use a valid tag). Surface warn-level findings to the user.
3. Set within_24h_window and promotional truthfully on send tools, and pass message_tag only when one genuinely applies. Message tags (CONFIRMED_EVENT_UPDATE, POST_PURCHASE_UPDATE, ACCOUNT_UPDATE) must never carry promotional content. HUMAN_AGENT covers a 7-day human-support window only.
4. Promotional message to a cold (outside-window) lead? There is no compliant tag — re-engage first to open a fresh window, then offer.
5. Change one thing at a time, then re-read to verify. For bulk work, canary 1–3 first and stop on 429.
6. Execute tools without commentary; respond after the tools complete.
```
