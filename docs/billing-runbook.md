# Billing runbook — Stripe → Convex → workspace plan

How money becomes entitlement, what must be configured before anyone is charged,
and what to verify first. Plan contents live in [PLAN_LOGIC.md](./PLAN_LOGIC.md);
advertised copy lives in `apps/web/lib/site-data-shared.ts`. This document covers
the **wiring**, not the offer.

Last end-to-end validation: **2026-07-29**, Stripe TEST (`acct_1RHxW5COsXH9DRgP`)
against Convex dev `dusty-lobster-832`.

---

## 1. The path a payment takes

```
dashboard
  └─ convex/stripeActions.ts  createSubscriptionCheckout(workspaceId, tier, interval)
       ├─ getPriceId(tier, interval)          → reads STRIPE_*_PRICE_ID from Convex env
       ├─ stripe.getOrCreateCustomer(userId)  → links workspace.stripeCustomerId
       └─ createCheckoutSession(...)
            subscriptionMetadata: { workspaceId, clerkUserId, tier }
                                   └─────────────┬──────────────┘
                                                 │ Stripe copies this onto the
                                                 │ subscription (subscription_data.metadata)
                                                 ▼
Stripe ── customer.subscription.{created,updated,deleted} ──▶
  convex/http.ts  (webhook, signature-verified by @convex-dev/stripe)
    └─ convex/lib/subscriptionPlan.ts  planSyncFromSubscription(sub)
         └─ convex/billing.ts  setWorkspacePlanFromStripe → workspaces.plan
                                                              │
gateway request ──▶ /api/internal/mcp/authorize ──▶ Convex ───┘
                    (Next.js, apps/web)             hosted.authorizeGatewayRequest
                                                    reads workspaces.plan → planLimits
                                                    atomically increments usageDaily/Monthly
                                                    throws past the cap
```

**The load-bearing link is `subscriptionMetadata.workspaceId`.** If checkout does
not stamp it, every webhook is a silent no-op and nobody's plan ever changes.
Subscriptions created outside our checkout (Stripe dashboard, imports) carry no
`workspaceId` and are deliberately ignored — the handler never guesses a tenant.

---

## 2. Environment variables

### Convex deployment (production)

| Variable | Value | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_…` | Test/live is decided purely by which key is set. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | From the **Stripe dashboard endpoint**, not from `stripe listen`. |
| `STRIPE_SUPPORTER_MONTHLY_PRICE_ID` | `price_…` | $20/mo |
| `STRIPE_SUPPORTER_ANNUAL_PRICE_ID` | `price_…` | $209/yr |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | `price_…` | $79/mo |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | `price_…` | $790/yr |
| `PUBLIC_APP_URL` | `https://…` | Builds checkout success/cancel URLs. A wrong value strands paying users. |
| `CLERK_JWT_ISSUER_DOMAIN` | `https://…` | Checkout requires an authenticated identity. |
| `MCP_INTERNAL_SHARED_SECRET` | long random | **Must equal the Vercel value byte-for-byte.** |

All four price env vars are required. `getPriceId` throws a named error when one
is missing, so a missing Supporter price breaks only the Supporter button — it
fails loudly rather than charging the wrong amount.

### Vercel (apps/web)

| Variable | Notes |
|---|---|
| `MCP_INTERNAL_SHARED_SECRET` | Same value as Convex. Mismatch ⇒ every authorize call 401s. |
| `NEXT_PUBLIC_CONVEX_URL` | `.convex.cloud`; the code derives the `.site` host for control-plane calls and **fails closed** on any other host. |

### Gateway (EasyPanel/VPS)

| Variable | Notes |
|---|---|
| `HOSTED_CONTROL_PLANE_URL` | Origin of the Next.js app. |
| `HOSTED_CONTROL_PLANE_SECRET` | Same shared secret again. |

The secret therefore lives in **three** places and all three must match.

---

## 3. Configuration order

Do it in this order; each step depends on the previous one.

1. **Stripe products + prices** (one product per tier, monthly + annual price each).
   Confirm currency and amount against PLAN_LOGIC.md before anything else.
2. **Convex env**: `STRIPE_SECRET_KEY`, the four price IDs, `PUBLIC_APP_URL`.
3. **Deploy Convex** (`npm run convex:deploy`) so `convex/http.ts` registers the
   webhook route. The endpoint must exist before you register it in Stripe.
4. **Stripe webhook endpoint** → `https://<deployment>.convex.site/stripe/webhook`,
   subscribed to `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copy its signing secret into Convex as
   `STRIPE_WEBHOOK_SECRET`.
   Note the host is `.convex.site` (HTTP actions), **not** `.convex.cloud` and
   not the Vercel domain.
5. **Shared secret** into Convex, Vercel and the gateway — the same value.
6. **Verify** with §4 before announcing pricing.

---

## 4. Pre-charge verification checklist

Run all of it. Each line is a way real money goes wrong.

- [ ] `stripe prices list` amounts and currencies match PLAN_LOGIC.md, and each
      price ID matches the Convex env var pointing at it. A swapped monthly and
      annual ID charges $20 for a year of access.
- [ ] All four price IDs are set in the **production** Convex deployment.
- [ ] `PUBLIC_APP_URL` is the production origin.
- [ ] The Stripe webhook endpoint shows recent **200s**, not 400s. A 400 storm
      means `STRIPE_WEBHOOK_SECRET` is wrong and *nobody's plan is updating*
      while cards are being charged. This is the single most expensive failure.
- [ ] A forged POST to `/stripe/webhook` with a junk `stripe-signature` returns
      **400** and changes no data.
- [ ] Real checkout in test mode flips `workspaces.plan` free → supporter → pro.
- [ ] Cancelling flips it back to `free`.
- [ ] `MCP_INTERNAL_SHARED_SECRET` is identical in Convex, Vercel and gateway —
      compare hashes, not prefixes.
- [ ] A free workspace is refused at request 251 of the day (§6).

---

## 5. Rehearsing the whole thing in test mode

```bash
# 1. Forward Stripe test events to the Convex dev webhook
stripe listen --forward-to https://<dev-deployment>.convex.site/stripe/webhook

# 2. Put the printed whsec_… into the DEV Convex deployment (never production)
npx convex env set STRIPE_WEBHOOK_SECRET whsec_...

# 3. Drive the lifecycle against a real workspace id
stripe customers create --email=probe@example.test
stripe payment_methods attach pm_card_visa --customer=cus_...
stripe customers update cus_... -d "invoice_settings[default_payment_method]=pm_..."

stripe subscriptions create --customer=cus_... \
  -d "items[0][price]=$STRIPE_SUPPORTER_MONTHLY_PRICE_ID" \
  -d "metadata[workspaceId]=<convex workspace id>" \
  -d "metadata[tier]=supporter"

# upgrade / downgrade
stripe subscriptions update sub_... -d "items[0][id]=si_..." \
  -d "items[0][price]=$STRIPE_PRO_MONTHLY_PRICE_ID" -d "metadata[tier]=pro"

# cancel
stripe subscriptions cancel sub_... --confirm
```

After each step, read the plan back:

```bash
npx convex data workspaces
```

**Renewal failure** needs a test clock, because dunning only happens on a future
billing date:

```bash
stripe test_helpers test_clocks create --frozen-time $(date +%s)
# customer created with -d "test_clock=clock_..." and pm_card_chargeCustomerFail
# subscription with -d "trial_period_days=2"
stripe test_helpers test_clocks advance clock_... --frozen-time <after trial end>
# then advance again past invoice.next_payment_attempt (~1h later) to reach past_due
```

Restore the dev `STRIPE_WEBHOOK_SECRET` when you are done, or the next person's
`stripe listen` session silently fails signature verification.

> Never point `stripe listen` at a production deployment, and never set a
> `stripe listen` secret on production Convex — it replaces the real endpoint
> secret and every genuine Stripe delivery starts failing.

---

## 6. Entitlement enforcement

`hosted.authorizeGatewayRequest` is the enforcement point, called **once per MCP
request** by the gateway. It reads the workspace plan, reads today's counters,
and throws before writing if the next request would exceed `dailyRequests` or
`monthlyRequests`.

It is a Convex mutation, so read-check-increment happens inside a single
serializable transaction. That is what makes the limit correct with **any number
of gateway replicas** — the counter lives in the database, not in process memory.
The predecessor design counted sessions in a per-instance `Map`, which handed a
tenant N× its limit across N replicas.

Because the throw aborts the transaction, a rejected request leaves the counter
untouched and writes no audit event.

Verify at the boundary rather than by hammering:

```bash
# seed usageDaily.requestCount to limit-1 for today's dateKey, then:
npx convex run hosted:authorizeGatewayRequest '{"workspaceId":"…","tokenId":"…"}'
# → ok at the limit, throws "Daily request limit reached" one past it
```

### Plan limits

`convex/lib/planLimits.ts` holds one row per tier and is the only copy the
control plane reads (`hosted.ts` for the account/token caps and the gateway
authorizer, `dashboard.ts` for the usage panel). It is a
`Record<WorkspacePlan, PlanLimits>`, so a plan added to the schema without its
own row fails to compile — there is no normalization step that can fold one tier
into another.

| | free | supporter | pro |
|---|---|---|---|
| `maxAccounts` | 1 | 3 | 20 |
| `dailyRequests` | 250 | 5,000 | 100,000 |
| `monthlyRequests` | 3,000 | 100,000 | 1,000,000 |
| `maxTokens` | 2 | 10 | 50 |

`src/hosted/plans.ts` mirrors these for the gateway package, field for field.
The resolve payload is cast rather than parsed, so a key the gateway declares
but the control plane never sends reads as `undefined` behind a `number` type —
add a ceiling there only once the control plane sends and enforces it.

The landing copy in `apps/web/lib/site-data-shared.ts` must state exactly these
numbers — `apps/web/lib/pricing-copy.test.ts` fails the build if it drifts.

`maxConcurrentSessions` was removed in the same change: the stateless MCP
migration deleted protocol sessions, so the field was advertised but unread.
Request ceilings are the only rate control.

`maxWorkspaces` was removed for the same reason. `users.ensureCurrentUser` is
the only `insert("workspaces", …)` in the codebase and it runs only when the
owner has none, so every account holds exactly one workspace on every tier.
There is no second-workspace path to cap, and the landing no longer sells one.
Reintroducing a workspace ceiling means shipping workspace creation first.

---

## 7. Behaviour reference

| Stripe subscription status | workspace plan |
|---|---|
| `active` | tier from price id |
| `trialing` | tier from price id |
| `past_due` | `free` |
| `unpaid` | `free` |
| `incomplete` | `free` |
| `incomplete_expired` | `free` |
| `canceled` | `free` |
| `paused` | `free` |
| deleted event | `free` |

Tier resolution prefers the **price id**; `metadata.tier` is only a fallback for
an unmapped price, and an unresolvable subscription defaults to `supporter` so a
misconfiguration never grants Pro. Covered by
`apps/web/convex/lib/subscriptionPlan.test.ts` and `stripeTiers.test.ts`, both of
which run with no Stripe credentials.
