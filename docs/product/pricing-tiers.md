# Pricing and plan model

This is the recommended initial pricing model for the hosted ManyChat MCP product.

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

### Supporter — $20/month

Best for:

- solo operators
- OSS supporters
- heavy individual usage

Recommended limits:

- unlimited individual usage under fair-use
- up to 3 connected ManyChat accounts
- up to 3 concurrent remote clients
- priority support
- direct support for the open-source project

Recommended product framing:

> Pay once, use it seriously, and help sustain the OSS core.

### Pro

Best for:

- agencies
- multi-brand operators
- teams with shared workspaces

Recommended limits:

- more connected ManyChat accounts
- higher concurrency caps
- team members and permissions
- audit logs
- richer usage/billing visibility

Suggested commercial positioning:

- more expensive than Supporter
- optimized for account count, concurrency, and team features
- can start as invite-only or manual sales before being fully productized

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
- **Supporter $20/mo**: unlimited personal use + support open source
- **Pro**: more accounts, more concurrency, team controls

This is short, clear, and easy to remember.
