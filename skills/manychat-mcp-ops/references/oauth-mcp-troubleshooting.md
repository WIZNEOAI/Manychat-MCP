# OAuth and MCP troubleshooting

## Symptom: `No valid session. Send an initialize request first.`

- Cause: client attempted non-initialize MCP call without active session id.
- Action:
  1. send initialize request to `POST /mcp`
  2. persist returned `mcp-session-id`
  3. include same header in subsequent calls

## Symptom: `invalid_grant` in `/token`

- Cause options:
  - authorization code already consumed
  - code expired
  - `client_id`, `redirect_uri`, or PKCE mismatch
- Action:
  1. restart `/authorize` flow
  2. verify exact redirect URI match
  3. verify code verifier/challenge pair

## Symptom: bearer token accepted but tools fail

- Cause: token mapped to invalid or revoked ManyChat API key.
- Action:
  1. rerun OAuth authorize using a valid ManyChat key
  2. run `health_check` tool after token exchange

## Symptom: works locally, fails in production

- Verify:
  - `NODE_ENV=production`
  - `OAUTH_STORE=redis`
  - `REDIS_URL` configured and reachable
  - `BASE_URL` public HTTPS URL
  - well-known endpoints reachable from external client
