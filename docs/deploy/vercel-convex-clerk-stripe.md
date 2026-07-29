# Vercel + Convex + Clerk + Stripe

## Overview

- **Vercel** hosts the Next.js app in `apps/web` (marketing, dashboard, internal API routes).
- **Convex** hosts database, queries, mutations, and the Stripe webhook integration.
- **Clerk** authenticates users; Convex validates JWTs via `convex/auth.config.ts`.
- **Stripe** subscriptions update workspace `plan` through `@convex-dev/stripe`.

## Vercel project

1. Connect the Git repository.
2. Set **Root Directory** to `apps/web`.
3. Framework preset: Next.js.
4. Add environment variables from [apps/web/.env.example](../../apps/web/.env.example).

### Required web env

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CONVEX_URL`
- `MCP_INTERNAL_SHARED_SECRET` (long random; match gateway)
- `VAULT_MASTER_KEY` (long random; AES-256 via SHA-256 of this string)
- `NEXT_PUBLIC_MCP_HTTP_URL` (your public MCP endpoint for user snippets)

## Convex

1. Run `npx convex dev` once locally to link the project (writes deployment config under `apps/web/convex/`).
2. In Convex dashboard → Settings → Environment Variables:
   - `CLERK_JWT_ISSUER_DOMAIN`
   - Stripe keys and price IDs (see [apps/web/README.md](../../apps/web/README.md))
   - `PUBLIC_APP_URL` = production site origin

3. Deploy: `npm run convex:deploy` from repo root.

## Clerk

1. Allowed redirect URLs: your Vercel production URL + localhost for dev.
2. JWT template `convex`: issuer domain copied to Convex `CLERK_JWT_ISSUER_DOMAIN`.

## Stripe

1. Create products/prices for monthly and annual **Supporter and Pro** tiers.
2. Put all four price IDs in Convex env: `STRIPE_SUPPORTER_MONTHLY_PRICE_ID`,
   `STRIPE_SUPPORTER_ANNUAL_PRICE_ID`, `STRIPE_PRO_MONTHLY_PRICE_ID`,
   `STRIPE_PRO_ANNUAL_PRICE_ID`.
3. Webhook URL: `https://<deployment>.convex.site/stripe/webhook` (Convex-hosted,
   not Vercel). Copy its signing secret to Convex as `STRIPE_WEBHOOK_SECRET`.

Full configuration order, the test-mode rehearsal, and the checklist to run
before charging anyone: [docs/billing-runbook.md](../billing-runbook.md).

## Internal MCP API

Next.js routes under `/api/internal/mcp/*` are called **only** by your MCP gateway. They require header:

`x-manychat-internal-secret: <MCP_INTERNAL_SHARED_SECRET>`

Ensure this secret is never exposed to browsers.
