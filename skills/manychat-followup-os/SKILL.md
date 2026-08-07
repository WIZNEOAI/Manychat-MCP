---
name: manychat-followup-os
description: Design and run ManyChat follow-up systems — nurture sequences, reminders, cold recovery, and human escalation — without burning Meta windows. Use when the user wants follow-ups, sequences, "leads go cold", re-engagement, reminders before a call, or multi-step DM funnels after the first reply. Pairs with manychat-operator (safe send) and manychat-lead-reply (first touch).
---

# ManyChat Follow-up OS

Follow-up is where revenue is won or Meta trust is lost. This skill designs the **system**; every send still goes through `manychat-operator`.

## Core model

```
new → contacted → qualified → booked/customer → dormant → recovered|lost
```

Each state has allowed actions and tags. Never promo a `dormant` lead until a fresh window exists.

## Sequence types

| Type | When | Window rule |
|---|---|---|
| **Nurture (value)** | After magnet / first DM | Stay inside 24h or use approved topics/templates |
| **Sales follow-up** | `intent:buy` no book yet | Inside window only for promo |
| **Reminder** | Call/demo booked | Utility tone; confirm details |
| **No-show** | Missed call | Soft rebook; not hard pitch spam |
| **Recovery** | Cold / outside window | Re-open conversation first — no offer in opener |
| **Win-back** | Old customers | Same recovery rules + truth about offer |

## Design checklist (before building flows)

1. **Entry condition** — which tag/field starts it?  
2. **Exit condition** — booked, bought, unsubscribed, human took over.  
3. **Max touches** — default 3–5, then stop or human.  
4. **Spacing** — e.g. T+0, T+2h, T+1d, T+3d (brand-dependent).  
5. **Branching** — replied yes/no/question.  
6. **Channel** — IG/Messenger/WA constraints differ (WA templates outside 24h).  
7. **Measurement** — which step drops.

## Default 4-step sales follow-up (inside window)

1. **T+0** — value + one question (already sent by lead-reply).  
2. **T+few hours** — answer objection OR micro-case / social proof (one line).  
3. **T+1d** — clear next step (book / checkout / reply YES).  
4. **T+3d** — break-up message (“cierro el hilo”) — stops automation.

Stop immediately on: reply, book, purchase, “stop”, human claim.

## Cold recovery opener (outside window)

Goal = **fresh interaction**, not the sale.

Patterns:
- New free resource related to prior interest  
- “Still want X?” binary question with soft value  
- Event/reminder that is legitimately non-promotional if tagged correctly  

After they reply → you are inside 24h → then sales follow-up may resume.

## Tagging contract (minimum)

- `lead:new|contacted|qualified|hot|customer|dormant|lost`  
- `seq:<name>:active|done|stopped`  
- `intent:*` preserved from first touch  
- `source:*` never overwritten casually  

## Build order with tools

1. `list_tags` / `list_custom_fields` / `list_flows` — reuse before create.  
2. Create missing taxonomy.  
3. Prefer **ManyChat flows** for the sequence backbone.  
4. Agent uses MCP to enroll (`send_flow`), patch fields, and audit stuck subscribers.  
5. Canary on one real subscriber before bulk.

## Telegram / multi-channel note

ManyChat is the Meta/WA rail. If the operator also uses Telegram bots, treat Telegram as a **parallel channel**:
- Don’t assume ManyChat tags exist there.
- Sync intent to CRM/Sheet when bridging.
- Never claim Telegram sends are covered by this MCP.

## Anti-patterns

- Daily promo blasts to cold lists  
- 12-step novels in DM  
- Sequences without exit on human reply  
- “Bump” messages with no new value  
- Using transactional tags to smuggle offers (blocked by policy wedge — good)

## Metrics

- Replies per step  
- Booked/paid per sequence  
- % stopped by human  
- Outside-window send attempts blocked (should be >0 if guards work)
