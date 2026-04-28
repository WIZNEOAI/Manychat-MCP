# Production beta checklist

End state: dashboard on Vercel, Convex backend, Clerk auth, Stripe billing, MCP gateway on Railway or VPS in `hosted_token` mode.

## 1. Convex

1. Create a Convex project and note the deployment URL.
2. Set `CLERK_JWT_ISSUER_DOMAIN` to your Clerk JWT template issuer (Convex + Clerk docs).
3. Deploy functions: `npm run convex:deploy` from repo root (or CI).
4. Set Stripe variables if using billing:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET` (endpoint: Convex Stripe component webhook URL)
   - `STRIPE_PRO_MONTHLY_PRICE_ID`
   - `STRIPE_PRO_ANNUAL_PRICE_ID`
   - `PUBLIC_APP_URL` (your Vercel origin for Checkout redirects)

## 2. Clerk

1. Create application; add Next.js integration.
2. Create JWT template named `convex` per Convex docs.
3. Copy publishable + secret keys into Vercel env for the web app.

## 3. Vercel (web)

Environment variables (Production):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser key |
| `CLERK_SECRET_KEY` | Clerk server |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `MCP_INTERNAL_SHARED_SECRET` | Shared with MCP gateway (`HOSTED_CONTROL_PLANE_SECRET`) |
| `VAULT_MASTER_KEY` | Encrypts ManyChat API keys at rest |
| `VAULT_KEY_VERSION` | Optional tag (default `v1`) |
| `NEXT_PUBLIC_MCP_HTTP_URL` | Public `POST /mcp` URL for snippets |

Deploy the `apps/web` Next.js app (root can be `apps/web` in Vercel project settings).

## 4. MCP gateway (Railway or VPS)

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `3000` (or platform default) |
| `MCP_REMOTE_AUTH` | `hosted_token` |
| `MCP_BASE_URL` | Public HTTPS base of this gateway |
| `HOSTED_CONTROL_PLANE_URL` | Vercel app origin (same as dashboard) |
| `HOSTED_CONTROL_PLANE_SECRET` | **Same value** as `MCP_INTERNAL_SHARED_SECRET` |

Do **not** set `MANYCHAT_API_KEY` on the gateway for hosted multi-tenant mode.

## 5. Smoke tests

1. `curl -sS https://<gateway>/health` → JSON `status: ok`.
2. Dashboard: save ManyChat key (must pass live validation), issue MCP token, copy snippet.
3. From a machine with `curl`, send MCP `initialize` JSON-RPC to `POST https://<gateway>/mcp` with `Authorization: Bearer <issued_token>` (see [mcp-clients.md](../connect/mcp-clients.md)).
4. In dashboard, confirm usage counters and audit events (`gateway.request`, etc.).

## 6. Security notes

- Rotate `MCP_INTERNAL_SHARED_SECRET` / `HOSTED_CONTROL_PLANE_SECRET` together if leaked.
- `VAULT_MASTER_KEY` loss means stored keys cannot be decrypted; backup key management accordingly.

See also: [vercel-convex-clerk-stripe.md](./vercel-convex-clerk-stripe.md), [mcp-gateway-railway.md](./mcp-gateway-railway.md), [mcp-gateway-vps.md](./mcp-gateway-vps.md).
