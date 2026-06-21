# Nurture sequence design

Turn a fresh opt-in into a qualified, ready-to-convert lead. Sequences run inside the 24h window or via permitted opt-in topics — never as cold promo blasts.

## Structure

A nurture sequence is 3–5 steps, each with one CTA:

1. **Deliver + welcome** — give the promised value immediately, set expectations, ask the qualifying question.
2. **Value** — one useful insight tied to the lead's tagged interest. Builds trust, no pitch.
3. **Proof** — a result/story relevant to their segment.
4. **Offer** — a single, specific CTA to the qualified, opted-in segment only.
5. **Recover (conditional)** — if no action, one re-engagement question, then stop.

## Cadence

- Inside the 24h window, space steps over the active conversation; don't dump all at once.
- Across days, you need either a fresh interaction (the user replied) or a permitted opt-in topic to keep messaging compliantly. If neither, the sequence pauses until re-engagement.
- Bounded touches: cap re-engagement attempts. Stop on silence — protecting the page beats one more send.

## Qualify-question patterns

- Binary routing: "Are you doing this for [A] or [B]?" → tag and branch.
- Intent scale: "Where are you at — just looking / planning / ready?" → `lead:cold|warm|hot`.
- Need capture: "What's the #1 thing you want to fix?" → `interest:*` + free-text custom field.

Keep it to one question per step. Every answer should change a tag or field so the segment sharpens with each reply.

## Segment-aware offers

Only present the offer to `lead:qualified` + opted-in + inside-window subscribers. Sending the offer to unqualified or cold leads wastes the window and risks the page. Use the operator segmentation pattern to build the audience before the send.
