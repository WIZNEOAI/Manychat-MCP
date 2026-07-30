# Security policy

## Supported versions

Security fixes are applied to the default branch (`main`) and released as tagged versions when appropriate. Use the latest commit or release for production.

## Reporting a vulnerability

**Please do not** open a public GitHub issue for an undisclosed security bug.

Two ways, both private:

1. **[GitHub private vulnerability reporting](https://github.com/WIZNEOAI/Manychat-MCP/security/advisories/new)**
   — the Security tab of this repository. Preferred: it threads the whole exchange, tracks a
   fix, and can issue a CVE.
2. **contacto@wizneo.org** — if you would rather not use GitHub, or the report does not fit
   an advisory. Put `SECURITY` in the subject.

Either reaches the maintainers directly.

Include:

- Description of the issue and its impact
- Steps to reproduce, if you have them
- Affected surface (CLI, MCP stdio, MCP HTTP gateway, hosted-token mode)

We aim to acknowledge within a few business days.

A **policy wedge bypass counts as a security issue**: if you find a way to make
`validate_message` approve a send that Meta's messaging window would reject, report it
privately rather than opening an issue.

## Sensitive data

Never paste real **ManyChat API keys**, **hosted MCP tokens**, **VAULT_MASTER_KEY**, or **MCP_INTERNAL_SHARED_SECRET** / **HOSTED_CONTROL_PLANE_SECRET** into issues or public chats.

A ManyChat API key grants full access to the page it belongs to. This software reads it from
the environment or `~/.manychat/config.json` and sends it nowhere except ManyChat's own API —
`src/lib/logger.ts` redacts it from logs. If a key is exposed, rotate it in ManyChat
immediately: generating a new key invalidates the old one.

## Scope notes

- Hosted mode relies on a shared secret between the MCP gateway and the control plane; protect both sides equally.
- Rate limiting on dashboard API routes is best-effort per server instance; high-risk deployments should add edge or Redis-backed limits.
