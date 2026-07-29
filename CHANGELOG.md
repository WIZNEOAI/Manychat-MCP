# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

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

### Removed

- `src/hosted/plans.ts` and its test. The table was never read by production code: plan ceilings are
  enforced control-plane side, which answers `429` before the gateway sees a session. A second copy of
  the paid tiers in the OSS package could only drift or lie.
