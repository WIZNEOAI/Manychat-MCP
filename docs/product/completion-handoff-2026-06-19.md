# ManyChat MCP / Revenue Operator Completion Handoff Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` for inline continuation or `superpowers:subagent-driven-development` for parallel implementation slices. Track checkboxes in this file as work lands. Never push, deploy, publish, send outbound messages, change DNS, or mutate live billing without explicit Ulises approval.

**Goal:** Finish ManyChat MCP as an OSS-ready repo and hosted-beta-ready Revenue Operator control plane, then prepare the public release path.

**Architecture:** Keep the open-source CLI/MCP runtime independent and self-hostable. Build the paid Revenue Operator on top as the hosted dashboard/control-plane layer: Clerk auth, Convex workspace state, encrypted ManyChat vault, hosted MCP tokens, usage/audit events, and lead-state workflow. Deployment is split: web on Vercel, backend functions on Convex, MCP gateway on Railway or VPS in `hosted_token` mode.

**Tech Stack:** TypeScript, Node 18+, MCP SDK, Express, Next.js 16 App Router, React 19, Convex, Clerk, Stripe component, zod, Vitest, ESLint, Docker/Railway/Vercel.

## Global Constraints

- Preserve OSS behavior: CLI, local MCP stdio, and remote MCP self-hosting must remain broadly usable without paid hosted dependencies.
- Convex hosted functions must derive authorization from `ctx.auth`; never accept user IDs as trusted auth inputs.
- Hosted internal gateway functions must require `MCP_INTERNAL_SHARED_SECRET` / `HOSTED_CONTROL_PLANE_SECRET`.
- Never set `MANYCHAT_API_KEY` on the hosted multi-tenant gateway.
- Do not store PHI, patient detail, or medical claims in lead fields.
- No git push, production deploy, DNS, Stripe live, public publishing, outbound messages, or destructive system actions without explicit Ulises approval.
- Public framing: OSS repo = CLI/MCP/self-host runtime. Paid product = Revenue Operator dashboard, vault, playbooks, routing/handoff, reporting.

---

## 0. Current observed state — 2026-06-19

### Branch / repo state

- Repo: `/root/manychat-mcp`
- Branch: `uiux/manychat-premium-control-plane`
- Working tree after Lead-State v1: clean.
- No push and no production deploy were performed.

### Latest relevant commits

| Commit | Status | What landed |
| --- | --- | --- |
| `8975ea7` | ✅ Done | Harden hosted control-plane auth. Next server routes call Convex with Clerk JWT; Convex ownership checks derive from `ctx.auth`; internal hosted-token guardrails require shared secret. |
| `ff2cb41`, `97b6fcc`, `a406fbd` | ✅ Done | Reposition repo/dashboard/docs around Revenue Operator while preserving OSS positioning. |
| `d99ad4f` | ✅ Done | Add Convex `operatorLeads` state module. |
| `cffa91e` | ✅ Done | Add lead create/list and status API routes plus zod schemas/tests. |
| `47d89ab` | ✅ Done | Add dashboard lead queue UI. |
| `76db5fd` | ✅ Done | Guard stale dashboard lead refresh state and clear stale errors. |
| `add9b88` | ✅ Done | Store lead status counters on `workspaces.operatorLeadStatusCounts` instead of a separate counter table. |
| `522cdc8` | ✅ Done | Lazy exact backfill for existing leads when workspace counters are missing. |

### Verification already observed

Run after the latest Lead-State v1 fix:

```bash
npm --prefix apps/web run test
npm run web:lint
npm run web:build
```

Observed result:

- ✅ `apps/web` Vitest: 39 tests passed.
- ✅ `npm run web:lint`: passed.
- ✅ `npm run web:build`: passed.
- ✅ Final reviewer approved Lead-State v1 with no findings.

Previous full-suite verification before Lead-State v1 also passed:

```bash
npm test
npm --prefix apps/web run test
npm run web:build
npm run build
npm run lint
npm run web:lint
```

### Known caution

During an earlier API diagnosis, this command printed `Uploading functions to Convex...`:

```bash
npm --prefix apps/web run convex:codegen
```

Generated drift was reverted, and no live data mutation was observed. Future sessions should avoid `convex:codegen`, `convex dev`, or `convex deploy` unless explicitly needed and approved for the intended environment.

---

## 1. Product line — achieved vs missing

### 1.1 OSS runtime product

| Area | Achieved | Still missing | Done when |
| --- | --- | --- | --- |
| CLI execution | ✅ Existing CLI builds and tests pass. API-key-first model remains canonical. | ⬜ Final public release smoke on a clean clone. | Fresh clone can run `npm install`, `npm run build`, `node dist/index.js doctor`, and documented commands without hidden hosted requirements. |
| Local MCP stdio | ✅ Existing runtime preserved. | ⬜ Manual client smoke with Claude Code/Cursor/Codex config before release. | At least one local client connects over stdio and runs `get_page_info` with a test ManyChat key. |
| Remote MCP self-host | ✅ `manychat_header`, `oauth`, and `hosted_token` modes documented. | ⬜ One final Docker/Railway/VPS smoke after release candidate. | `GET /health` and `POST /mcp initialize` work in self-host mode. |
| OSS docs | ✅ README/ROADMAP/docs now explain OSS vs paid split. | ⬜ Remove duplicate README intro and update docs for Lead-State v1. | README is concise, has no duplicated positioning block, and docs mention hosted lead-state without implying OSS gating. |
| Release packaging | ✅ `package.json` exposes `manychat` and `manychat-mcp` bins. | ⬜ Decide whether to publish npm now or only GitHub release/tag. Add CI publish only if approved. | Release route is explicit: GitHub tag only or npm package + GitHub release. |

### 1.2 Revenue Operator hosted product

| Area | Achieved | Still missing | Done when |
| --- | --- | --- | --- |
| Product positioning | ✅ Dashboard/docs repositioned from generic ManyChat MCP to Revenue Operator. | ⬜ Final one-sentence ICP and launch promise approved by Ulises. | Public copy can say exactly who it is for and what leakage it prevents. |
| Auth model | ✅ Hardened: Convex uses `ctx.auth`; API routes use Clerk JWT; internal gateway calls require shared secret. | ⬜ Real Clerk + Convex session smoke in browser. | A real logged-in user can create/sync workspace and API routes reject cross-workspace access. |
| ManyChat vault | ✅ Existing encrypted vault flow and key validation documented and tested. | ⬜ Real ManyChat key browser smoke before private beta. | Valid key saves; invalid key rejects; saved key is never shown again. |
| Hosted MCP tokens | ✅ Token issue/resolve/audit path exists and tests pass. Key rotation revokes active tokens. | ⬜ Real hosted gateway E2E after deploy. | Issued `mcp_live_*` token resolves through gateway and can execute `get_page_info`. |
| Usage/audit | ✅ Gateway record/authorize paths exist; audit events tracked. | ⬜ Dashboard reporting is still baseline. Needs richer views only after beta proves demand. | Private beta users can see enough usage/audit data to debug sessions. |
| Lead-State v1 | ✅ `operatorLeads`, lead APIs, status transitions, dashboard queue, serialized counters, lazy backfill. | ⬜ Browser/E2E smoke with real session. ⬜ Docs/changelog entry. | User creates a lead, changes status, refreshes, and sees correct counts across reload. |
| Billing | ✅ Stripe component/env docs exist; pricing tiers drafted. | ⬜ Live/test billing flow not finalized for launch. ⬜ Pro pricing needs approval if public. | Checkout/subscription/webhook can update workspace plan in intended environment. |
| Rate limits | ✅ In-memory rate limiter covered by tests. | ⬜ Durable Redis-backed limits if hosted gateway scales beyond single replica. | Limits survive multi-replica or the beta explicitly stays single-replica. |
| Playbooks / handoff | ⬜ Not implemented beyond lead state. | ⬜ Define v1 handoff states, next-action reminders, and n8n/CRM sync only after lead queue browser smoke. | A beta operator can tell what to do next with each lead. |

### 1.3 Gnosix / WIZNEO business layer

| Area | Achieved | Still missing | Done when |
| --- | --- | --- | --- |
| WIZNEO content angle | ✅ Repo now frames ManyChat MCP as OSS wedge plus Revenue Operator. | ⬜ 2-minute demo script and launch content pack. | One demo shows CLI → hosted token → dashboard/lead queue. |
| Gnosix productization | ✅ Product can support the Gnosix AI systems story. | ⬜ Decide whether private beta is WIZNEO OSS audience, Gnosix clients, or both. | Beta cohort source and outreach copy are explicit. |
| Drive launch pack | ✅ Drive launch pack doc exists and says no deployment yet. | ⬜ Update launch pack after Lead-State v1 and final PR state. | Handoff doc has latest commits, screenshots, and final launch checklist. |

---

## 2. Repo work remaining before PR

### Task R1: Update docs for Lead-State v1

**Files:**

- Modify: `README.md`
- Modify: `ROADMAP.md`
- Modify: `docs/product/control-plane-contracts.md`
- Modify: `docs/product/drive-launch-pack-2026-06-18.md`
- Modify: `BETA_READINESS_REPORT.md`
- Modify: `CHANGELOG.md`

**Checklist:**

- [ ] Add Lead-State v1 to README hosted beta flow without making it sound required for OSS CLI/MCP.
- [ ] Add lead queue / lead state to `ROADMAP.md` as completed beta baseline; keep n8n/CRM sync as next.
- [ ] Extend `control-plane-contracts.md` API table with:
  - `GET /workspaces/:id/leads`
  - `POST /workspaces/:id/leads`
  - `PATCH /workspaces/:id/leads/:leadId/status`
- [ ] Add `operatorLeads` and `operatorLeadStatusCounts` to core entity docs.
- [ ] Update `BETA_READINESS_REPORT.md` test counts from the older 68-test snapshot or mark it as historical if not rewriting it.
- [ ] Add changelog entry for Revenue Operator Lead-State v1 and auth hardening.
- [ ] Verify docs do not claim deploy/push happened.

**Verification:**

```bash
npm --prefix apps/web run test
npm run web:lint
npm run web:build
```

Expected: all pass.

**Commit:**

```bash
git add README.md ROADMAP.md docs/product/control-plane-contracts.md docs/product/drive-launch-pack-2026-06-18.md BETA_READINESS_REPORT.md CHANGELOG.md
git commit -m "docs: update revenue operator beta handoff"
```

### Task R2: Add focused Lead-State behavior tests if time allows

**Files:**

- Modify: `apps/web/lib/server/api-schemas.test.ts` if schema-only coverage is enough.
- Add or modify a dashboard test near `apps/web/components/dashboard-copy.test.tsx` only if the existing test harness can cover the behavior without mocking Convex internals.

**Checklist:**

- [ ] Cover schema rejection for overlong/empty `displayName`, invalid source, invalid status.
- [ ] Cover dashboard copy that users understand the queue prevents lead leakage, not autonomous sales.
- [ ] Do not add brittle tests that assert exact default counts or layout-only strings.

**Verification:**

```bash
npm --prefix apps/web run test -- lib/server/api-schemas.test.ts components/dashboard-copy.test.tsx
npm run web:build
```

Expected: tests and build pass.

**Commit:**

```bash
git add apps/web/lib/server/api-schemas.test.ts apps/web/components/dashboard-copy.test.tsx
git commit -m "test: cover revenue operator lead states"
```

### Task R3: Final pre-PR verification

**Files:** none unless failures require fixes.

**Checklist:**

- [ ] Run root tests.
- [ ] Run web tests.
- [ ] Run root typecheck/build.
- [ ] Run web lint/build.
- [ ] Review branch diff for secrets, accidental generated files, and public behavior changes.
- [ ] Confirm no `.env` or secret-bearing files changed.

**Commands:**

```bash
npm test
npm --prefix apps/web run test
npm run lint
npm run build
npm run web:lint
npm run web:build
git status --short
git diff --stat main...HEAD
```

Expected:

- Tests/lint/build pass.
- `git status --short` is clean.
- Diff is limited to intentional product/docs/web/control-plane files.

### Task R4: PR preparation — approval required before push

**Files:**

- Use existing `.github/pull_request_template.md`.

**Checklist:**

- [ ] Ask Ulises for explicit approval to push branch.
- [ ] Push only after approval.
- [ ] Open PR against the intended base branch.
- [ ] PR title: `feat(web): add revenue operator lead state`
- [ ] PR body includes:
  - What changed.
  - Why it preserves OSS behavior.
  - Verification commands and observed results.
  - Known risk: no live browser/Clerk/Convex E2E yet.
  - Note: no deploy done.
  - CODEOWNERS review required if applicable.

**Do not run until approved:**

```bash
git push -u origin uiux/manychat-premium-control-plane
```

---

## 3. Product work remaining after PR

### Task P1: Real browser smoke — private environment

**Prerequisite:** Ulises approves using the intended Clerk/Convex/Vercel preview or local dev environment.

**Checklist:**

- [ ] Open dashboard.
- [ ] Sign in with Clerk.
- [ ] Confirm workspace sync/create.
- [ ] Save a test ManyChat API key.
- [ ] Confirm invalid key rejection.
- [ ] Issue MCP token.
- [ ] Create lead manually.
- [ ] Move lead through `new → contacted → qualified → booked`.
- [ ] Refresh page and verify counts persist.
- [ ] Confirm cross-workspace access is rejected if a second workspace/user is available.

**Evidence to save:**

- Screenshot: dashboard lead queue with non-sensitive fake lead.
- Console/network errors: none or documented.
- Exact environment used: local, preview, or production.

### Task P2: Hosted MCP gateway E2E

**Prerequisite:** Ulises approves gateway environment: Railway or VPS.

**Checklist:**

- [ ] Set gateway env:
  - `NODE_ENV=production`
  - `MCP_REMOTE_AUTH=hosted_token`
  - `MCP_BASE_URL=<public gateway origin>`
  - `HOSTED_CONTROL_PLANE_URL=<web app origin>`
  - `HOSTED_CONTROL_PLANE_SECRET=<same as MCP_INTERNAL_SHARED_SECRET>`
- [ ] Confirm `MANYCHAT_API_KEY` is not set on hosted multi-tenant gateway.
- [ ] Run health check:

```bash
curl -sS https://<gateway>/health
```

Expected: JSON status ok.

- [ ] Use issued dashboard token with `POST https://<gateway>/mcp` initialize.
- [ ] Run `get_page_info` through a real MCP client.
- [ ] Confirm usage/audit increments in dashboard.

### Task P3: Billing decision and implementation gate

**Decision required from Ulises:** Launch hosted beta with billing enabled, invite-only manual billing, or free private beta first.

**Recommended safe default:** private beta without public live billing until gateway E2E is verified.

**If billing now:**

- [ ] Confirm pricing: Free / Supporter $20/mo / Pro manual or explicit public price.
- [ ] Configure Stripe test first.
- [ ] Verify checkout, webhook, and workspace plan update.
- [ ] Only then request approval for live Stripe.

### Task P4: Lead workflow v2 — only after v1 browser smoke

**Do not start before P1 passes.**

Candidate slices:

- [ ] Due/overdue next-action reminders.
- [ ] Source import from ManyChat subscriber metadata.
- [ ] n8n webhook export.
- [ ] Supabase/Gnosix CRM sync.
- [ ] Simple analytics: lead aging, booked/won conversion, cold-lead count.

Keep each as its own branch/PR. Do not build all at once.

---

## 4. Publishing / launch track

### 4.1 OSS release path

| Step | Status | Owner lane | Approval |
| --- | --- | --- | --- |
| Final docs/changelog | ⬜ Missing | Claude/WIZ | No external approval unless public copy changes materially. |
| Final test/build suite | ⬜ Missing after docs | Claude/WIZ | No. |
| Push branch | ⬜ Missing | Claude/WIZ | Yes, Ulises approval required. |
| PR review | ⬜ Missing | Reviewer + CodeRabbit if available | PR approval required. |
| Merge | ⬜ Missing | Ulises / approved agent | Yes. |
| GitHub release tag `v0.1.0` | ⬜ Missing | Claude/WIZ | Yes. |
| npm publish | ⬜ Optional | Claude/WIZ | Yes; decide first. |
| GitHub Discussions | ⬜ Missing | Ulises/Claude | Yes if changing repo settings. |

### 4.2 Hosted beta publish path

| Step | Status | Owner lane | Approval |
| --- | --- | --- | --- |
| Vercel web project/env | ⬜ Missing | Claude/WIZ | Yes, deploy approval. |
| Convex env/deploy | ⬜ Missing | Claude/WIZ | Yes, live backend approval. |
| Clerk JWT template | ⬜ Missing | Ulises/Claude | Yes if account config changes. |
| Gateway Railway/VPS | ⬜ Missing | Claude/WIZ | Yes, deploy approval. |
| Stripe test | ⬜ Missing | Claude/WIZ | Yes for account/config work. |
| Stripe live | ⬜ Missing | Ulises only/approved | Strong yes. |
| Custom domain | ⬜ Missing | Claude/WIZ | Yes, DNS approval. |
| Private beta cohort | ⬜ Missing | Ulises + Hermes/WIZ | Yes before outbound messages. |

### 4.3 Marketing/content launch path

| Asset | Status | Notes |
| --- | --- | --- |
| 2-minute demo | ⬜ Missing | Show OSS CLI + hosted dashboard + MCP token + lead queue. |
| README launch copy | ✅ Mostly done | Needs Lead-State v1 update and duplicate intro cleanup. |
| Reddit / HN / ManyChat forum posts | ⬜ Missing | Draft-first only; no publish without approval. |
| WIZNEO content angle | ⬜ Missing | Frame: `Ya no hay excusas. Conecta tus leads, no los dejes morir.` Keep WIZNEO green/Matrix separate from Gnosix. |
| Gnosix client angle | ⬜ Missing | Frame as production AI systems / lead leakage prevention, not chatbot hype. |
| Drive launch pack update | ⬜ Missing | Add new screenshots/evidence after browser smoke. |

---

## 5. Session-by-session continuation map

### Next session A — repo handoff PR readiness

**Goal:** Make the branch PR-ready without deploying.

- [ ] Read this file first.
- [ ] Run `git status --short`.
- [ ] Complete Task R1 docs/changelog.
- [ ] Optionally complete Task R2 focused tests.
- [ ] Run Task R3 verification.
- [ ] Prepare PR body.
- [ ] Stop before push and ask Ulises for approval.

**Expected final state:** clean branch, docs current, verification observed, ready to push.

### Next session B — PR + private preview

**Goal:** Push/open PR and validate preview only if Ulises approves.

- [ ] Get explicit approval to push.
- [ ] Push branch and open PR.
- [ ] Address review findings.
- [ ] If preview exists, run P1 browser smoke.
- [ ] Save screenshots/evidence.

**Expected final state:** PR open or merged, preview smoke documented.

### Next session C — hosted gateway E2E

**Goal:** Prove hosted token end-to-end through the MCP gateway.

- [ ] Get explicit deploy/environment approval.
- [ ] Deploy or configure selected gateway target.
- [ ] Run P2 smoke.
- [ ] Confirm usage/audit events.
- [ ] Document exact env topology without exposing secrets.

**Expected final state:** hosted MCP token works in a real client.

### Next session D — beta launch pack

**Goal:** Prepare launch material and beta cohort operations.

- [ ] Update Drive launch pack.
- [ ] Create 2-minute demo script.
- [ ] Draft OSS launch posts.
- [ ] Draft private beta invitation copy.
- [ ] Do not publish/send until Ulises approves.

**Expected final state:** launch assets ready for approval, not published.

---

## 6. Definition of done by layer

### Product done

- [ ] Revenue Operator ICP/promise approved.
- [ ] Dashboard supports workspace, ManyChat vault, MCP token, usage/audit, and lead-state v1 in browser.
- [ ] Private beta operator can connect a ManyChat account and run one MCP tool through hosted token.
- [ ] Lead queue persists and counts remain correct after refresh.
- [ ] Billing plan is either intentionally deferred or verified in test mode.

### Repo done

- [ ] Root tests pass: `npm test`.
- [ ] Root typecheck/build pass: `npm run lint && npm run build`.
- [ ] Web tests pass: `npm --prefix apps/web run test`.
- [ ] Web lint/build pass: `npm run web:lint && npm run web:build`.
- [ ] README, ROADMAP, CHANGELOG, deployment docs are current.
- [ ] No secrets or `.env` files changed.
- [ ] PR merged after review.

### Publish done

- [ ] GitHub release/tag approved and created.
- [ ] npm publish decision made; if approved, package published from clean build.
- [ ] Hosted beta deployed only after approval.
- [ ] Gateway E2E verified.
- [ ] Launch posts/demo approved before external publishing.
- [ ] Drive launch pack updated with evidence and links.

---

## 7. Copy-paste prompt for the next coding session

```txt
Continue ManyChat MCP / Revenue Operator from /root/manychat-mcp.
Read docs/product/completion-handoff-2026-06-19.md first.
Current branch should be uiux/manychat-premium-control-plane.
Do not push, deploy, publish, send outbound messages, change DNS, or touch live billing without explicit approval.
Start with Next session A: repo handoff PR readiness.
Run git status, update docs/changelog for Lead-State v1, verify with npm test / web tests / lint / builds, and prepare the PR body. Stop before push and ask for approval.
```
