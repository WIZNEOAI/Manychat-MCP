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
