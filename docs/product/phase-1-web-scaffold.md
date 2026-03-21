# Phase 1 web scaffold plan

The minimal `apps/web` scaffold now exists.

This document is the follow-through plan for turning that scaffold into a real
frontend surface without destabilizing the CLI-first core.

## Goal

Keep the minimal **Next.js + TypeScript + Tailwind** scaffold focused on:

- landing page
- docs shell
- future dashboard shell

Without:

- forcing a monorepo package split yet
- moving the existing `src/` runtime
- introducing SaaS control-plane complexity early

## Recommended shape

```text
apps/
  web/
    app/
      (marketing)/
        page.tsx
        layout.tsx
      docs/
        page.tsx
      dashboard/
        page.tsx
      api/
    components/
    lib/
    public/
```

## Recommended stack

- Next.js
- TypeScript
- Tailwind CSS
- optionally `shadcn/ui` after the shell is stable

## Recommended implementation sequence

### 1. Keep the current runtime package intact

The current implementation keeps `src/` as the runtime source of truth.

Do **not** split into `packages/` yet.

### 2. Keep frontend startup simple from the repo root

The root package should expose scripts such as:

```json
{
  "scripts": {
    "web:dev": "npm --prefix apps/web run dev",
    "web:build": "npm --prefix apps/web run build"
  }
}
```

### 3. Keep only three pages in the first pass

- `/` — landing page
- `/docs` — docs entry page
- `/dashboard` — placeholder dashboard page

Copy should explain:

- CLI-first product
- local MCP vs remote MCP
- self-host now, hosted later
- bring your own ManyChat API key

### 4. Keep docs source-of-truth in `docs/`

Phase 1 should not duplicate long-form docs yet.

Instead, the web docs page can:

- link into the markdown docs in this repo, or
- render a very small curated subset

### 5. Avoid introducing auth/database dependencies yet

Do **not** add:

- NextAuth/Auth.js
- Prisma
- Postgres
- Redis
- billing
- workspace model

Those belong to the hosted control-plane phases, not to the initial web shell.

## Current acceptance criteria

- `apps/web` builds independently
- landing page explains the product clearly
- docs page points to repo deploy/connect docs
- dashboard page is explicitly marked as future work
- root runtime still builds and tests normally

## Progress since the initial scaffold

The web shell now aims to feel **product-shaped** while staying backend-free:

- landing narrative for CLI vs local MCP vs remote MCP, self-host vs hosted, and
  the two-credential model
- docs shell with sidebar anchors and links to GitHub source files
- dashboard shell with **concrete sections** (workspaces, members, accounts,
  vault, MCP tokens, usage) aligned with
  [`control-plane-contracts.md`](./control-plane-contracts.md)

Long-form docs remain in `docs/`; the site links out rather than duplicating
markdown rendering in Phase 1.

## What should come immediately after the scaffold

Once the web shell exists, the next useful increments are:

1. richer landing page copy and screenshots
2. docs navigation and markdown rendering from repo docs
3. hosted waitlist or private beta CTA
4. dashboard placeholder for future ManyChat key vault + MCP token issuance
5. explicit pricing/tier presentation tied to workspace/account/concurrency limits

Items 1, 4, and 5 are partially addressed in the evolving `apps/web` UI; items 2–3
remain optional next steps.
