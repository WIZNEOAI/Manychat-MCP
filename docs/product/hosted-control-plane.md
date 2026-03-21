# Hosted control-plane model

This document defines the intended SaaS/control-plane boundary for the ManyChat MCP
product.

## Core principle

The hosted product should not replace the CLI runtime.

Instead:

- the **CLI/core runtime** remains the execution engine
- the **MCP gateway** remains the transport layer
- the **frontend/dashboard** becomes the onboarding and workspace control plane

## Credential boundary

There are two different credential types in the hosted product:

### 1. ManyChat API key

This is the **execution credential**.

It is used by the runtime when it talks to ManyChat.

In the hosted product:

- the user saves it in the workspace vault
- it is encrypted at rest
- it is never exposed back to the MCP client after storage

### 2. MCP product credential

This is the **product credential**.

It is what Claude, Cursor, Codex, Antigravity, and similar clients use to connect
to the hosted MCP endpoint.

This credential is responsible for:

- workspace routing
- concurrency enforcement
- request quotas
- auditing
- billing attribution
- capability bundle enforcement

## Hosted user flow

Recommended Phase 1+ flow:

1. user signs into the dashboard
2. user creates a workspace
3. user stores one or more ManyChat API keys
4. user chooses capability scope / bundle
5. user issues an MCP token or completes OAuth setup
6. user copies a client-specific snippet
7. client connects to the hosted MCP endpoint
8. gateway resolves workspace and injects the correct ManyChat API key

## Workspace model

Initial workspace entities should be:

- users
- workspaces
- memberships
- manychat_accounts
- encrypted_manychat_credentials
- mcp_tokens
- usage_events
- billing_subscriptions
- audit_events

## ManyChat account model

The hosted product should support multiple ManyChat accounts per workspace.

That matters because:

- agencies manage multiple clients
- advanced operators separate brands/accounts
- pricing can scale with connected accounts

Recommended UX:

- each saved ManyChat API key is represented as a named account connection
- users select a default account per workspace
- future MCP tokens may be scoped to one account or a bundle of accounts

## Concurrency model

Hosted limits should be enforced at the product layer, not improvised in the MCP
client docs.

Recommended tracked dimensions:

- daily request volume
- monthly request volume
- concurrent MCP sessions
- connected ManyChat accounts
- optional team member count

## Auth modes across deployment models

### OSS self-host

- simplest path: `MANYCHAT_API_KEY` or `X-ManyChat-API-Key`
- no mandatory user system
- no billing required

### Hosted SaaS

- dashboard auth for human users
- MCP token or OAuth for remote clients
- encrypted ManyChat API key storage inside the workspace

## Capability bundles

Hosted access should not expose every tool equally.

Recommended bundles:

- `read_only`
- `operator`
- `messaging_safe`
- `admin`

These bundles should control:

- tool visibility
- token scopes
- plan entitlements
- dashboard toggles

## Why this matters for the frontend

The frontend is not just marketing.

It is the packaging layer for:

- connecting ManyChat API keys
- issuing MCP credentials
- showing client-specific connection snippets
- enforcing pricing tiers and concurrency
- making the hosted product easier than raw self-hosting

## Implementation pointers

For **entity list, REST-style route sketch, plan dimensions, and dashboard UI
states** (loading / empty / ready / error), see
[`control-plane-contracts.md`](./control-plane-contracts.md).

For **how this repo can grow** toward `apps/api` and an optional dedicated MCP
deploy without a big-bang migration, see
[`repository-evolution.md`](./repository-evolution.md).
