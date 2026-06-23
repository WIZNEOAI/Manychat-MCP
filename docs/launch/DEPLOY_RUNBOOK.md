# Deploy runbook — production (`revenueoperator.wizneo.org`)

> **Prep doc — nothing here is executed yet.** Every step marked **[GATE]** needs Ulises' explicit OK
> (deploy, DNS, Stripe LIVE, secrets). Builds on the per-component docs in [`docs/deploy/`](../deploy/);
> this is the sequenced, value-filled runbook for *this* production target.

## Topology

```
Agent client ──Bearer mcp_live_…──▶  Gateway (EasyPanel/VPS)         mcp.wizneo.org
                                       │  hosted_token mode
                                       ▼  x-manychat-internal-secret
                                     Next.js app (Vercel, apps/web)   revenueoperator.wizneo.org
                                       │  x-control-plane-secret
                                       ▼
                                     Convex prod (.cloud / .site)     <prod>.convex.cloud
                                       │  @convex-dev/stripe webhook
                                       ▼
                                     Stripe LIVE  ·  Clerk prod
```

- **App** (landing/docs/dashboard) → Vercel, root dir `apps/web`, domain `revenueoperator.wizneo.org`.
- **Gateway** (multi-tenant MCP resolver) → EasyPanel/VPS container, domain `mcp.wizneo.org`. **Railway retired.**
- **Backend** → new **Convex prod** deployment. Stripe **LIVE**, Clerk **prod** instance.

## Decisions (resolved — see [`PRODUCT_ARCHITECTURE.md`](./PRODUCT_ARCHITECTURE.md))

1. **Domains:** landing/app = `revenueoperator.wizneo.org`, gateway/MCP endpoint = `mcp.wizneo.org`. ✅
2. **Brand:** keep **Operator Terminal** (charcoal/cyan); switch to WIZNEO Matrix only on Ulises' call. ✅
3. **Brand/legal:** product = **Revenue Operator** (ours); "ManyChat" used descriptively only. ✅

Still open: artifact for npm/official-registry later (milestone D) — re-publish `manychat` to npm, or remote-only.

## ⚠️ Footgun: one shared secret, three names

The gateway↔app↔Convex internal hops use **the same secret value** under **different env names**. They MUST match or every hosted MCP call 401s:

| Component | Env var | Value |
|---|---|---|
| Gateway (EasyPanel) | `HOSTED_CONTROL_PLANE_SECRET` | **S** |
| Vercel app | `MCP_INTERNAL_SHARED_SECRET` | **S** (same) |
| Convex prod | `MCP_INTERNAL_SHARED_SECRET` | **S** (same) |

(Convex `http.ts` accepts `MCP_INTERNAL_SHARED_SECRET ?? HOSTED_CONTROL_PLANE_SECRET`; the app's `/api/internal/mcp/*` checks `x-manychat-internal-secret = MCP_INTERNAL_SHARED_SECRET`.) Generate **S** once (`openssl rand -hex 32`) and paste it into all three.

## Secrets to generate + back up (store only in `/root/.hermes/.env`)

- `S` = `MCP_INTERNAL_SHARED_SECRET` / `HOSTED_CONTROL_PLANE_SECRET` — `openssl rand -hex 32`
- `VAULT_MASTER_KEY` — `openssl rand -hex 32`. **Back up obligatorio**: losing it makes every stored ManyChat key undecryptable.
- Stripe LIVE: `STRIPE_SECRET_KEY` (sk_live), `STRIPE_WEBHOOK_SECRET` (whsec_ from the live webhook) — **Ulises provides** (live Stripe is gated; configured via the Stripe MCP/dashboard, not the CLI).

---

## Sequenced steps

### Step 1 — Convex prod **[GATE]**
1. `npx convex deploy` from repo root (creates/links the prod deployment; **NOT** `convex dev`).
2. Set prod env (Convex dashboard → prod → Environment Variables):
   - `CLERK_JWT_ISSUER_DOMAIN` = Clerk **prod** issuer host (Step 2).
   - `MCP_INTERNAL_SHARED_SECRET` = **S**.
   - `VAULT_MASTER_KEY`.
   - `PUBLIC_APP_URL` = `https://revenueoperator.wizneo.org`.
   - **Stripe LIVE**: `STRIPE_SECRET_KEY` (sk_live), `STRIPE_WEBHOOK_SECRET` (whsec live), and the **4 LIVE price IDs**:
     `STRIPE_SUPPORTER_MONTHLY_PRICE_ID`, `STRIPE_SUPPORTER_ANNUAL_PRICE_ID`, `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID`.
     ⚠️ These are the **live** prices, NOT the sandbox `price_1Tko…` ones used in dev. (See the dev-side bug we already fixed — same class of mistake, mirror it correctly for live.)
3. Note the prod URLs: `https://<prod>.convex.cloud` and `.site` (webhooks + internal endpoints live on `.site`).

### Step 2 — Clerk prod instance **[GATE]**
1. Create/confirm the **production** Clerk instance.
2. JWT template named **`convex`** → copy issuer domain into Convex `CLERK_JWT_ISSUER_DOMAIN`.
3. Allowed origins/redirects: `https://revenueoperator.wizneo.org` (+ localhost for dev).
4. Get `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (pk_live) + `CLERK_SECRET_KEY` (sk_live) for Vercel.

### Step 3 — Stripe LIVE **[GATE — Ulises]**
1. Create **live** products + prices (Supporter $20/$209, Pro $79/$790) — or confirm they exist. Capture the 4 live price IDs → Step 1.
2. Live webhook → endpoint = the **Convex `.site`** webhook URL from `@convex-dev/stripe` (`https://<prod>.convex.site/stripe/webhook`), NOT Vercel. Capture `whsec_` → Convex `STRIPE_WEBHOOK_SECRET`.
3. Events: `customer.subscription.created|updated|deleted` (matches `http.ts`).
4. **Verify (Step 7)** with a real card / Ulises before announcing — live = real charges, no test cards.

### Step 4 — Vercel app **[GATE]**
1. Project → root dir `apps/web`, framework Next.js.
2. Env (from `apps/web/.env.example`):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (live).
   - `NEXT_PUBLIC_CONVEX_URL` = `https://<prod>.convex.cloud`.
   - `MCP_INTERNAL_SHARED_SECRET` = **S**.
   - `VAULT_MASTER_KEY`.
   - `NEXT_PUBLIC_MCP_HTTP_URL` = `https://mcp.wizneo.org/mcp` ← **don't forget this** (dashboard copy-snippets fall back to `mcp.example.com` if unset — this exact gap bit a prior deploy).
3. Add domain `revenueoperator.wizneo.org`. Deploy. Confirm `● Ready` in Vercel before calling it done.

### Step 5 — DNS Hostinger (wizneo.org) **[GATE]**
Draft records (apply via `/hostinger-dns` skill or the Hostinger API token in `/root/.hermes/.env`, never printing it):

| Type | Name | Value | Purpose |
|---|---|---|---|
| CNAME | `manychat` | `cname.vercel-dns.com` | app → Vercel (use the exact target Vercel shows) |
| A / CNAME | `mcp.manychat` | gateway host IP / EasyPanel target | gateway → EasyPanel |

Confirm exact Vercel target in the dashboard; EasyPanel issues SSL via Traefik for the gateway subdomain.

### Step 6 — Gateway on EasyPanel **[GATE]**
Build from the repo `Dockerfile` (pnpm, Node 22, exposes :3000, `CMD node dist/mcp/http-entry.js`). Service env:
```
NODE_ENV=production
MCP_REMOTE_AUTH=hosted_token
MCP_BASE_URL=https://mcp.wizneo.org
HOSTED_CONTROL_PLANE_URL=https://revenueoperator.wizneo.org
HOSTED_CONTROL_PLANE_SECRET=<S>          # same value as app/convex MCP_INTERNAL_SHARED_SECRET
PORT=3000
```
- EasyPanel: Traefik + SSL auto, single replica (MCP HTTP sessions are stateful).
- Forward `POST/GET/DELETE /mcp` + `GET /health`; do not cache `/mcp`.

### Step 7 — Verify **[GATE-free once deployed]**
1. `curl -fsS https://mcp.wizneo.org/health` → 200.
2. MCP handshake against prod gateway (hosted token): `initialize` + `tools/list` → 28 tools.
3. App: `/`, `/docs`, `/sign-in`, `/dashboard` load; dashboard snippet shows `mcp.wizneo.org` (not example.com).
4. Billing live: one real subscription (Ulises / real card) → confirm `workspace.plan` flips → refund. (We already proved the webhook path E2E in sandbox.)
5. `gstack` smoke on the public app.

## Rollback

- App: Vercel → promote previous deployment.
- Gateway: EasyPanel → redeploy previous image / scale to previous.
- Convex: prod env is additive; a bad value is reverted by re-setting it. Schema is unchanged by this deploy.

## Gate summary (needs Ulises)

Convex prod deploy · Clerk prod · **Stripe LIVE (keys, products, webhook)** · Vercel deploy · **DNS** · gateway deploy. Everything else here is prep. After deploy, milestone D's Smithery + official-registry submissions unblock (need the live gateway URL).
