# Pricing and plan model

> **Canonical pricing + limits** live in `apps/web/lib/site-data-shared.ts` (`pricingTiers`); **unit economics** in [`PLAN_LOGIC.md`](../PLAN_LOGIC.md). This doc is the narrative rationale.

This is the pricing model for the hosted ManyChat MCP product.

It is intentionally simple:

- easy to explain on the landing page
- easy to enforce in the control plane
- aligned with the open-source self-host story

## Product goals behind pricing

The pricing model should:

1. keep adoption easy
2. preserve a strong free tier for discovery
3. fund continued open-source maintenance
4. give agencies and power users room to scale

## Recommended plans

### Free

Best for:

- testing the hosted product
- individual operators evaluating fit
- light personal usage

Recommended limits:

- 1 workspace
- 1 connected ManyChat account
- capped daily request allowance
- 1 concurrent remote client
- community support only

Recommended product framing:

> Enough to validate the product. Upgrade when you need more daily usage,
> concurrency, or more than one account.

### Supporter — $20/month ($209/year)

Best for:

- solo operators
- OSS supporters
- heavy individual usage

Recommended limits:

- high request limits under fair-use
- up to 3 connected ManyChat accounts
- up to 3 concurrent MCP sessions
- OAuth connect
- priority support
- direct support for the open-source project

Recommended product framing:

> Pay once, use it seriously, and help sustain the OSS core.

### Pro — $79/month ($790/year)

Best for:

- agencies
- multi-brand operators
- teams with shared workspaces

Recommended limits:

- up to 5 workspaces
- up to 20 connected ManyChat accounts
- highest request and concurrency caps (up to 10 concurrent MCP sessions)
- team members and permissions
- full audit logs
- richer usage/billing visibility

Commercial positioning:

- self-serve, optimized for account count, concurrency, and team features
- the done-for-you **Revenue Operator** engagement (~$3,500) is a separate secondary CTA, **not** part of self-serve

## Metering model

The hosted product should meter:

- requests per day
- requests per month
- peak concurrent MCP sessions
- number of connected ManyChat accounts
- optional future team seats

## Billing philosophy

The open-source repo should remain fully usable for self-hosting.

That means the paid hosted offer sells:

- convenience
- governance
- concurrency
- account scaling
- dashboard UX

It should not make the OSS runtime unusable.

## What the landing page should say

Recommended simple narrative:

- **Free**: try it with limits
- **Supporter $20/mo ($209/yr)**: serious personal use + support open source
- **Pro $79/mo ($790/yr)**: more workspaces/accounts, more concurrency, team controls

This is short, clear, and easy to remember.
