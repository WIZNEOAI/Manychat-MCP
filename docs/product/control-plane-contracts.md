# Hosted control plane — contracts and UI scaffold

This document pins **data shapes, API boundaries, and dashboard states** so backend
work can start without redesigning the frontend. It complements
[`hosted-control-plane.md`](./hosted-control-plane.md).

Nothing here requires a monorepo split. It is written so `apps/api` can appear later
as the implementation home for these routes.

## Credential recap

| Credential | Role | Held by |
| --- | --- | --- |
| ManyChat API key | Execution: talks to ManyChat Account Public API | OSS env/header; hosted encrypted vault |
| Dashboard session | Human access to workspace settings | Hosted only (future auth provider) |
| MCP access token / OAuth | Product: routing, limits, audit, billing on the MCP gateway | Hosted issuance; never equals ManyChat key |

## Core entities (persistence sketch)

Logical tables or documents; naming is indicative.

- **User** — `id`, `email`, `created_at`
- **Workspace** — `id`, `name`, `slug`, `plan` (`free` | `supporter` | `pro`), `created_at`
- **Membership** — `workspace_id`, `user_id`, `role` (`owner` | `admin` | `member`), `created_at`
- **ManyChatAccount** — `id`, `workspace_id`, `display_name`, `default` boolean, `created_at`  
  (no raw key in this row — only metadata)
- **ManyChatCredential** — `id`, `account_id`, `ciphertext`, `kms_key_id` or `envelope_meta`, `last_rotated_at`
- **McpToken** — `id`, `workspace_id`, `account_id` (nullable = default account), `name`, `prefix` (e.g. `mcp_live_abc…`), `scopes` / `bundle`, `revoked_at`, `created_at`
- **UsageEvent** — `workspace_id`, `timestamp`, `dimension` (`request`, `session_start`, …), `quantity`, optional `token_id`
- **AuditEvent** — `workspace_id`, `actor_user_id` | `actor_token_id`, `action`, `metadata_json`, `timestamp`

## REST-style API surface (v0 sketch)

Prefix: `/api/v1` (future `apps/api`). All responses JSON. Auth: `Authorization: Bearer <session_jwt>` for dashboard-origin calls.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/workspaces` | List workspaces for current user |
| `POST` | `/workspaces` | Create workspace |
| `GET` | `/workspaces/:id` | Workspace detail + plan |
| `GET` | `/workspaces/:id/members` | List memberships |
| `POST` | `/workspaces/:id/members` | Invite / add member (Pro) |
| `PATCH` | `/workspaces/:id/members/:userId` | Change role |
| `DELETE` | `/workspaces/:id/members/:userId` | Remove member |
| `GET` | `/workspaces/:id/manychat-accounts` | List connected accounts (metadata) |
| `POST` | `/workspaces/:id/manychat-accounts` | Register account + submit key (server encrypts) |
| `DELETE` | `/workspaces/:id/manychat-accounts/:accountId` | Disconnect |
| `POST` | `/workspaces/:id/manychat-accounts/:accountId/rotate-key` | Replace ciphertext |
| `GET` | `/workspaces/:id/mcp-tokens` | List tokens (masked) |
| `POST` | `/workspaces/:id/mcp-tokens` | Issue token; returns **full secret once** |
| `DELETE` | `/workspaces/:id/mcp-tokens/:tokenId` | Revoke |
| `GET` | `/workspaces/:id/usage` | Aggregates: daily/monthly requests |
| `GET` | `/workspaces/:id/audit` | Paginated audit (Pro) |

MCP gateway (future `apps/mcp` or current HTTP entry extended) resolves `Bearer <mcp_token>` → workspace + account + injected ManyChat key. That path is **not** the dashboard API.

## Plan limits (enforceable dimensions)

Align with [`pricing-tiers.md`](./pricing-tiers.md). Example enforcement keys:

- `max_manychat_accounts_per_workspace`
- `max_mcp_tokens`
- `daily_request_quota`
- `monthly_request_quota`
- `audit_log_retention_days`

Hosted middleware checks these on token issue, session accept, and periodic usage flush.

## Dashboard UI states (implementation checklist)

Each area should render **four states**: `loading`, `empty`, `ready`, `error`.

1. **Workspace shell**
   - Empty: CTA create first workspace
   - Ready: name, plan badge, link to billing (placeholder)

2. **Members**
   - Empty: owner only
   - Ready: table (email, role, joined)
   - Pro-gated: invite button; Free/Supporter copy explains upgrade

3. **ManyChat accounts**
   - Empty: “Connect your first account” + link to official token docs
   - Ready: list with default badge, disconnect
   - Never show full API key after save (only “saved · last rotated”)

4. **Encrypted vault (read-only UX)**
   - Copy: “Keys encrypted at rest; not shown again after save.”
   - Status: `configured` | `not_configured` per account

5. **MCP tokens**
   - Empty: “Issue a token for Cursor / Claude / Codex”
   - Ready: masked prefix, created, revoke
   - One-time reveal modal on create (pattern like Stripe API keys)

6. **Capability bundle**
   - Select bundle for new tokens: `read_only` | `operator` | `messaging_safe` | `admin`
   - Show which tools that implies (link to MCP migration map)

7. **Usage & limits**
   - Bars: daily and monthly requests vs plan cap
   - Copy when over limit: upgrade or self-host OSS

## Webhook / billing hooks (later)

- Stripe customer + subscription id on workspace
- Webhook updates `plan` and limit cache

Document only for now; no implementation required in the OSS repo until hosted launch.
