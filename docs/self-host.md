# Self-host your own remote (Docker / HTTP)

**Deployment status: unverified.** The repository's Docker, Render and OAuth-with-real-Redis deployments have not been validated in a real environment. These are configuration instructions, not evidence of a working production deployment. Validate your own infrastructure before use. No public WIZNEO gateway or hosted signup is offered; nobody needs a WIZNEO account.

Published `mcp-manychat@0.2.0` supports reads/CRM inspection. Sends, flow dispatch and guarded writes fail closed because no trusted interaction-channel evidence provider is shipped. Moving to HTTP or enabling OAuth does not unlock them. License remains AGPL-3.0-or-later; preserve attribution and satisfy corresponding-source requirements for modified network versions.

## Prefer local stdio when possible

Follow [connect.md](connect.md). The user sets `MANYCHAT_API_KEY` in their own launch environment/OS secret store **outside agent chat**. The MCP child inherits it or uses the client's documented variable reference. Never put a key in config literals or CLI arguments. No server, TLS, Redis or remote credential transmission is needed for local stdio.

## Remote architecture you operate

```text
Your MCP client + its secret/credential store
  -> HTTPS ingress you control
  -> private HTTP runtime, /mcp, manychat_header mode
  -> ManyChat API
  -> private Redis for shared rate limits
```

The user enters their own ManyChat key directly into the client's credential UI/secret integration, never into an agent chat. The client sends `X-ManyChat-API-Key` on **every** `/mcp` request over HTTPS. The HTTP server does not inherit/fall back to `MANYCHAT_API_KEY`; do not place an account key in the server image or environment as a substitute. Protect the entire chain: request-header redaction, no credential-bearing access/debug logs, restricted operator access and secure secret storage.

## Docker example — not executed/verified

Prerequisites: Docker on your own host, an existing private Redis endpoint with appropriate TLS/ACLs, a domain/TLS ingress you control, and an approved source revision. The following commands are for the infrastructure owner, **not instructions for an agent to deploy without approval**.

```sh
git clone https://github.com/WIZNEOAI/manychat-mcp.git
cd manychat-mcp
git checkout v0.2.0
docker build -t manychat-mcp:0.2.0 .
```

Have your server secret-manager launcher prepare `REDIS_URL` and configuration `TRUST_PROXY_CIDRS` in the command's environment. Do not paste credential-bearing Redis URLs into chat, shell commands/history or tracked env files. `TRUST_PROXY_CIDRS` must identify the **actual source address of your trusted ingress as seen inside the container**, not a guessed public address, loopback or a broad network. The Docker bridge can change that source address.

An illustrative host-proxy layout binds only to host loopback; the runtime still listens inside the container:

```sh
docker run -d --name manychat-mcp --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  --env NODE_ENV=production \
  --env MCP_REMOTE_AUTH=manychat_header \
  --env REDIS_URL \
  --env TRUST_PROXY_CIDRS \
  --env MCP_ALLOWED_ORIGINS \
  manychat-mcp:0.2.0
```

The name-only `--env` flags inherit variables without putting their **values** in argv. They are not a claim that Docker environment storage is a secret vault: restrict daemon/inspect access and inject server secrets through your approved deployment tooling. Do not print `docker inspect` environment output. Do not deploy if required environment values are missing.

Use a user-controlled HTTPS reverse proxy forwarding to the loopback port. Configure the proxy to overwrite forwarded headers, redact sensitive headers and reject unexpected hosts; block direct/shorter paths to the runtime. Do not expose port 3000 publicly. If ingress runs in a different container, use a private network with no public runtime port and adapt the trusted source/proxy address; this example is not a universal topology.

### Required and optional configuration

| Setting | Requirement |
|---|---|
| `NODE_ENV=production` | Enables durable/shared-store and trusted-proxy requirements. Never use development mode to bypass production checks. |
| `REDIS_URL` | Required for shared rate limits in production; use private networking, TLS and scoped ACLs. Keep credentials in the server secret manager. |
| `TRUST_PROXY_CIDRS` **or** `TRUST_PROXY_HOPS` | Exactly one. Prefer explicit known proxy source CIDRs. Hop count 1–16 is safe only if every request traverses that exclusive proxy and direct/shorter paths are blocked. |
| `MCP_REMOTE_AUTH=manychat_header` | Default. Per-request `X-ManyChat-API-Key` is mandatory. No server key fallback. |
| `MCP_ALLOWED_ORIGINS` | Comma-separated exact permitted browser origins, if needed. No wildcard. With none configured, requests with an Origin are rejected; non-browser clients may omit Origin. |
| `PORT` / `HOST` | Defaults 3000 / 0.0.0.0 in the container. Restrict exposure at Docker/network/ingress boundaries. |
| `LOG_LEVEL` | `info` default; do not enable credential-bearing logs at the proxy or client. |

The Dockerfile includes a `/health` check. `/health` returns `{"status":"ok"}` and bypasses auth/rate limits: it is **liveness only**, not proof of source version, auth protection, Redis readiness or successful ManyChat access. Record the deployed Git SHA/image digest separately.

## Optional OAuth (separate mode; unverified)

`MCP_REMOTE_AUTH=oauth` is exclusive with header auth. Production additionally needs `OAUTH_STORE=redis`, `REDIS_URL`, an HTTPS `MCP_BASE_URL` on **your** domain, and `OAUTH_ENC_KEY` containing exactly 64 hexadecimal characters (32 random bytes). Generate/store the encryption key in your server secret manager, identical across instances; never paste it into client configs or chat. OAuth records use AES-256-GCM. Plan key rotation and durable backups before use; in-memory OAuth is development-only and loses state on restart. See [architecture.md](architecture.md) for registration limits and rotation constraints. Do not claim this path has been tested with real Redis.

## Validate your own deployment

1. Run the repository's lint/typecheck/test/build/mutation gate and full-history redacted secret scan for the exact source revision. Review image contents and dependencies. Record deployed SHA/digest.
2. Check HTTPS certificate/hostname, ingress forwarding and denial of direct runtime access.
3. Check `/health` for liveness. Send a valid JSON MCP initialize **without credentials** and require 401. A malformed-body 400 does not prove authentication.
4. Check origin rejection, request/body limits, shared Redis behavior and refusal when Redis is unavailable. Defaults: 120/IP/minute, 60/credential-hash/minute, body 32 KB, upstream 20 s. Do not load-test shared infrastructure without approval.
5. User configures their key directly in the remote client's credential store. With account-owner approval, run only `get_page_info`, with no credential/account-data logging. Never put a credential in a `curl -H` argument, config literal or chat to perform the test.
6. Confirm `CHANNEL_UNKNOWN`/fail-closed behavior without trusted channel evidence, and never use a real send/mutation as a setup test. A guard block does not automatically tag a lead or notify a human.
7. Validate backup/restore, restart, monitoring and credential revocation before relying on the service. A failed/untested step is a deployment blocker, not a reason to disable the guard.

Client versions differ; [n8n](clients/n8n.md) has a header-credential example. For Render or another platform, translate these requirements to your own ingress/private network/secret store. The bundled `render.yaml` is an unverified example, not a hosted endpoint or deployment recommendation.
