# Security policy

## Supported versions

Security fixes are applied to the default branch (`main`) and released as tagged versions when appropriate. Use the latest commit or release for production.

## Reporting a vulnerability

**Please do not** open a public GitHub issue for undisclosed security bugs.

Instead, email maintainers with:

- Description of the issue and impact
- Steps to reproduce (if possible)
- Affected surface (CLI, MCP HTTP, dashboard, Convex, etc.)

We aim to acknowledge reports within a few business days.

## Sensitive data

Never paste real **ManyChat API keys**, **hosted MCP tokens**, **VAULT_MASTER_KEY**, or **MCP_INTERNAL_SHARED_SECRET** / **HOSTED_CONTROL_PLANE_SECRET** into issues or public chats.

## Scope notes

- Hosted mode relies on a shared secret between the MCP gateway and the control plane; protect both sides equally.
- Rate limiting on dashboard API routes is best-effort per server instance; high-risk deployments should add edge or Redis-backed limits.
