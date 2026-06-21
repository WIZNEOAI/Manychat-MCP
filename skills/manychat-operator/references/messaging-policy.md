# Meta / ManyChat messaging policy

This is the rule set the `validate_message` tool and the pre-send guard enforce. Read it to understand *why* a send is blocked and how to fix it compliantly.

## Table of contents

- The 24-hour standard messaging window
- Message tags (and the Feb 2026 deprecation)
- HUMAN_AGENT (7-day support window)
- Promotional content rule
- Opt-in
- WhatsApp templates
- Verdict codes

## The 24-hour standard messaging window

Messenger and Instagram allow free-form messages only within **24 hours** of the subscriber's last interaction (message, click, opt-in action). Outside that window, a message is rejected unless a valid **message tag** applies. If you cannot establish that the subscriber interacted within 24h, treat the send as outside the window.

## Message tags

Valid tags for sending outside the window:

- `CONFIRMED_EVENT_UPDATE` — reminders/updates for an event the user registered for.
- `POST_PURCHASE_UPDATE` — updates about a transaction the user made.
- `ACCOUNT_UPDATE` — non-recurring changes to the user's account.
- `HUMAN_AGENT` — a human is responding to the user (see below).

**Deprecation:** as of **2026-02-10**, standard message tags are no longer a durable Messenger strategy (`TAG_DEPRECATED` warning). Prefer real re-engagement or `HUMAN_AGENT`. Tags still validate, but warn — tell the user to move toward opt-in-based re-engagement.

## HUMAN_AGENT (7-day support window)

`HUMAN_AGENT` lets a human (or human-supervised agent) reply to a user for up to **7 days (168h)** after their last message, for genuine support — not marketing. Past 168h it expires (`HUMAN_AGENT_WINDOW_EXPIRED`, blocked).

## Promotional content rule

Message tags must **never** carry promotional/marketing content. Sending promo under `CONFIRMED_EVENT_UPDATE`/`POST_PURCHASE_UPDATE`/`ACCOUNT_UPDATE` violates Meta policy and is blocked (`PROMO_UNDER_NONPROMO_TAG`). For promotion outside the window, the only compliant path is to re-engage the subscriber so a fresh 24h window opens.

## Opt-in

Sending to a subscriber with no recorded opt-in is risky (`MISSING_OPT_IN`, warn). Confirm consent exists before sending, especially for marketing.

## WhatsApp templates

WhatsApp outside its 24h customer-care window requires a **pre-approved message template**, not a tag (`WA_TEMPLATE_REQUIRED`, warn — this MCP does not model templates yet, so verify in ManyChat/Meta directly).

## Verdict codes

| Code | Level | Meaning / fix |
| --- | --- | --- |
| `OUTSIDE_WINDOW_NO_TAG` | block | Outside 24h, no tag. Re-engage or use a valid tag. |
| `INVALID_TAG` | block | Unknown tag. Use one of the four valid tags. |
| `PROMO_UNDER_NONPROMO_TAG` | block | Promo content under a transactional tag. Re-engage instead. |
| `HUMAN_AGENT_WINDOW_EXPIRED` | block | Past the 7-day support window. |
| `TAG_DEPRECATED` | warn | Standard tags deprecated after 2026-02-10. Move to re-engagement. |
| `MISSING_OPT_IN` | warn | No recorded opt-in. Confirm consent. |
| `WA_TEMPLATE_REQUIRED` | warn | WhatsApp needs an approved template outside its window. |
