# PLAN_LOGIC — ManyChat MCP / Revenue Operator

> Source of truth for plan contents is the code: `apps/web/lib/site-data-shared.ts` → `pricingTiers`.
> This doc maps each plan to its limits **and to our unit economics** (what each plan costs *us*).
> Figures below are estimates as of 2026-06-21 (USD). Update when provider pricing or limits change.

## 1. What each plan includes

| | Free | Supporter | Pro |
|---|---|---|---|
| **Price** | $0 | $20/mo · $209/yr | $79/mo · $790/yr |
| **Annual savings** | — | Save $31/yr | Save $158/yr |
| Workspaces | 1 | 1 | up to 5 |
| Connected ManyChat accounts | 1 | up to 3 | up to 20 |
| Request limits | 250/day · 3,000/mo | 5,000/day · 100,000/mo | 100,000/day · 1,000,000/mo |
| Active MCP tokens | 2 | 10 | 50 |
| OAuth connect | — | ✓ | ✓ |
| Team seats / full audit | — | — | ✓ |
| Best for | evaluation / personal | builders running agents daily | agencies / multi-brand |

The OSS runtime (CLI + MCP, self-hosted) is **always free and unlimited** — these tiers price the **hosted** control plane (vault, hosted tokens, usage/audit, billing).

## 2. What it costs us (per provider)

The customer **brings their own ManyChat API key**, so ManyChat is **never a cost to us**. Our costs are the hosting stack:

| Provider | Role | Cost model | Marginal cost per paying customer |
|---|---|---|---|
| **ManyChat** | execution (user's own key) | — | **$0** |
| **Convex** | backend: workspaces, vault, tokens, usage, leads | Free tier ~1M calls/mo; Pro $25/mo then usage | cents (a few k function calls + tiny storage) |
| **Clerk** | dashboard auth | Free ≤ 10,000 MAU; then ~$25/mo + per-MAU | ~$0 until 10k users |
| **Vercel** | Next.js app (landing/docs/dashboard) | Hobby free / Pro $20/mo | ~$0 (shared) |
| **Gateway** | MCP HTTP resolver | EasyPanel on existing VPS (~$12/mo Hostinger, shared) | ~$0 (single replica, multi-tenant) |
| **Stripe** | billing | 2.9% + $0.30 per charge (US) | see below |

### Stripe fee per charge

| Charge | Stripe fee (2.9% + $0.30) | Net to us |
|---|---|---|
| Supporter $20/mo | ~$0.88 | ~$19.12 |
| Supporter $209/yr | ~$6.36 | ~$202.64 |
| Pro $79/mo | ~$2.59 | ~$76.41 |
| Pro $790/yr | ~$23.21 | ~$766.79 |

## 3. Margin per tier

Marginal infra cost per customer is **cents** (Convex calls + storage; Clerk/Vercel/gateway effectively flat until scale). So the dominant variable cost is the Stripe fee:

| Tier | Gross | Variable cost | **Net margin** | **Margin %** |
|---|---|---|---|---|
| Free | $0 | ~$0 | $0 | — (capped loss-leader at 3k req/mo) |
| Supporter monthly | $20 | ~$0.90 | **~$19.10** | **~95%** |
| Supporter annual | $209 | ~$6.40 | **~$202.60** | **~97%** |
| Pro monthly | $79 | ~$2.60 | **~$76.40** | **~97%** |
| Pro annual | $790 | ~$23.20 | **~$766.80** | **~97%** |

## 4. Fixed platform cost & breakeven

Independent of customer count (only paid once at scale):

- Convex Pro (when free tier is exceeded): **$25/mo**
- Vercel Pro (if needed beyond Hobby): **$20/mo**
- Clerk: **$0** until 10k MAU
- VPS/EasyPanel (gateway): **~$12/mo**, already shared across Gnosix infra

**Rough fixed cost: $32–$57/mo.** Breakeven ≈ **2–3 Supporter** subscriptions or **1 Pro** subscription. Everything above that is ~95–97% margin.

## 5. Notes / guardrails

- Free tier is a deliberate loss-leader; the 250/day · 3,000/mo cap bounds its cost. Watch abuse (multiple free workspaces per identity).
- The done-for-you **Revenue Operator** managed service is **$3,500 USD/month** (month-to-month), sold via payment link/invoice after a call — a **secondary CTA outside self-serve**, not a tier here. Post-payment: confirmation email + Cal.com kickoff booking. See [`launch/PRODUCT_ARCHITECTURE.md`](launch/PRODUCT_ARCHITECTURE.md). This managed service is distinct from the old prohibited "$3,500 setup + $750/mo self-serve high-ticket tier" (still do not reintroduce *that*).
- These are estimates; revisit if Convex usage per active workspace turns out higher than expected (usage/audit writes are the main driver).
