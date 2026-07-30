# Contributing

Thanks for helping improve ManyChat MCP.

## Before you start

1. Read [AGENTS.md](AGENTS.md).
2. Keep the **CLI** as the source of truth: MCP should align with CLI behavior, not redefine it.
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

- The hosted **control plane** — workspaces, vault, billing, plan limits, dashboard.
  It used to live here as `apps/web` and moved to its own private repository on
  2026-07-29. Bug reports about the hosted product are welcome; patches cannot land here.
- Anything that weakens the policy wedge (see below).

This repository must keep working entirely on its own. A change is out of scope if it
makes the runtime need the hosted product to be useful.

## Development

Single package, one install:

```bash
pnpm install
```

`pnpm-workspace.yaml` is not a workspace declaration any more — it only carries the
`allowBuilds` entry for `esbuild`, without which Vitest cannot transform TypeScript.
Do not delete it; the Dockerfile copies it too.

## The gate

There is **no CI on pull requests** — the gate is local and it is on you to run it.
All three commands must be green before you open a PR:

```bash
pnpm run lint     # tsc --noEmit
pnpm test         # vitest run
pnpm run build    # tsc
```

`pnpm test` is **91** as of this commit. A PR should raise that number, never lower it.
If it drops, say so in the PR body and explain which test you deleted and why.

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

If the docs state a ceiling, some code path must reject the request that exceeds it.
`maxConcurrentSessions` and `maxWorkspaces` were both removed rather than left as copy
the product could not honour. For the same reason the README names the hosted tiers but
states no numbers: the test that used to guard that copy went to the control-plane repo
with it, and an unguarded number is a promise waiting to rot.

The gateway keeps **no** plan table of its own. Ceilings are enforced control-plane
side, which answers `429` before the gateway sees a session; a second copy here
could only ever drift or lie. The gateway parses the resolve payload against
[`docs/control-plane-contract.md`](docs/control-plane-contract.md) and rejects a
response that no longer honours it, rather than casting and discovering the gap
several frames later.

## What ships to npm

`pnpm run build` emits source maps — keep them, they make local debugging work.
`prepack` rebuilds with `--sourceMap false`, so **the published tarball has none**.

That is deliberate. `tsconfig.json` does not set `inlineSources`, so a map carries only
a path reference (`../src/foo.ts`) and never the source itself. Shipping the maps without
`src/` therefore adds ~107 kB of files pointing at code the installer does not have, and a
debugger fails to resolve them instead of stepping through anything. Publishing without
them took the tarball from 112 files / 89.5 kB to 78 / 68 kB.

If you ever want maps to work for consumers, add `src` to `files` — do not just re-enable
the maps.

## Pull requests

- Small, focused diffs. One concern per PR.
- **Conventional commits**: `type(scope): summary` — `feat`, `fix`, `refactor`,
  `docs`, `test`, `chore`. Explain *why* in the body; the diff already shows *what*.
- Run the full gate before opening the PR, and say in the body that you did.
- Add or update tests for behavior changes (Vitest; mocked HTTP only — no live
  ManyChat calls, ever, in any test).
- Do not log secrets (API keys, MCP tokens, vault material, shared internal secrets).
  `src/lib/logger.ts` redacts — use it.
- Do not add a dependency without saying in the PR body why a stdlib or existing dep
  cannot do the job. This package is something people install; every dep is theirs too.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities. A policy wedge bypass
counts as one: report it privately by email as SECURITY.md describes, not in a public
issue or PR.
