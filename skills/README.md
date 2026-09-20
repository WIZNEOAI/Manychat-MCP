# Agent skills (WIZNEO pack)

These skills ship with the npm package under `skills/`. Load them into Claude Code,
Cursor, Codex, or any agent that can read skill folders.

They are **playbooks**, not extra API permissions. Every mutating send still goes through
the MCP tools and the Meta policy guard (`validate_message`).

## Map

| Skill | Use when | Depends on |
|---|---|---|
| [`manychat-connect`](./manychat-connect/SKILL.md) | Wire stdio MCP + API key into this agent | nothing |
| [`manychat-operator`](./manychat-operator/SKILL.md) | Read/write subscribers, tags, fields, flows, sends | MCP connected |
| [`manychat-growth-engine`](./manychat-growth-engine/SKILL.md) | Design capture → qualify → nurture → convert → recover | operator |
| [`manychat-lead-reply`](./manychat-lead-reply/SKILL.md) | First replies, tone, in-thread qualification, handoff | operator |
| [`manychat-followup-os`](./manychat-followup-os/SKILL.md) | Sequences, reminders, cold recovery, stop rules | operator + lead-reply |
| [`manychat-setup-coach`](./manychat-setup-coach/SKILL.md) | Taxonomy, keywords, hygiene, plan/efficiency coaching | operator |
| [`manychat-mcp-ops`](./manychat-mcp-ops/SKILL.md) | Gateway/auth/rate-limit/runtime diagnostics | deploy context |

## Recommended load order for a marketing agent

1. `manychat-connect` — if ManyChat tools are not in this session  
2. `manychat-setup-coach` — if the page is messy or new  
3. `manychat-operator` — always, before any send  
4. `manychat-lead-reply` + `manychat-followup-os` — revenue conversations  
5. `manychat-growth-engine` — when designing new capture mechanics  

## Hard rules across all skills

- No promotional send outside a valid messaging window  
- No weakening of `validate_message` / policy wedge  
- Prefer flows for anything repeatable  
- Read taxonomy before creating tags/fields  
- One canary subscriber before bulk enrollment  

## Contributing a skill

See root [`CONTRIBUTING.md`](../CONTRIBUTING.md). Marketing/ops skills that teach **safe**
ManyChat usage are in scope. Hosted billing, vault, and Stripe live in the private
control-plane repo — not here.
