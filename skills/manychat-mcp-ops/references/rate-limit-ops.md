# Rate limit operations

Reference values are available in MCP resource `manychat://meta/limits`.

## Practical controls

- Prefer read-before-write and avoid duplicate writes.
- Add jitter between bulk actions.
- Retry only on transient statuses (`429`, `500`, `502`, `503`, `504`).
- Cap concurrent sender workers for campaign sends.

## Rollout pattern

1. Canary: 1-5 subscribers
2. Validate delivery + no API errors
3. Ramp to small batch
4. Full batch only after successful ramp

## Incident response

- If `429` spikes:
  - stop bulk sends
  - lower concurrency
  - resume with staged batches
