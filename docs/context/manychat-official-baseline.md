# ManyChat Official Baseline

This file normalizes the official constraints that govern the CLI.

## Authentication

For the Account Public API, the CLI uses a user-provided `API Key`.

Source of truth:
- https://help.manychat.com/hc/en-us/articles/14959510331420-How-to-generate-a-token-for-the-Manychat-API-and-where-to-get-parameters

Operational meaning:
- The CLI expects `MANYCHAT_API_KEY`, `--api-key`, or a configured local profile.
- The CLI does not create or rotate ManyChat credentials.
- `App Key` and app scopes belong to a different integration model and are documented only to mark the boundary of v1.

## Endpoint families used by this repo

- `/page/*`
- `/subscriber/*`
- `/sending/*`

Current command families map onto those endpoints:
- page and account reads
- subscriber reads and writes
- tag and custom field management
- flow listing and triggering
- content and text sending

## Messaging windows and compliance

Source of truth:
- https://help.manychat.com/hc/en-us/articles/23358636027932-Understanding-messaging-windows
- https://help.manychat.com/hc/en-us/articles/14281199732892-How-to-send-messages-outside-the-24-hour-and-7-day-windows-in-Messenger-and-Instagram

Agent-safe rules:
- Do not assume automated messages are allowed after the 24-hour window.
- Treat channel policy as stricter than developer convenience.
- Human-agent messaging windows do not make automated CLI sends safe.
- Message-tag behavior on Messenger changed materially in 2026 and must not be treated as a durable fallback.

Dated risk:
- ManyChat states that Message Tags on Messenger are deprecated starting February 9, 2026.
- Documentation and command help must not frame Message Tags as the default way to send outside the standard window.

## Rate limits and delivery posture

Use ManyChat limits as operational constraints, not as optimistic throughput targets.

Guidance for agents:
- Read before write.
- Verify target objects before mutation.
- Prefer canary batches for sends.
- Do not imply successful delivery unless the API confirms the request and the channel policy allows the action.
