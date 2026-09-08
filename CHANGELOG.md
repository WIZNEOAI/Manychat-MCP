# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Request id end to end.** Every HTTP request gets an 8-char `requestId`: logged, returned as
  `x-request-id`, sent to the control plane on `authorize` and `record`, handed to the
  per-request `McpServer`, and echoed by the send tools in `_meta.requestId`. One key joins a
  gateway log line, a control-plane audit row and what the agent saw.
- **`record` telemetry actually fires.** After each hosted request the gateway posts a
  fire-and-forget `request` event carrying `requestId`, JSON-RPC method and HTTP status.
- **Approval-gated overrides.** `send_content` / `send_text_message` accept `approval_ref`.
  Under the `messaging_safe` bundle (delegated tokens) `override_policy` without it is refused
  with `_meta.code = "approval_required"`; with it, the send goes out, `_meta.policy` is
  `"overridden"` and a `policy_override` warn line records tool, subscriber, approval and
  request id. Plain blocks now carry `_meta.code = "policy_blocked"`.
- **Gateway rate limit.** Per-credential fixed window on `POST /mcp` (default 120/min,
  `MCP_RATE_LIMIT_PER_MINUTE`, `0` disables). Memory per process by default; `MCP_RATE_LIMIT_STORE=redis`
  shares the counter across replicas via `REDIS_URL` and fails open if Redis is down. Over the
  ceiling answers HTTP 429, JSON-RPC `-31003`, `retry-after`. This is abuse protection, not a
  plan limit — ceilings stay control-plane side.

- ManyChat API key validation via `GET /page/getInfo` before saving or rotating keys in the dashboard
- Convex fields for validation metadata (`manychatPageName`, `keyValidationStatus`, `keyValidatedAt`)
- Dashboard: disconnect ManyChat account (revokes all workspace MCP tokens), revoke all tokens action, hosted MCP connection test
- API hardening: Zod validation on v1 and internal MCP routes, in-memory rate limits, production-safe generic errors for unexpected failures
- Deploy docs: `docs/deploy/production-beta.md`, `vercel-convex-clerk-stripe.md`, `mcp-gateway-railway.md`, `mcp-gateway-vps.md`
- Docker: root `docker-compose.yml`, `.dockerignore`
- Tests: capability bundles, hosted control plane client, web validation and token helpers
- Community files: `CONTRIBUTING.md`, `SECURITY.md`, `ROADMAP.md`, issue and PR templates
- CI: web lint, test, and build jobs

### Changed

- Expanded root and `apps/web` `.env.example` for hosted gateway and web variables
- README narrative for open-source + hosted positioning
- **Key rotation now revokes all active workspace MCP tokens** (security: forces re-issue after credential change)
- Root `package.json` now exposes `web:test` shorthand; web `package.json` gained `test` script
- **The gateway now parses the `/api/internal/mcp/resolve` response instead of casting it.** A `200`
  that no longer honours the contract raises a `502` naming the offending field, rather than passing
  `undefined` into code typed as `string`. Unknown fields are stripped, so the control plane can add
  keys without a coordinated gateway release.
- `HostedResolvedSession`, `HostedPlan`, `CapabilityBundle` and `HostedPlanLimits` are now derived from
  Zod schemas, so validator and type cannot drift. Fields no gateway code reads (`workspaceName`,
  `accountName`, `plan`, `limits`) are typed optional — they were promising values nobody had checked for.

- **This repository is now the OSS runtime only** — CLI, MCP server, and gateway. The hosted
  control plane (`apps/web`: dashboard, vault, billing, plan limits) moved to its own private
  repository with the 31 commits of history that touched it. Nothing here imported it; the
  only coupling was, and remains, the HTTP contract in `docs/control-plane-contract.md`,
  reached only under `MCP_REMOTE_AUTH=hosted_token`.
- No longer a pnpm workspace. `pnpm-workspace.yaml` survives carrying only the `allowBuilds`
  entry for `esbuild` — the Dockerfile copies it, so deleting it breaks the container build.
- The README names the hosted tiers but states **no prices or quotas**. The test that guarded
  that copy against the enforced limits shipped with the control plane, and an unguarded
  number is a promise waiting to rot. `repo-positioning.test.ts` now fails if a figure
  reappears.

### Removed

- `web:*` and `convex:*` scripts, and the `apps/web` entries in `.gitleaksignore` — which were
  stale anyway, pinning lines 17/83/97 while the fixtures had drifted to 19/85/99, each listed
  twice.
- `src/hosted/plans.ts` and its test. The table was never read by production code: plan ceilings are
  enforced control-plane side, which answers `429` before the gateway sees a session. A second copy of
  the paid tiers in the OSS package could only drift or lie.
