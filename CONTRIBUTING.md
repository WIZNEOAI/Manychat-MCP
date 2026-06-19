# Contributing

Thanks for helping improve ManyChat MCP.

## Before you start

1. Read [AGENTS.md](AGENTS.md) and, for web changes, [apps/web/AGENTS.md](apps/web/AGENTS.md).
2. Keep the **CLI** as the source of truth: MCP and the dashboard should align with CLI behavior, not redefine it.
3. **Stdout** stays JSON for CLI; diagnostics belong on **stderr**.

## Contributing focus

We welcome improvements to the OSS runtime, docs, deployment guides, and safe operator workflows.
Changes to the paid product surfaces should still preserve the self-host story and keep the repo useful for the community.

## Development

```bash
npm install
npm ci --prefix apps/web
npm run lint
npm test
npm run build
npm run web:lint
npm run web:test
npm run web:build
```

Convex: from `apps/web`, run `npx convex dev` for a linked deployment (interactive first time).

## Pull requests

- Small, focused diffs with clear commit messages.
- Add or update tests for behavior changes (Vitest; mocked HTTP only—no live ManyChat calls in CI).
- Do not log secrets (API keys, MCP tokens, vault material, shared internal secrets).

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.
