# Roadmap

Near-term focus: **beta-quality hosted MCP** plus a strong **OSS self-host** story.

## In progress / beta

- Dashboard: ManyChat key validation before vault, disconnect, token test, usage and audit
- Gateway: `hosted_token` mode with resolve / authorize / record
- Docs: production deploy guides (Vercel, Convex, Railway/VPS)

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

See [docs/open-source-saas-blueprint.md](docs/open-source-saas-blueprint.md) for product framing.
