# apps/web

Next.js frontend for the ManyChat CLI + MCP product: marketing, docs shell, and the
hosted **dashboard** (control plane).

## What is implemented

- Landing, docs, and dashboard UI (English).
- **Clerk** for sign-in; `/dashboard` is protected by the Next.js proxy layer.
- **Convex** (`apps/web/convex/`) for `users` and `workspaces`; `ensureCurrentUser`
  creates a default **Personal** workspace on first visit.
- `ConvexProviderWithClerk` wires the Clerk session into Convex queries.
- **Hosted control-plane primitives**: encrypted ManyChat vault entries, MCP product
  tokens, usage counters, and audit events.
- **Stripe** via **`@convex-dev/stripe`**: Checkout for the Supporter subscription,
  Customer Portal, HTTP webhook at `/stripe/webhook`, and workspace `plan` sync
  (`free` | `supporter` | `pro`).

## Environment

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard |
| `CLERK_SECRET_KEY` | Clerk dashboard |
| `NEXT_PUBLIC_CONVEX_URL` | Convex dashboard (Deployment URL) |
| `MCP_INTERNAL_SHARED_SECRET` | Shared secret used by Railway to call the internal hosted MCP endpoints |
| `VAULT_MASTER_KEY` | Server-only key used to encrypt/decrypt stored ManyChat API keys |
| `VAULT_KEY_VERSION` | Optional vault version tag (defaults to `v1`) |

Convex dashboard (server env): set **`CLERK_JWT_ISSUER_DOMAIN`** to match Clerk’s issuer
for the **convex** JWT template. See [Convex + Clerk](https://docs.convex.dev/auth/clerk).

### First-time setup for `npx convex dev`

The first run is interactive on purpose. From the repo root:

```bash
npm install
npm run convex:dev
```

What happens:

1. Convex asks you to log in and select or create a project.
2. It writes the deployment selection for `apps/web/convex/`.
3. It pushes the schema and functions, then regenerates `convex/_generated/`.
4. You copy the printed deployment URL into `NEXT_PUBLIC_CONVEX_URL`.

If `npx convex dev` says `No CONVEX_DEPLOYMENT set`, that simply means you have not
finished the first interactive project selection yet.

### Clerk setup

Use the standard Clerk + Next.js + Convex flow:

1. Create a Clerk app.
2. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `apps/web/.env.local`.
3. In Clerk, create a JWT template named `convex`.
4. Copy the Clerk issuer / frontend API domain into Convex as `CLERK_JWT_ISSUER_DOMAIN`.
5. Run `npm run convex:dev` again so Convex picks up `convex/auth.config.ts`.

This repo now includes:

- a protected `/dashboard`
- modal auth buttons in the header and home page
- dedicated `/sign-in` and `/sign-up` routes using the official Clerk card components

### Stripe (Convex environment variables)

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from Stripe webhook endpoint |
| `STRIPE_PRO_PRICE_ID` | **Price** id currently used for the public Supporter subscription (e.g. USD 20/month) |
| `PUBLIC_APP_URL` | Origin for Checkout success/cancel redirects (e.g. `https://your-app.vercel.app`) |

Webhook URL (Stripe dashboard): `https://<deployment>.convex.site/stripe/webhook` — use the
events listed in the [@convex-dev/stripe README](https://www.npmjs.com/package/@convex-dev/stripe).

The Stripe integration follows the official `@convex-dev/stripe` component pattern:

- `StripeSubscriptions`
- `getOrCreateCustomer`
- `createCheckoutSession`
- `createCustomerPortalSession`
- webhook-driven plan sync back into `workspaces.plan`

Optional: `NEXT_PUBLIC_GITHUB_REPO_BASE` if the deployed fork differs from
`package.json` `repository.url`.

## Scripts

From repo root:

```bash
npm run web:dev
npm run web:build   # set the env vars above (placeholders are enough for CI)
npm run convex:dev  # pushes local convex/ to your dev deployment; run alongside web:dev
```

From this directory:

```bash
npm run dev
npm run convex:dev
```

## Regenerating Convex types

After changing Convex functions, run:

```bash
npm run convex:codegen
```

(requires a configured Convex project / `npx convex dev` once). The repo includes a
checked-in `convex/_generated/` baseline so `web:build` can run in CI with a placeholder
`NEXT_PUBLIC_CONVEX_URL`.

## Product direction

Current hosted scope:

- save a ManyChat API key once and never return it in plaintext
- rotate credentials without exposing the stored secret
- issue workspace-scoped MCP bearer tokens with one-time reveal
- render Claude Code / Cursor / Codex connection snippets
- track daily and monthly usage plus audit events

Deployment split:

- **Vercel**: landing, docs, dashboard, internal token-resolution routes
- **Convex**: workspace metadata, plans, usage, audit, token/account records
- **Railway**: remote MCP gateway running `MCP_REMOTE_AUTH=hosted_token`

See `docs/product/action-plan-convex-clerk-stripe.md` and `docs/deploy/railway.md`
in the repo root for the full hosted stack notes.

The CLI and MCP runtime remain the source of truth for ManyChat execution.
