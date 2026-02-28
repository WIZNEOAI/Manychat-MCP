# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue.
2. Email security@gnosix.com with details.
3. We will acknowledge within 48 hours and work on a fix.

## API Key Handling

- API keys are never logged (redacted in structured logs).
- In OAuth mode, keys are stored in-memory only (lost on restart).
- Keys are transmitted over HTTPS in production.
- The `/authorize` page uses POST to prevent keys from appearing in URLs or server logs.

## Recommended Deployment

- Always use HTTPS in production (Railway provides this by default).
- Set `NODE_ENV=production`.
- Use the OAuth flow for multi-user deployments instead of a shared API key.
- Regularly rotate your ManyChat API keys.
