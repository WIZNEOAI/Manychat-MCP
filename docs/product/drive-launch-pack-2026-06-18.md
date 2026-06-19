# ManyChat MCP — Drive Launch Pack

Updated: 2026-06-18

## Purpose

This folder is the current handoff pack for the ManyChat MCP product work.
It groups the repo docs that matter for OSS positioning, hosted beta readiness,
product framing, and deployment planning.

## Current decision

- Hosted gateway deployment: wait on Railway for now.
- Current state: repo + landing + control-plane logic are being prepared so the
  product is OSS-ready and hosted-beta-ready without deploying yet.

## Recommended reading order

1. `README.md` — canonical public overview
2. `docs/open-source-saas-blueprint.md` — PRD / product blueprint
3. `docs/context/product-baseline.md` — product baseline
4. `docs/product/hosted-control-plane.md` — hosted model
5. `docs/product/control-plane-contracts.md` — contracts and boundaries
6. `docs/product/action-plan-convex-clerk-stripe.md` — implementation blueprint
7. `docs/deploy/production-beta.md` — env + launch checklist
8. `BETA_READINESS_REPORT.md` — current launch readiness snapshot

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
- Deploy / launch
  - `docs/deploy/production-beta.md`
  - `docs/deploy/mcp-gateway-railway.md`
  - `docs/deploy/mcp-gateway-vps.md`
  - `docs/deploy/vercel-convex-clerk-stripe.md`
  - `docs/deploy/vps-docker.md`
  - `BETA_READINESS_REPORT.md`
- Evidence
  - landing desktop screenshot
  - landing mobile screenshot

## Notes

- The hosted control-plane auth was hardened on 2026-06-18: Next server routes
  now call Convex with Clerk JWT auth, workspace ownership is derived from
  `ctx.auth`, and hosted-token gateway functions require a shared secret inside
  Convex too.
- `MCP_INTERNAL_SHARED_SECRET` must exist both in the web runtime and in Convex.
- No production deploy, no Railway deploy, and no Git push were done in this pack.
