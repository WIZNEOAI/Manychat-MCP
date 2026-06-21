---
name: manychat-growth-engine
description: Design and run social-media lead growth on ManyChat — comment-to-DM and keyword capture, lead qualification, nurture sequences, and compliant cold-lead re-engagement across Instagram, Messenger, and WhatsApp. Use when the goal is to GROW or CONVERT an audience (not just operate one record): "set up a comment-to-DM", "capture leads from this post", "build a nurture sequence", "re-engage cold subscribers", "turn my followers into leads". Pairs with manychat-operator for the safe execution layer.
---

# ManyChat Growth Engine

Turn social attention into owned, opted-in conversations — without burning the page. Growth on ManyChat is a funnel: **capture → qualify → nurture → convert → recover**. Each stage has a compliant mechanic. This skill designs the funnel; `manychat-operator` executes each send safely (always via the safe-send protocol).

## The funnel

| Stage | Mechanic | ManyChat surface |
| --- | --- | --- |
| Capture | comment-to-DM, keyword DM, story/ad click-to-Messenger, link-in-bio | Growth Tools, keyword triggers, flows |
| Qualify | ask 1–3 questions, tag + set custom fields from answers | tags, custom fields, flows |
| Nurture | value-first sequence inside the 24h window or via opt-in topics | flows, OTN / recurring topics |
| Convert | targeted offer to a qualified, opted-in segment | flow/content send |
| Recover | re-open a window with cold leads before any promo | re-engagement flow |

See `references/growth-mechanics.md` for how each capture mechanic actually works, and `references/nurture-sequences.md` for sequence design.

## Operating principles (non-negotiable)

1. **Opt-in is the asset.** The win is not a sent message — it's a subscriber who *chose in*. Design every capture to produce a clear opt-in, so future sends are inside policy.
2. **Capture must immediately qualify.** The first auto-reply should both deliver the promised value AND ask the one question that lets you tag the lead. Untagged leads are dead weight.
3. **Respect the window.** Nurture and convert sends obey the 24h window / message-tag rules. Promotional sends to cold (outside-window) leads are not allowed — recover first. Never bypass `validate_message`.
4. **One job per message.** Each step has a single CTA. Sequences convert; walls of text don't.
5. **Measure to iterate.** Track which `source:*` tag converts. Kill mechanics that capture but don't qualify.

## Build a comment-to-DM (most common request)

1. Inspect existing growth tools and taxonomy: `list_growth_tools`, `list_tags`, `list_flows`.
2. Define the keyword and the deliverable (lead magnet, code, link).
3. Design the capture flow: deliver value → ask one qualifying question → tag `source:ig-comment` + the answer → opt-in confirmation.
4. Execute via `manychat-operator` (create taxonomy if missing, wire the flow, trigger with `send_flow`).
5. Canary test with one real comment before announcing.

## Re-engage cold leads (compliant)

Cold = had an interaction but now outside the 24h window. You **cannot** send them a promo directly.

1. Segment the cold, opted-in subscribers (tags + last-interaction custom field).
2. Send a **re-engagement** message that is a question or genuine value, using `HUMAN_AGENT` only if a human is actually in the loop — otherwise wait for a campaign window or use a permitted topic.
3. Their reply opens a fresh 24h window → *now* you can present the offer.
4. If they don't re-engage after a bounded number of touches, stop. Repeated cold sends risk the page.

Run every send through the safe-send protocol in `manychat-operator`.

## References

- `references/growth-mechanics.md` — how comment-to-DM, keyword, click-to-Messenger, and link-in-bio capture work, and what each needs.
- `references/nurture-sequences.md` — sequence structure, cadence, and the qualify-question patterns.
