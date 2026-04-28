# WIZNEO / Gnosix pipeline

This document explains how **ManyChat MCP** fits the WIZNEO and Gnosix operating model. It is **internal positioning**, not end-user product copy.

## Brands

- **WIZNEO** — Open source, community, education (Skool), infoproducts, lead magnets (e.g. reto.wizneo.org), public demos, beta cohorts, hosted SaaS entry (e.g. ~$20/mo supporter tier narrative in [pricing-tiers.md](product/pricing-tiers.md)).
- **Gnosix** — Done-for-you consulting: automation implementation, client onboarding, funnel and DM audits, retainer programs (12-week / 90-day style), integration with n8n, Supabase, Convex, VPS, and client stacks.

## Product placement

- **OSS core:** CLI + MCP + Docker — developers and agencies self-host.
- **Hosted layer:** Dashboard on Vercel, data on Convex, auth on Clerk, billing on Stripe; MCP gateway on Railway or VPS resolves **product tokens** without exposing ManyChat API keys to MCP clients.

## Operational funnel (target)

1. **Public content** (technical posts, demos, GitHub, YouTube) → awareness.
2. **Lead magnet** (challenge, checklist, template) → email / community capture.
3. **Automation** (n8n, webhooks, Supabase tables) → scoring and follow-up.
4. **Community** (Skool) + **beta list** → trust and feedback.
5. **Hosted beta** (~$20) or **low-ticket offer** (~$500 course/setup) → revenue and case studies.
6. **Gnosix upsell** — implementation, audits, ongoing operations.

## How this repo supports the pipeline

- **Lead education:** README + docs show a clear path from “clone and CLI” to “hosted token.”
- **Credibility:** Open source core reduces fear; hosted tier captures convenience buyers.
- **Delivery:** Gnosix can deploy gateways per client or standardize on WIZNEO-hosted infra.

## Future integrations (roadmap only)

- n8n nodes / webhooks for ManyChat MCP events
- Supabase sync for leads and workspace metadata
- ManyChat flow / template packs
- Skool invite automation
- LinkedIn / X content triggers
- Reddit launch playbooks
- Optional AI copilot on top of MCP tools (policy-bound)

## Deploy reference

Operators should start with [deploy/production-beta.md](deploy/production-beta.md) and [deploy/vercel-convex-clerk-stripe.md](deploy/vercel-convex-clerk-stripe.md).
