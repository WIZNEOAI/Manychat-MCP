# Phase 1 web scaffold plan

Phase 0 deliberately does **not** introduce the full web app yet.

That keeps the repo focused on:

- CLI-first execution
- stable MCP HTTP startup
- self-host deployment
- connection docs

This document defines the exact next step for introducing `apps/web` with minimal
risk.

## Goal

Add a minimal **Next.js + TypeScript + Tailwind** scaffold for:

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

### 1. Introduce the app without changing the runtime package

From the repo root:

```bash
mkdir -p apps
npx create-next-app@latest apps/web --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*"
```

Keep the current ManyChat runtime in place.

Do **not** split into `packages/` yet.

### 2. Add root-level workspace support

Update the root `package.json` to use npm workspaces:

```json
{
  "workspaces": [
    "apps/*"
  ]
}
```

Then add scripts such as:

```json
{
  "scripts": {
    "web:dev": "npm --workspace apps/web run dev",
    "web:build": "npm --workspace apps/web run build"
  }
}
```

### 3. Create only three pages in the first pass

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

## Minimum acceptance criteria for the scaffold

- `apps/web` builds independently
- landing page explains the product clearly
- docs page links to deploy/client docs
- dashboard page is explicitly marked as future work
- root runtime still builds and tests normally

## What should come immediately after the scaffold

Once the web shell exists, the next useful increments are:

1. polished landing page
2. docs navigation for deploy/connect guides
3. hosted waitlist or private beta CTA
4. dashboard placeholder for future ManyChat key vault + MCP token issuance
