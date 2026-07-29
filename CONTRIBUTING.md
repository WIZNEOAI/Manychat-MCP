# Contributing

Thanks for helping improve ManyChat MCP.

## Before you start

1. Read [AGENTS.md](AGENTS.md) and, for web changes, [apps/web/AGENTS.md](apps/web/AGENTS.md).
2. Keep the **CLI** as the source of truth: MCP and the dashboard should align with CLI behavior, not redefine it.
3. **Stdout** stays JSON for CLI; diagnostics belong on **stderr**.

## Contributing focus

We welcome improvements to the OSS runtime, docs, deployment guides, and safe operator workflows.

**In scope** — this is where contributions land:

| Path | What lives there |
|---|---|
| `src/` | CLI, MCP server, ManyChat client, tools, prompts, resources, policy wedge |
| `tests/` | Vitest suites for everything under `src/` |
| `docs/` | Deployment guides, CLI spec, product context, runbooks |

**Out of scope** — please open an issue instead of a PR:

- `apps/web/` is the hosted **control plane** — the paid product (workspaces, vault,
  billing, plan limits). It is slated to move to its own repository, so changes there
  will not survive the split. Bug reports about it are welcome; patches are not.
- Anything that weakens the policy wedge (see below).

Changes to the paid product surfaces should still preserve the self-host story and keep the repo useful for the community.

## Development

This is a **pnpm workspace** (root CLI/MCP + `apps/web`). Install once at the root —
`pnpm install` aborts without a TTY, so pass `CI=true` in scripts and agent sessions:

```bash
CI=true pnpm install --frozen-lockfile
```

Convex: from `apps/web`, run `npx convex dev` for a linked deployment (interactive first time).

## The gate

There is **no CI on pull requests** — the gate is local and it is on you to run it.
All six commands must be green before you open a PR:

```bash
# Root (CLI + MCP runtime)
pnpm run lint     # tsc --noEmit
pnpm test         # vitest run
pnpm run build    # tsc

# Web (control plane — run it even for runtime-only changes; it imports from src/)
pnpm run web:lint     # eslint
pnpm run web:test     # vitest run
pnpm run web:build    # next build
```

Expected test counts as of this commit — a PR should raise them, never lower them:

| Command | Tests |
|---|---|
| `pnpm test` | 87 |
| `pnpm run web:test` | 118 |

If a count drops, say so in the PR body and explain which test you deleted and why.

## Rules that PRs may not break

These are load-bearing. A PR that violates one gets closed rather than reviewed.
They are the enforceable half of the "What NOT to do" list in [CLAUDE.md](CLAUDE.md).

### The policy wedge is untouchable

`src/policy/` plus the `validate_message` tool implement the Meta 24-hour messaging
window: opt-in checks, valid message tags, the `HUMAN_AGENT` 7-day window, the
promotional-content-under-a-non-promotional-tag block, and the WhatsApp template
requirement. `send_text` and `send_content` run the same verdict before every send.

This guard is the reason the project exists — it is what separates it from a thin
ManyChat API wrapper, and it keeps operators out of Meta policy trouble. PRs that
weaken it, widen its allowances, add a new bypass, or route a send around it will not
be merged. Tightening it, covering a new channel, or adding a test is very welcome.

`override_policy` is the one sanctioned escape hatch and it stays explicit,
per-call, and logged. Do not add a global or env-var kill switch.

### Statelessness in `src/mcp/serve.ts`

MCP protocol revision `2026-07-28` has no protocol sessions. Every request builds its
own `McpServer` from the credential resolved for that request, and nothing may be
cached across requests except immutable registry data (tool and prompt schemas, which
are hoisted to module scope for exactly this reason).

Do not introduce state that outlives a request — no session maps, no per-client
caches, no module-level mutable objects. Cross-call state must be a server-minted
handle passed back as a tool argument. `tests/stateless-multi-instance.test.ts` runs
three processes behind round-robin routing and will catch you.

### Reserved JSON-RPC error codes

Never emit codes in `-32000..-32019` (legacy sub-range) or `-32020..-32099` (reserved
by the spec) from our own code. `tests/mcp-2026-conformance.test.ts` asserts this.

### Advertise no limit you do not enforce

If the landing, the docs, or a plan row states a ceiling, some code path must reject
the request that exceeds it. `maxConcurrentSessions` and `maxWorkspaces` were both
removed rather than left as copy the product could not honour. `pricing-copy.test.ts`
checks each pricing card against the row the gateway actually reads.

The mirror rule applies too: `src/hosted/plans.ts` must stay field-for-field identical
to what the control plane sends, because the resolve payload is cast rather than
parsed — a key the gateway declares but nobody sends is `undefined` behind a `number`.

## Pull requests

- Small, focused diffs. One concern per PR.
- **Conventional commits**: `type(scope): summary` — `feat`, `fix`, `refactor`,
  `docs`, `test`, `chore`. Explain *why* in the body; the diff already shows *what*.
- Run the full gate before opening the PR, and say in the body that you did.
- Add or update tests for behavior changes (Vitest; mocked HTTP only — no live
  ManyChat calls, ever, in any test).
- Do not log secrets (API keys, MCP tokens, vault material, shared internal secrets).
  `src/lib/logger.ts` redacts — use it.
- Do not add dependencies without checking both root and `apps/web` `package.json`.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities. A policy wedge bypass
counts as one: report it privately by email as SECURITY.md describes, not in a public
issue or PR.
