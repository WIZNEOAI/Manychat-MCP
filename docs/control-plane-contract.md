# Control plane contract

The gateway in this repository can run in three auth modes (`MCP_REMOTE_AUTH`).
Two of them — `manychat_header` and `oauth` — are self-contained. The third,
`hosted_token`, delegates identity, credential storage, and quota to a separate
**control plane** over HTTP.

That control plane is a different codebase with its own release cadence. This
document is the contract between them. It exists so either side can ship without
reading the other's source.

Implementation: [`src/hosted/control-plane-client.ts`](../src/hosted/control-plane-client.ts).
Schemas: [`src/hosted/types.ts`](../src/hosted/types.ts).

## Who is responsible for what

| Concern | Owner |
| --- | --- |
| Issuing and revoking MCP tokens | Control plane |
| Storing ManyChat API keys (encrypted) | Control plane |
| Enforcing plan ceilings (daily / monthly requests) | **Control plane only** |
| Usage and audit persistence | Control plane |
| Speaking MCP, running tools, ManyChat API calls | Gateway |
| Capability enforcement per request | Gateway, from `capabilityBundle` |

The gateway holds **no** plan table. It cannot decide a request is over quota,
and must not try: the control plane answers `429` before the gateway ever sees a
session. A `limits` object travels on the resolve response for observability,
never as an authority.

## Configuration

| Variable | Meaning |
| --- | --- |
| `MCP_REMOTE_AUTH=hosted_token` | Enables this mode |
| `HOSTED_CONTROL_PLANE_URL` | Base URL, no trailing slash |
| `HOSTED_CONTROL_PLANE_SECRET` | Shared secret, sent on every call |

Every request carries `x-manychat-internal-secret: <shared secret>`. These
endpoints are server-to-server and must never be reachable from a browser.

## `POST /api/internal/mcp/resolve`

Exchanges an end user's MCP token for a usable session.

Request:

```json
{ "token": "mcp_live_<12 hex>_<48 hex>" }
```

Response `200`:

```json
{
  "workspaceId": "…",
  "tokenId": "…",
  "accountId": "…",
  "apiKey": "…",
  "capabilityBundle": "read_only | operator | messaging_safe | admin",

  "workspaceName": "…",
  "accountName": "…",
  "plan": "free | supporter | pro",
  "limits": {
    "maxAccounts": 0,
    "dailyRequests": 0,
    "monthlyRequests": 0,
    "maxTokens": 0
  }
}
```

The first block is **required** — it is exactly what gateway code reads. The
second block is **optional**: the control plane sends it today, no gateway code
consumes it, and the schema says so rather than promising a value nobody checked
for. `accountId` may be `null` or absent; both mean "the workspace's default
account".

`apiKey` is a decrypted ManyChat credential. It must never be logged, echoed in
an error, or returned to an MCP client.

The gateway **parses** this response. A `200` that no longer honours the required
shape raises a `502` naming the offending field, rather than passing `undefined`
into code whose type promises a string. Unknown fields are stripped, so the
control plane can add keys without a coordinated gateway release; renaming or
removing a required key is a breaking change.

Non-`200`: `{ "error": "<human-readable>" }`. `401` invalid or revoked token,
`429` quota exhausted, `400` malformed. The gateway surfaces the message to the
MCP client, so it must be safe to show a customer.

## `POST /api/internal/mcp/authorize`

Called per request to charge the request against quota before doing work.

```json
{ "workspaceId": "…", "tokenId": "…", "accountId": "… | null", "requestId": "8 chars" }
```

`requestId` is additive (a control plane that ignores it keeps working). It is the same id
the gateway logs, returns as `x-request-id`, sends on `record`, and that the send tools echo
in `_meta.requestId` — store it on the usage row so an audit can be joined end to end.

`200` → `{ "ok": true, "usage": { … } }`. The gateway ignores the body and treats
any `2xx` as permission granted.

`429` → over quota. `401` → revoked. Both abort the request.

> **Known fragility.** The current control plane derives these status codes by
> substring-matching its own internal error text (`"limit reached"` → `429`,
> `"revoked"` → `401`). Across a repo boundary that makes prose an API. A control
> plane implementation should return typed codes; if you change that wording,
> change the mapping in the same commit.

## `POST /api/internal/mcp/record`

Fire-and-forget telemetry. Failures are logged and swallowed — telemetry must
never break a customer's request.

```json
{
  "workspaceId": "…",
  "tokenId": "…",
  "type": "session_start | session_end | request | auth_failure",
  "requestCount": 1,
  "metadata": {}
}
```

The gateway also sends `accountId`; the reference control plane strips it. Treat
it as informational, not persisted.

## Changing this contract

Both halves ship independently, so the safe order is:

1. **Adding** an optional field: control plane first, gateway whenever.
2. **Requiring** a new field: gateway reads it as optional first, control plane
   starts sending it, gateway tightens the schema last.
3. **Removing or renaming** a required field: gateway stops reading it and
   relaxes the schema first, control plane drops it second.

Never step 3 in the other order. The gateway will answer `502` to every hosted
request until it is redeployed.
