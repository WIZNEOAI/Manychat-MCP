# apps/web

Next.js frontend for the ManyChat CLI + MCP product: marketing, docs shell, and the
hosted **dashboard** (control plane).

## What is implemented

- Landing, docs, and dashboard UI (English).
- **Clerk** for sign-in; `/dashboard` is protected by middleware.
- **Convex** (`apps/web/convex/`) for `users` and `workspaces`; `ensureCurrentUser`
  creates a default **Personal** workspace on first visit.
- `ConvexProviderWithClerk` wires the Clerk session into Convex queries.

## Environment

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard |
| `CLERK_SECRET_KEY` | Clerk dashboard |
| `NEXT_PUBLIC_CONVEX_URL` | Convex dashboard (Deployment URL) |

Convex dashboard (server env): set **`CLERK_JWT_ISSUER_DOMAIN`** to match Clerk’s issuer
for the **convex** JWT template. See [Convex + Clerk](https://docs.convex.dev/auth/clerk).

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

Next steps: Stripe (`@convex-dev/stripe`), ManyChat vault, MCP tokens, Railway MCP
verification. See `docs/product/action-plan-convex-clerk-stripe.md` in the repo root.

The CLI and MCP runtime remain the source of truth for ManyChat execution.
