# apps/web

Minimal Next.js frontend scaffold for the ManyChat MCP product.

Current scope:

- landing page
- docs shell
- dashboard placeholder

Not yet in scope:

- full SaaS control plane
- billing implementation
- workspace auth
- ManyChat API key vault

## Run locally

From the repo root:

```bash
npm run web:dev
```

Or directly from this folder:

```bash
npm run dev
```

## Build

From the repo root:

```bash
npm run web:build
```

## Product direction

This app is the future packaging layer for:

- hosted onboarding
- client-specific MCP connection snippets
- workspace/account management
- pricing, limits, and billing UX

The CLI and MCP runtime remain the source of truth.
