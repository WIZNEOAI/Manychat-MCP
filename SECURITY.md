# Security Policy

## Reporting a vulnerability

1. Do not open a public issue
2. Email `security@gnosix.com`
3. Expected acknowledgment: within 48 hours

## Authentication boundaries

This project separates:

- **ManyChat auth**: user-supplied ManyChat API key
- **MCP auth**: OAuth 2.0 bearer token used by MCP clients

OAuth bearer tokens are mapped to ManyChat API keys through the configured OAuth store.

## Key and token handling

- Secrets and tokens are redacted in structured logs
- OAuth bearer tokens are stored in configured backend:
  - `memory` for development only
  - `redis` for production
- Production mode (`NODE_ENV=production`) requires Redis-backed OAuth store
- Authorization codes are one-time use and short-lived
- Access and refresh tokens are TTL-bound and revocable

## Transport and deployment requirements

- Use HTTPS in production
- Restrict access to Redis using network and credential controls
- Rotate ManyChat API keys periodically
- Do not use shared global ManyChat keys for multi-user SaaS scenarios

## Operational checks

- Verify `/.well-known/oauth-protected-resource`
- Verify `/.well-known/oauth-authorization-server`
- Verify `/health`
- Run OAuth flow smoke tests after deploy and after rollback
