# Roadmap

Near-term focus: **Revenue Operator** as the paid AI Revenue Ops System,
while preserving a strong **OSS self-host runtime** for CLI and MCP users.

## In progress / beta

- OSS runtime: CLI, MCP local/remote, and self-host deployment guides stay broadly usable
- Revenue Operator: dashboard, ManyChat vault, handoff/routing playbooks, reporting baseline
- Gateway: `hosted_token` mode with resolve / authorize / record
- Docs: production deploy guides (Vercel, Convex, Railway/VPS) plus operator product framing

## Next

- Durable or Redis-backed rate limits for internal and dashboard APIs
- Optional persisted MCP HTTP sessions (multi-replica gateways)
- n8n webhook nodes and playbook templates
- Supabase / external CRM sync for leads (hosted pipeline)
- Richer analytics in the dashboard

## Non-goals (v1)

- ManyChat “App Key” native app distribution
- OAuth as the primary CLI auth story
- Promising message delivery outside ManyChat / Meta policy windows

Product framing for the hosted half now lives with the control plane, in its own private
repository. What stays true here: this runtime works standalone, and the policy wedge stays
in the OSS layer. See [docs/control-plane-contract.md](docs/control-plane-contract.md) for
where the two halves meet.
