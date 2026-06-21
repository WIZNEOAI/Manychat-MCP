---
name: manychat-operator
description: Operate a ManyChat account correctly and safely through the ManyChat MCP server — discovery before mutation, Meta-compliant sending, audience segmentation, and flow execution. Use whenever an agent has the ManyChat MCP connected and must read or change subscribers, tags, custom fields, flows, or send messages on Messenger/Instagram/WhatsApp. Triggers: "send a message to my subscriber", "tag this lead", "trigger a flow", "update a custom field", "is it safe to message X", "operate my ManyChat".
---

# ManyChat Operator

You are operating a real ManyChat account that drives someone's revenue. A wrong send can get their Meta page flagged. Move like an operator: read first, validate before sending, change one thing at a time, verify after.

## The one rule that matters most

**Never call `send_content` or `send_text_message` without first reasoning about the messaging window.** Meta blocks (and penalizes) messages sent outside the 24-hour window unless a valid message tag applies. This MCP ships a `validate_message` tool and a built-in pre-send guard — use them, do not fight them.

## Safe-send protocol (follow every time)

1. **Know the window.** Determine whether the subscriber interacted in the last 24h. If you don't know, call `get_subscriber` and inspect `last_interaction` / `last_seen`. If still unknown, treat it as **outside** the window.
2. **Pre-flight with `validate_message`.** Pass `channel`, `hours_since_last_interaction` (omit if truly unknown), `message_tag` (if any), and `promotional: true` when the content sells/promotes. Read the verdict:
   - `allowed: false` (level `block`) → **do not send.** Fix the cause (re-engage, or use the right tag) — never paper over it.
   - level `warn` → send is allowed but note the finding to the user (e.g. tag deprecation, missing opt-in).
   - level `allow` → proceed.
3. **Send with honest flags.** On `send_text_message` / `send_content`, set `within_24h_window` and `promotional` truthfully, and pass `message_tag` only when one genuinely applies. The send tools run the same guard and will block a violating send.
4. **`override_policy` is not a shortcut.** Only set it when the user has explicitly confirmed a real, compliant reason the validator can't see. Default to obeying the block.
5. **Verify.** After any mutation, re-read the affected object to confirm the post-condition.

### Window decision shortcuts

- Inside 24h, any content → send freely.
- Outside 24h, transactional/utility update → use a valid non-promotional tag (`CONFIRMED_EVENT_UPDATE`, `POST_PURCHASE_UPDATE`, `ACCOUNT_UPDATE`). **Never** put promotional content under these — it violates policy and the guard blocks it.
- Outside 24h, human is actively helping the person → `HUMAN_AGENT` (covers a 7-day support window). Past 7 days it expires.
- Outside 24h, promotional → there is no compliant tag. **Re-engage** the subscriber first (get a fresh interaction) or wait. Do not force it.
- WhatsApp outside 24h → requires an approved **template**, not a tag.

Full rule set: `references/messaging-policy.md`.

## Core operating loop (any task)

1. **Discover.** Read before you write: `get_page_info`, `list_tags`, `list_custom_fields`, `list_flows`, `get_subscriber` / `find_subscriber_by_*`. Never assume an id, tag, or field name exists.
2. **Validate the taxonomy.** Confirm the target tag/field/flow exists (create it only if the user wants new taxonomy — avoid duplicates; reuse existing names).
3. **Act once.** One mutation at a time: `add_tag_to_subscriber`, `set_custom_field`, `send_flow`, etc.
4. **Verify.** Re-read to confirm.
5. **Report.** State exactly what changed.

## Segmentation & flows

- Segment with tags + custom fields, not guesswork. Inspect the existing taxonomy first and reuse it. See `references/segmentation.md` for naming conventions and the inspect→tag→trigger pattern.
- Trigger automations with `send_flow` (prefer a designed flow over ad-hoc `send_content` for anything repeatable).
- For bulk/campaign work: run a **canary** (1–3 subscribers), inspect the result, then ramp. Stop on `429`.

## Error handling

The CLI/tools distinguish: usage error (exit 2), config/auth (3), ManyChat API error (4), rate limit (5). On `429`, back off and reduce batch size — do not hammer. Surface API error messages to the user verbatim; never silently retry a mutation.

## References

- `references/messaging-policy.md` — the full Meta/ManyChat messaging-window, message-tag, HUMAN_AGENT, opt-in, and WhatsApp-template rules that `validate_message` enforces.
- `references/segmentation.md` — tag/custom-field naming conventions and the inspect→segment→act pattern.
