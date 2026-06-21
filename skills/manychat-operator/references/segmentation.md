# Segmentation with tags and custom fields

The inspect → segment → act pattern, plus naming conventions that prevent duplicate taxonomy.

## Pattern

1. `list_tags` and `list_custom_fields` to see the existing taxonomy.
2. Decide the segment in terms of *existing* tags/fields. Reuse names — do not create `lead-hot`, `Lead Hot`, and `hot_lead` as three tags.
3. Only create new taxonomy (`create_tag`, `create_custom_field`) when the user explicitly wants a new dimension.
4. Apply with `add_tag_to_subscriber` / `set_custom_field` (or the `_by_name` variants when you have names not ids).
5. Re-read the subscriber to verify.

## Naming conventions

- **Tags = states and segments**: `lead:new`, `lead:qualified`, `lead:customer`, `source:ig-comment`, `interest:pricing`. Lowercase, `dimension:value`, hyphenated values. Stable and few.
- **Custom fields = data**: `email`, `first_name`, `last_purchase_date`, `lead_score`, `next_action_at`. Snake_case. Type matters — set dates as dates, numbers as numbers (`set_custom_fields_bulk` accepts typed values).
- Prefer a small number of orthogonal tag dimensions (lifecycle, source, interest) over a sprawl of one-off tags. Dimensions compose; one-off tags rot.

## Common segments

- New unqualified leads: `lead:new`, not yet `interest:*`.
- Cart/checkout abandoners: `source:*` + a `last_*` custom-field threshold.
- Re-engageable cold leads: had an interaction but outside 24h — needs a fresh opt-in before promo (see messaging-policy.md).
