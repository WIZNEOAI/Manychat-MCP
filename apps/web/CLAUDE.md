# ManyChat Web — Claude Code Context

Read `AGENTS.md` in this directory before writing any Next.js code — this is Next.js 16 with breaking changes.

## Commands

```bash
npm run dev          # dev server
npm run build        # production build
npm run lint         # eslint
npm run convex:dev   # convex dev server
npm run convex:deploy # deploy convex
```

## Stack

- Next.js 16, React 19, Tailwind 4
- Clerk for auth
- Convex for backend/database
- @convex-dev/stripe for payments

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
