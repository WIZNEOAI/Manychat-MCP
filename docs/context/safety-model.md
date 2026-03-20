# Safety Model

## Core operating rules

- Read before write.
- Verify target objects exist before mutation.
- Verify post-condition after mutation.
- Treat send operations as high risk.
- Keep stdout parseable.

## Mutation policy

Safe default order:
1. inspect page, subscriber, tag, field, or flow
2. validate identifiers and names
3. perform one change
4. verify resulting state

For bulk or campaign-like work:
1. canary first
2. inspect response
3. ramp carefully
4. stop on `429`

## Channel policy guardrails

- Do not promise delivery outside the 24-hour window.
- Message tags are not a durable Messenger strategy after February 9, 2026.
- Human Agent guidance applies to manual support workflows, not generic automated CLI sends.
- WhatsApp and other channels can have stricter template and policy requirements than a raw API call implies.

## Error handling

CLI layers must distinguish:
- user input errors
- config and auth failures
- ManyChat API failures
- transient retries and rate limiting

Agent guidance:
- retriable failures should produce clear machine-readable errors
- non-retriable failures should preserve API message context
- diagnostic logs belong on `stderr`

## MCP compatibility posture

MCP remains useful when an MCP client explicitly needs it.

MCP is not the architecture source of truth.
CLI and core behavior define the product.

Legacy MCP constraints to remember:
- HTTP sessions are server-local
- OAuth and Redis are compatibility concerns
- MCP docs must not overshadow the CLI flow
