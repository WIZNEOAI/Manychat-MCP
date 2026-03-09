---
name: manychat-mcp-ops
description: Operate, validate, and troubleshoot the ManyChat MCP server in production and development. Use when an agent must automate ManyChat through MCP tools, run OAuth/MCP connectivity checks, validate auth headers, verify rate-limit-safe workflows, or execute lead/campaign/diagnostic operational playbooks.
---

# ManyChat MCP Ops

## Workflow

1. Confirm transport mode (`stdio` or `http`) and auth mode (OAuth bearer or direct API key header).
2. Run smoke checks from `scripts/` before attempting business operations.
3. Prefer read tools first (`get_page_info`, `list_tags`, `list_custom_fields`, `list_flows`).
4. For mutating actions, execute in this order:
   - validate target subscriber
   - validate supporting tag/field/flow exists
   - perform one change at a time
   - verify post-condition
5. If MCP OAuth fails, use troubleshooting in `references/oauth-mcp-troubleshooting.md`.
6. Respect documented ManyChat limits and avoid bulk-send without explicit confirmation.

## High-value playbooks

- Onboarding lead:
  - inspect subscriber
  - apply tags and custom fields
  - trigger onboarding flow
- Segment and campaign:
  - inspect tags/fields
  - create missing taxonomy
  - send flow/content with controlled rollout
- Recovery:
  - inspect inactivity and opt-ins
  - send compliant re-engagement path
- Automation diagnosis:
  - inspect page config, flows, tags, fields
  - isolate targeting/config/timing causes

## References

- Tool map and endpoint matrix: `references/tool-map.md`
- OAuth and MCP auth troubleshooting: `references/oauth-mcp-troubleshooting.md`
- Rate limit and rollout guidance: `references/rate-limit-ops.md`

## Scripts

- `scripts/smoke_http_mcp.mjs`:
  - checks `/health`
  - checks OAuth well-known endpoints
  - can probe `/mcp` with API key header when provided
