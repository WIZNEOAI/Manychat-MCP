# ManyChat Open-Source + SaaS Blueprint

## Goal

Turn this repository into the **agent operating layer for ManyChat**:

- **Open-source core** for self-hosting, local agent use, and community contributions.
- **Hosted remote MCP product** for Claude Code, Cursor, Codex, and similar clients.
- **Digital-marketing-focused UX** built around ManyChat operations, not generic automation theater.

The north star is:

> "Bring your ManyChat API key, connect your MCP client, and operate ManyChat safely in minutes."

That means the platform should feel closer to **n8n's remote MCP access UX** than to a raw developer SDK.

## Strategic product position

This repo already has the right foundation:

- CLI-first execution
- API-key-first ManyChat access
- MCP compatibility mode
- prompts and resources for agent workflows

The opportunity is to package that foundation into three clear products:

1. **OSS engine**
   - CLI
   - MCP server
   - Docker image
   - Railway/VPS deployment
   - direct `MANYCHAT_API_KEY` usage

2. **Managed remote MCP**
   - hosted HTTPS MCP endpoint
   - workspace-scoped access tokens
   - tenant-safe ManyChat key storage
   - ready-made connection snippets for clients

3. **Web control plane**
   - landing page
   - docs
   - connection setup
   - API key vault
   - prompt/playbook catalog
   - usage, audit, and billing views

## What to copy from n8n MCP

From the official n8n MCP experience and the community n8n MCP server, the strongest product patterns are:

1. **Remote MCP as a first-class surface**
   - users connect clients to a public HTTPS endpoint
   - setup is documented for each client

2. **Clear authentication choices**
   - OAuth or access token for remote clients
   - direct credentials are not the only onboarding path

3. **Selective exposure**
   - not every capability should be blindly exposed
   - descriptions and visibility matter

4. **Client-specific setup guides**
   - Claude Desktop
   - Claude Code
   - Cursor
   - Codex
   - any streamable HTTP-compatible agent client

5. **Hosted + self-hosted split**
   - the OSS story stays simple
   - the hosted story adds convenience, governance, and scale

For ManyChat, the equivalent of "workflow exposure" should be:

- capability bundles
- safety-scoped toolsets
- marketing playbooks
- account resources with summaries and descriptions

## What not to copy from n8n

ManyChat should not become a generic workflow builder inside the MCP client.

Avoid these traps:

- exposing everything without policy boundaries
- turning MCP into the source of truth instead of the CLI/core runtime
- making LLM orchestration mandatory for basic operations
- relying on huge raw resource payloads that burn tokens

The ManyChat advantage is **high-value operational abstraction**, not generic automation sprawl.

## Product principles

1. **ManyChat API key is the execution credential**
   - for self-hosted OSS, the user provides it directly
   - for hosted SaaS, it is stored by the control plane and never exposed to MCP clients

2. **CLI/core remains the source of truth**
   - MCP is a transport and packaging layer
   - frontend is a control plane and onboarding layer

3. **Read before write**
   - prompts, tools, and UI should default to inspection, preview, mutation, verification

4. **Token efficiency is a feature**
   - summarized resources first
   - raw payloads only on demand
   - prompt templates must encourage staged fetching

5. **Policy-aware marketing automation**
   - do not imply safe sends outside channel rules
   - keep 24-hour window and send constraints visible

## Recommended end-state architecture

### 1) Execution engine

This is the durable foundation and should remain stable:

- typed ManyChat client
- CLI command surface
- shared response/error contracts
- rate-limit handling
- post-mutation verification helpers

This engine should remain usable even with:

- no frontend
- no OpenRouter
- no hosted SaaS

### 2) MCP gateway

This becomes the public "agent connection" surface.

Responsibilities:

- expose streamable HTTP MCP
- expose stdio for local/dev use
- map MCP auth to workspace or tenant credentials
- register tool bundles, prompts, and resources
- enforce per-tenant capability policy

Recommended auth behavior:

- **OSS/self-hosted**
  - `MANYCHAT_API_KEY` env var
  - `X-ManyChat-API-Key` header for remote compatibility
  - optional OAuth compatibility for clients that need it

- **Hosted SaaS**
  - client connects with hosted MCP token or OAuth
  - gateway resolves tenant/workspace
  - tenant's ManyChat API key is loaded from secure storage
  - gateway injects that key into the ManyChat execution layer

### 3) Control plane API

This is the missing SaaS layer.

Responsibilities:

- workspace creation
- user/team auth
- encrypted ManyChat API key storage
- workspace-scoped MCP token issuance
- OAuth client registration and revocation
- audit logs
- usage metering
- billing hooks
- prompt pack and capability configuration

Suggested persistence model:

- **Postgres**
  - users
  - workspaces
  - memberships
  - encrypted ManyChat credential metadata
  - MCP tokens metadata
  - usage events
  - prompt versions
  - resource snapshots metadata

- **Redis**
  - MCP sessions
  - OAuth codes/tokens
  - short-lived caches
  - rate-limiting buckets

### 4) Web frontend

This is the packaging layer users actually touch before MCP.

It should have two jobs:

1. **Sell the product**
2. **Reduce setup friction to nearly zero**

Recommended first-party web surfaces:

- **Landing page**
  - value proposition
  - "ManyChat for agents"
  - OSS vs hosted comparison
  - supported MCP clients

- **Docs**
  - quickstart
  - Railway deploy
  - VPS deploy
  - client connection snippets
  - prompt and resource reference

- **Workspace dashboard**
  - connect ManyChat API key
  - generate MCP token
  - copy client snippets
  - inspect enabled capabilities
  - view audit log

- **Playbook catalog**
  - onboarding
  - recovery
  - segmentation
  - campaign planning
  - automation diagnostics

- **Usage and billing**
  - request volume
  - active clients
  - plan limits

## Where OpenRouter should fit

OpenRouter should be **optional** and should not sit in the critical path for deterministic ManyChat operations.

Recommended role for OpenRouter:

- power a web copilot inside the dashboard
- let users choose a model for planning/reporting
- transform natural-language goals into safe step plans
- generate playbook drafts and campaign suggestions

OpenRouter should **not** be required for:

- CLI usage
- MCP tool execution
- direct ManyChat API access
- basic self-hosted deployment

That keeps the product:

- cheaper
- easier to self-host
- more reliable
- less coupled to model-provider outages

Recommended rule:

> LLMs plan and summarize. The core runtime executes.

## Prompt, resource, and context design

This is where ManyChat can beat generic MCP servers.

### Prompt strategy

Prompts should evolve from examples into a real **playbook system**.

Recommended prompt classes:

1. **Operational playbooks**
   - onboard subscriber
   - recover lead
   - diagnose automation

2. **Strategic playbooks**
   - segment audience
   - plan campaign
   - audit tagging structure

3. **Guardrail playbooks**
   - verify sending window
   - canary before bulk send
   - verify post-mutation state

Requirements:

- versioned
- parameterized
- concise by default
- explicit about read-before-write
- explicit about post-write verification

### Resource strategy

Current resources are a good start. The next step is to split them into layers:

1. **Raw resources**
   - full account objects
   - direct JSON mirrors of ManyChat API results

2. **Summary resources**
   - compact tag catalog
   - field schema digest
   - flow inventory summary
   - page health summary

3. **Policy resources**
   - rate limits
   - sending constraints
   - recommended operating sequences

The rule should be:

> Agents fetch summaries first, then hydrate details only when needed.

That is how the server becomes token-efficient.

### Context strategy

Add a formal context policy for MCP interactions:

- never preload every resource into the model context
- prefer lightweight indexes and summary manifests
- only expand a flow, tag, or subscriber when requested by the task
- keep mutation history as short receipts, not giant JSON blobs

Recommended context artifacts:

- `manychat://catalog/summary`
- `manychat://flows/summary`
- `manychat://schema/fields-summary`
- `manychat://meta/safety`

## Capability bundles instead of flat exposure

One of the best n8n ideas is selective exposure. For ManyChat, do that with capability bundles.

Recommended bundles:

- **read_only**
  - page info
  - subscriber inspection
  - tags list
  - fields list
  - flows list

- **operator**
  - read_only plus tag/field mutations

- **messaging_safe**
  - operator plus send tools behind additional policy checks

- **admin**
  - full access, audit visibility, token management

These bundles should drive:

- MCP tool visibility
- frontend toggles
- token scopes
- billing tiers

## Recommended frontend stack

For speed and compatibility with Railway, use:

- **Next.js**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**

Why:

- marketing site + dashboard in one stack
- server actions / API routes are good enough for early control-plane APIs
- easy auth integration
- strong docs and OSS familiarity

Suggested app structure:

```text
apps/
  web/
    app/
      (marketing)/
      docs/
      dashboard/
      api/
packages/
  manychat-core/
  manychat-cli/
  manychat-mcp-server/
  prompt-catalog/
  shared/
```

The current single-package repo does not need a big-bang rewrite. Migrate in phases:

1. keep `src/` intact
2. add `apps/web`
3. split packages only when the control plane starts stabilizing

## Deployment topologies

### A) Local developer mode

Best for:

- contributors
- local Claude/Cursor/Codex setups
- debugging

Stack:

- single process
- stdio or HTTP MCP
- env-based `MANYCHAT_API_KEY`
- memory store allowed only for local dev

### B) OSS self-host on VPS

Best for:

- agencies
- community users
- advanced self-hosters

Stack:

- Docker image
- public HTTPS reverse proxy
- Redis required for production HTTP/OAuth
- direct ManyChat API key per deployment

### C) OSS Railway deploy

Best for:

- one-click demo/self-host
- community adoption

Stack:

- one service for MCP HTTP
- optional Redis add-on for OAuth/session durability
- environment-driven setup

Important current gap:

> The current Railway start command points at `node dist/index.js`, which is not enough for a production HTTP MCP service by itself.

Public launch should explicitly start the server in HTTP mode, for example through a dedicated production command and documented environment contract.

### D) Hosted SaaS on Railway

Best for:

- managed commercial offering
- teams
- multi-tenant remote MCP

Recommended services:

1. **web**
   - Next.js marketing + dashboard

2. **api**
   - control plane
   - tokens
   - billing webhooks
   - audit endpoints

3. **mcp**
   - remote MCP endpoint
   - streamable HTTP
   - tenant credential resolution

4. **worker**
   - background syncs
   - resource snapshots
   - cleanup jobs

Backends:

- Postgres
- Redis

## Recommended auth model

### OSS

- user supplies ManyChat API key directly
- no mandatory account system
- keep CLI and self-host path extremely simple

### Hosted

- user signs in to dashboard
- creates workspace
- stores ManyChat API key
- system encrypts and stores it
- user generates workspace-scoped MCP access token
- client connects using hosted token, not raw ManyChat key

This is the correct SaaS boundary:

- **ManyChat API key** = upstream execution credential
- **MCP access token** = your product credential

## Security and key storage requirements

Before commercial launch, the hosted version should include:

- encryption at rest for ManyChat API keys
- key rotation support
- audit logs for token creation/revocation
- token scopes or capability bundles
- workspace isolation
- Redis-backed token/session state
- HTTPS-only remote MCP

Do not position the hosted product as secure enough for teams until these are real.

## Proposed repository shape for the public GitHub repo

Recommended medium-term structure:

```text
apps/
  web/
  api/
  worker/
packages/
  manychat-core/
  manychat-cli/
  manychat-mcp-server/
  prompt-catalog/
  shared/
docs/
  context/
  deploy/
  product/
  open-source-saas-blueprint.md
docker/
.github/
```

Keep the existing repo history and docs. Do not throw away the CLI-first identity.

## Commercial model recommendation

The cleanest model is:

### Open source

- self-host locally
- self-host on VPS
- self-host on Railway
- bring your own ManyChat API key

### Hosted free/community

- limited workspaces
- limited remote MCP tokens
- limited usage
- basic prompt packs

### Hosted pro/team

- more workspaces
- more client connections
- audit logs
- team members
- advanced playbooks
- managed prompt packs
- billing and usage dashboards

### Sponsor/supporter option

If you want a GitHub-Sponsors-style offer similar to community MCP products:

- keep the OSS core fully usable
- give supporters hosted access, premium prompt packs, or managed templates
- do not put the basic runtime behind a wall

## What must exist before public open-source launch

1. **Clear README**
   - what the product is
   - CLI-first positioning
   - hosted/self-hosted split

2. **Remote connection docs**
   - Claude Desktop
   - Claude Code
   - Cursor
   - Codex

3. **Production deploy docs**
   - Railway
   - VPS + Docker
   - required env vars

4. **Production-safe state handling**
   - Redis for OAuth/session state in production

5. **Stable startup contract**
   - explicit server command for production

6. **Screenshots or demo**
   - once frontend exists

7. **Issue templates and roadmap**
   - use the existing OSS momentum well

## Recommended implementation phases

### Phase 0: harden the current repo

- fix production HTTP startup contract
- document Railway deploy correctly
- document Redis requirement for production HTTP/OAuth
- add client-connection snippets

### Phase 1: launch the open-source MCP product properly

- publish npm package
- publish Docker image
- keep CLI + MCP solid
- improve prompts/resources/context summaries

### Phase 2: add the web frontend

- landing page
- docs
- hosted waitlist or private beta
- dashboard for token generation and ManyChat key storage

### Phase 3: launch hosted remote MCP

- tenant model
- Postgres + Redis
- audit logs
- capability bundles
- managed tokens

### Phase 4: add optional AI copilot through OpenRouter

- model selection in UI
- campaign planning assistant
- prompt pack generation
- report summarization

## Definitive recommendation

If the goal is to build the "n8n MCP for ManyChat", the winning architecture is:

1. keep **ManyChat API key** as the core execution primitive
2. keep **CLI/core** as the source of truth
3. make **remote MCP over HTTP** the flagship connection surface
4. add a **frontend control plane** for onboarding, tokens, docs, and billing
5. use **OpenRouter only as an optional planning/copilot layer**
6. make the OSS story excellent so the hosted story feels like convenience, not captivity

That gives you:

- a real open-source community product
- a credible Railway/VPS self-host path
- a hosted SaaS upgrade path
- a clean MCP experience for Claude, Cursor, Codex, and similar clients
- a marketing-operations niche strong enough to differentiate from generic MCP servers
