# ManyChat MCP + Revenue Operator — Launch Design Spec

- **Owner:** Ulises Arellano (Gnosix + WIZNEO)
- **Status:** Approved direction, pre-implementation
- **Date:** 2026-06-21
- **Repo:** `/root/manychat-mcp` (WIZNEOAI/Manychat-MCP), branch `uiux/manychat-premium-control-plane`
- **Supersedes for strategy:** `docs/product/completion-handoff-2026-06-19.md` and `docs/product/manychat-canon-drive-2026-06-19.md` keep their operational checklists; this doc is the canonical **positioning + architecture + launch** design they roll up to.

## 1. Problem & objective

ManyChat users run their day inside ManyChat. AI agents (Claude Code, Cursor, Codex, OpenCode) can now operate tools, but there is **no safe, agent-native way to give an agent ManyChat powers** — and the existing attempts are unlicensed weekend repos or thin hosted connectors with zero ManyChat/Meta policy awareness. An agent wired to the raw API can blast messages outside Meta's 24-hour window and get the account flagged.

**Objective:** ship an open-source, agent-native ManyChat MCP that is *special because it is policy-aware and safe*, and monetize a hosted control plane (Revenue Operator) on top. First revenue via self-serve Supporter $20/mo; build audience via the OSS wedge.

**Non-goals (v1):** native ManyChat "App Key" distribution; OAuth as the primary CLI auth; promising delivery outside Meta policy windows; the high-ticket done-for-you offer as a self-serve pricing tier.

## 2. Positioning (locked)

**Layered, hero = builder.**

- **Hero message:** *"Dale superpoderes de ManyChat a tus agentes."* Primary ICP = builders/devs and micro-agencies who already use ManyChat and run AI agents. Direct synergy with the WIZNEO Sprint ("dale superpoderes a tus agentes/terminal").
- **Revenue Operator = the *why* + the paid layer:** the OSS connects you; what you pay for is *not letting your leads die* (vault, hosted tokens, lead-state, audit, handoff). It justifies Supporter/Pro.
- **Brand isolation:** this product has its **own** visual identity (Operator Terminal, cyan). Do **not** use Gnosix gold/black or reuse Elderhermit's mystic green. WIZNEO-adjacent in spirit, distinct in execution.

## 3. Differentiation thesis (researched)

No serious competitor exists: closest OSS is `fabienbutz/manychat-mcp` (0 stars, **no license**, env-var auth, no safety layer); hosted connectors (Zapier/Pipedream/Composio) are thin wrappers with no ManyChat/Meta policy logic; **no official ManyChat MCP exists**. Every competitor is capped by the same public API, so coverage is not a differentiator — the layers *around* the API are.

**Our moat:**
1. **Meta policy/safety layer** nobody else encodes (24h/7-day windows, Message Tags deprecation Feb 10 2026 + `HUMAN_AGENT` exception, opt-in, OTN, read-before-write/verify-after-write).
2. **Hosted multi-tenant operator plane** (encrypted vault, hosted tokens, usage/audit, lead-state) — what agencies running many accounts need.
3. **Structured agent knowledge** (prompts + resources) so the model arrives pre-grounded and legal.
4. **AGPL-3** OSS credibility while protecting the in-repo hosted plane.

**Risk #1:** ManyChat ships an official MCP. Mitigation: our value is *above* the raw API (policy + operator + lead-state), which an official day-one MCP is unlikely to bundle.

## 4. Product architecture — two layers, clean boundary

| Layer | What | Gating | License |
|---|---|---|---|
| **OSS runtime** | CLI + MCP (stdio local + HTTP self-host), BYO API key, **knowledge + validation engine** | Never gated; full self-host | AGPL-3 |
| **Revenue Operator (hosted)** | Dashboard, encrypted vault, hosted `mcp_live_*` tokens, OAuth connect, usage/audit, lead-state, billing | Plan-gated (Free/Supporter/Pro) | Proprietary, on top of runtime |

The OSS runtime must stay fully usable without any hosted dependency. The paid product sells convenience, governance, concurrency, account scaling, and dashboard UX — never the runtime itself.

## 5. The knowledge + validation layer (the wedge — priority 1)

Mirrors why `n8n-mcp` reached ~22k stars: it ships **knowledge + validation**, not API passthrough. New capabilities to add to the OSS runtime:

- **`validate_message` / `validate_flow`** — reject or flag, *before send*: outside-window sends without a valid tag, promo content under the wrong tag, missing opt-in, deprecated Message Tag usage. This is the single biggest differentiator.
- **ManyChat + Meta knowledge corpus** — searchable structured data (flow/block/field/subscriber schema + policy rules), returning **only the essential fields**, not raw API dumps. (SQLite+FTS5 like n8n-mcp, or the existing resources layer — decide in plan phase.)
- **Closed-loop debug** — send/delivery error → explain the policy reason → propose the compliant fix.
- **Agent system-prompt / skill** — shipped guidance ("check templates first", "never send outside the 24h window without a valid tag", "validate before send", "execute tools without commentary").

Existing assets to build on: 7 tool groups, 6 prompts, 8 resources, `docs/context/safety-model.md`, `manychat-official-baseline.md`.

## 6. Auth model (locked — researched against MCP spec 2025-06-18)

Remote MCP servers are OAuth 2.1 **resource servers**; the **authorization server can be delegated**. Clerk natively supports being the MCP AS via **`@clerk/mcp-tools`** (DCR toggle in dashboard).

- **Clerk = MCP Authorization Server.** Hosts login, consent, `/authorize`, `/token`, DCR, AS metadata. "Sign into your account on the app" = existing Clerk sign-in.
- **Gateway = pure OAuth 2.1 resource server.** Serves Protected Resource Metadata at `/.well-known/oauth-protected-resource`, returns `401 + WWW-Authenticate`, validates token **audience**, maps Clerk `userId` → workspace → ManyChat key via the existing Convex control plane (`verifyClerkToken` → `authInfo.extra.userId` → `resolveSession`).
- **Retire** the hand-rolled AS (`src/auth/oauth.ts`, `oauth-routes.ts`) — not spec-conformant (no audience validation, no `WWW-Authenticate`), and owning an AS is needless security surface.
- **Keep `mcp_live_*` paste token as documented fallback** for Codex/OpenCode/CLI (header injection). **Critical:** Claude's connector UI has **no Bearer-token field**, so OAuth is the only clean path for Claude.

## 7. Billing & pricing (locked; Stripe TEST first)

Stripe CLI is authed to **TEST** (`acct_1RHxW5… Entorno de prueba Gnosix`). `@convex-dev/stripe` v0.1.4 already wired; webhook `/stripe/webhook`; `workspaces.plan` enum `free|supporter|pro` exists.

| Plan | Price | ICP | Differentiator |
|---|---|---|---|
| **Free** | $0 | evaluation / light personal | 1 workspace, 1 MC account, ~250 req/day, 1 session, 2 tokens |
| **Supporter** | **$20/mo · $209/yr** | serious builders, OSS support | far higher request limits, 3 accounts, 3 concurrent, OAuth multi-client |
| **Pro** | **$79/mo · $790/yr** | agencies / multi-brand | 20 accounts, 10 concurrent, team seats, full audit |

- **Rename** code's `STRIPE_PRO_*` ($20 today) → **Supporter**; add a new higher **Pro**. Env: `STRIPE_SUPPORTER_MONTHLY_PRICE_ID`, `STRIPE_SUPPORTER_ANNUAL_PRICE_ID`, `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID`.
- **The done-for-you "Revenue Operator" ($3.5k setup) is NOT a self-serve tier** — it becomes a secondary CTA (Gnosix/Sprint cross-sell), so product billing is not entangled with the WIZNEO/Sprint funnel.
- **Close billing gaps vs Depadoc/Elderhermit pattern:** add webhook **event-dedup table**, an **entitlement query** (`isWorkspacePremium`), `invoice.payment_failed` → past-due handling, richer plan state (`subscriptionStatus`, `currentPeriodEnd`, `cancelAtPeriodEnd`).
- **Flow:** verify checkout + webhook + plan-update in **test** → only then flip to **live** (live requires Ulises's Stripe session per CLAUDE.md).

## 8. Design system — "Operator Terminal" (locked)

Control-room aesthetic for agent operations. Distinct from Depadoc (clinical) and Elderhermit (mystic neon-green). Apply the taste stack (`emil-design-eng` + `high-end-visual-design` + `design-taste-frontend`) over these tokens.

```
base    #0C0D0F   warm charcoal (not pure black)
surface #14161A
text    #E8ECEA
muted   #8A938E
accent  #2DE2C0   electric cyan-teal (single accent)
line    rgba(45,226,192,.28)
fonts   Geist (sans) + JetBrains Mono
vibe    control-room / data-dense / no AI-slop
```

Hard rules: 8px baseline grid, body ≥16px / ≤68ch, no pure #000/#FFF, no cards-in-cards, no purple-blue gradients/glassmorphism. Landing rebuilt around the **builder hero** (not "Revenue Operator System / book strategy call"); dashboard reskinned to the new tokens.

## 9. OSS repo & launch (n8n-mcp model)

- **README** rewrite: badges row (CI, AGPL, npm, tests, coverage, Docker) + one-line hero + **quantified coverage table** (policy rules encoded, validation pass-rate, test count) + **honest safety warning** + per-client copy-paste `mcpServers` snippets (Claude Code, Cursor, VS Code, Codex, OpenCode) + **`npx manychat-mcp`** as headline. Remove duplicated intro block.
- **Install ramps:** `npx` one-liner, Docker `docker run` with `MANYCHAT_API_KEY`, Smithery (`smithery.yaml`), `server.json` for the MCP registry, optional Railway button.
- **Distribution:** list on **PulseMCP + Smithery + official MCP registry before launch**; one high-signal launch post leading with before/after safety metrics, CTA in first comment. **Draft-first; no publish without approval.**
- **Contribution:** short welcoming `CONTRIBUTING.md` + require **"Allow edits by maintainers"**; gatekeeping in CI (secret-scan, dependency-check, mandatory `npm test`, issue-triage bot). Keep `CODEOWNERS`, PR template, issue templates.
- **License:** keep **AGPL-3** (protects in-repo hosted plane; revisit only if enterprise adoption stalls).

## 10. Infrastructure (locked)

- **MCP gateway → EasyPanel on the VPS** (Traefik + SSL auto, single-replica — MCP HTTP sessions are process-local). `MCP_REMOTE_AUTH=hosted_token`; **never** set `MANYCHAT_API_KEY` on the multi-tenant gateway. Railway retired.
- **DNS:** `manychat.wizneo.org` (Vercel dashboard) + `mcp.manychat.wizneo.org` (gateway).
- **Secrets:** values only in `/root/.hermes/.env` + Convex/Vercel/EasyPanel env. **Mandatory backup of `VAULT_MASTER_KEY` + `MCP_INTERNAL_SHARED_SECRET`** (lost VAULT_MASTER_KEY = unrecoverable vault). Verify the earlier leaked-secret rotation is complete.

## 11. Execution plan (two parallel tracks)

**Track A — OSS (low risk, fuels content):**
1. Build knowledge + validation layer (`validate_message`/`validate_flow` + policy corpus + closed-loop debug + agent prompt). *Priority 1.*
2. README rewrite + per-client snippets + `npx` headline.
3. CONTRIBUTING + CI hardening (secret-scan, dep-check, triage bot).
4. Merge branch → main (PR, verify `merge-base` vs main first — **approval to push**).
5. Tag `v0.1.0` + registry listings (draft).

**Track B — Hosted paid:**
6. Stripe **TEST** setup via CLI (Supporter + Pro, 4 prices) + close billing gaps.
7. Clerk as MCP AS (`@clerk/mcp-tools`) + gateway → resource server; retire hand-rolled AS.
8. Clerk test→prod, Convex prod env + deploy *(approval)*, gateway on EasyPanel + DNS.
9. **Real browser E2E smoke** (never done): sign-in → workspace → save MC key → issue token → OAuth-connect a client → `get_page_info` → lead queue persists. Then flip Stripe **live** *(approval)*.
10. Frontend redesign (landing + dashboard) to Operator Terminal + taste stack.

**Approval gates (Ulises):** git push, merge, any deploy (Vercel/Convex/gateway), DNS, Stripe live, any public post / outbound.

## 12. Marketing / ICP

- **ICP:** builders/devs + micro-agencies already on ManyChat running AI agents → overlaps the Sprint audience.
- **Funnel:** OSS ManyChat MCP (free lead magnet) → Sprint $500 (I set up your stack) → Supporter $20 recurring. Coherent with the $10K/mo target; product billing stays independent of the Sprint funnel.
- **Channels:** OSS (HN / r/manychat / r/chatbots / ManyChat forum) + WIZNEO content (2-min demo, thread, short) + DM keyword. All draft-first.

## 13. Definition of done

- **Product:** knowledge+validation tools shipped; a builder can OAuth-connect Claude/Codex/OpenCode to the hosted gateway and run a validated ManyChat tool; lead queue persists across refresh; billing verified in test (live deferred or flipped per approval).
- **Repo:** root + web tests/lint/build green; README/ROADMAP/CHANGELOG current; no secrets changed; PR merged after review.
- **Publish:** `v0.1.0` tagged; registry listings live; hosted beta deployed (post-approval) with gateway E2E verified; launch assets approved before any external publish.

## 14. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Official ManyChat MCP ships | High | Compete on policy + operator + lead-state, above the raw API |
| `VAULT_MASTER_KEY` loss | High | Mandatory backup before any vault use |
| MCP HTTP sessions process-local | Medium | Single-replica gateway; Redis-backed only if scaling |
| AGPL deters enterprise adoption | Low | Acceptable for builder ICP; revisit if it blocks |
| Stripe live before E2E verified | Medium | Test-mode E2E gate before live flip |
