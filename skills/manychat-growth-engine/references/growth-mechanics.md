# Capture mechanics

How each top-of-funnel mechanic works and what it needs. All produce a subscriber + an opt-in; all should immediately qualify.

## Table of contents

- Comment-to-DM
- Keyword DM
- Click-to-Messenger (story / ad / button)
- Link-in-bio / ref links

## Comment-to-DM

Trigger: someone comments a keyword on a post/reel. ManyChat auto-DMs them. This is the highest-intent capture because the user self-selected.

Needs: a Growth Tool / comment-trigger configured in ManyChat (inspect with `list_growth_tools`), a keyword, and a capture flow. The auto-DM must: deliver the promised thing, ask one qualifying question, and tag `source:ig-comment` (+ post identifier if running several). Public comment reply should nudge "check your DMs."

## Keyword DM

Trigger: user DMs a keyword (often from a story CTA or bio). Same flow shape as comment-to-DM, tag `source:ig-keyword`. Good for "DM me WORD to get X" campaigns.

## Click-to-Messenger (story / ad / button)

Trigger: a story link, ad, or button opens Messenger with a pre-set ref. Opt-in is implicit on first message. Tag `source:ad` or `source:story`. For paid ads, the ref carries campaign context — capture it into a custom field for attribution.

## Link-in-bio / ref links

A ManyChat ref URL in the bio/link hub opens the bot with a known entry point. Tag by entry. Lower intent than comment/keyword — qualify harder before nurturing.

## What "qualify" means at capture

The first auto-reply asks the single most decision-relevant question (budget, role, need, timeline — pick one). Map the answer to a tag (`interest:*`, `lead:qualified`) and/or a custom field. A capture that doesn't set at least one tag is incomplete.
