# ManyChat MCP — Drive Launch Pack

Updated: 2026-06-19

## Purpose

This folder is the current handoff pack for the ManyChat MCP / Revenue Operator product work.
It groups the repo docs that matter for OSS positioning, hosted beta readiness,
product framing, deployment planning, and the 2026-06-19 continuation canon.

## Current decision

- Canon from 2026-06-19: Google Doc `ManyChat MCP / Revenue Operator — Canon + Handoff — 2026-06-19`.
- Hosted gateway deployment: wait on Railway/VPS until Ulises approves an environment.
- Current state: repo + landing + control-plane logic + Lead-State v1 are OSS-ready / hosted-beta-ready candidates, but still require docs/changelog update, full final verification, PR review, and approval before push/deploy.

## Recommended reading order

1. `ManyChat MCP / Revenue Operator — Canon + Handoff — 2026-06-19` — active continuation source of truth
2. `docs/product/completion-handoff-2026-06-19.md` — local agent execution map
3. `README.md` — canonical public overview
4. `docs/open-source-saas-blueprint.md` — PRD / product blueprint
5. `docs/context/product-baseline.md` — product baseline
6. `docs/product/hosted-control-plane.md` — hosted model
7. `docs/product/control-plane-contracts.md` — contracts and boundaries
8. `docs/product/action-plan-convex-clerk-stripe.md` — implementation blueprint
9. `docs/deploy/production-beta.md` — env + launch checklist
10. `BETA_READINESS_REPORT.md` — historical readiness snapshot; must be updated before PR

## Folder contents

- Public product/docs
  - `README.md`
  - `ROADMAP.md`
- PRD / product framing
  - `docs/open-source-saas-blueprint.md`
  - `docs/context/product-baseline.md`
  - `docs/context/manychat-official-baseline.md`
  - `docs/context/cli-spec.md`
  - `docs/context/safety-model.md`
  - `docs/context/mcp-migration-map.md`
- Hosted control plane
  - `docs/product/hosted-control-plane.md`
  - `docs/product/control-plane-contracts.md`
  - `docs/product/pricing-tiers.md`
  - `docs/product/repository-evolution.md`
  - `docs/product/action-plan-convex-clerk-stripe.md`
  - `docs/product/completion-handoff-2026-06-19.md`
  - `docs/product/manychat-canon-drive-2026-06-19.md`
- Deploy / launch
  - `docs/deploy/production-beta.md`
  - `docs/deploy/mcp-gateway-railway.md`
  - `docs/deploy/mcp-gateway-vps.md`
  - `docs/deploy/vercel-convex-clerk-stripe.md`
  - `docs/deploy/vps-docker.md`
  - `BETA_READINESS_REPORT.md`
- Evidence
  - landing desktop screenshot — 2026-06-19
  - landing mobile screenshot — 2026-06-19
  - dashboard auth gate screenshot — 2026-06-19

## Notes

- The hosted control-plane auth was hardened: Next server routes call Convex with Clerk JWT auth, workspace ownership is derived from `ctx.auth`, and hosted-token gateway functions require a shared secret inside Convex too.
- Lead-State v1 is implemented: `operatorLeads`, lead create/list/status APIs, dashboard lead queue, workspace-serialized status counters, and lazy exact backfill for old workspaces.
- `MCP_INTERNAL_SHARED_SECRET` must exist both in the web runtime and in Convex.
- No production deploy, no Railway/VPS deploy, no public publishing, and no Git push were done in this pack.
