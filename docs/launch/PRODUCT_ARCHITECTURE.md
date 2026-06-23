# Product architecture & positioning — Revenue Operator

> The one-liner: **ManyChat MCP is the door; Revenue Operator is the house.**
> The OSS repo is a wedge. The product is agents that run a business — ManyChat is connector #1, not the product.

Modeled on the `czlonkowski/n8n-mcp` pattern (OSS server + a free hosted instance you connect agents to + per-IDE connect guides), adapted to our stack (Composio 1000+ apps, voice, content).

## Three layers

| Layer | What it is | Who it serves | How it earns |
|---|---|---|---|
| **1. OSS wedge — "ManyChat MCP"** | The public repo. Devs self-host, bring their own ManyChat key, connect their own local agent (stdio). Free forever. | Builders who want to run it themselves; SEO/discovery via MCP directories. | $0 directly — it's distribution. Feeds layers 2 & 3. |
| **2. Hosted instance — the connect endpoint** | Sign in, paste your ManyChat key once (encrypted vault), and connect Codex / Claude Code / Cursor **via OAuth — zero config, no server to run.** | Builders who don't want to self-host. The "no configurás ni verga" path. | Free / Supporter / Pro subscriptions. |
| **3. Revenue Operator — the service/brand** | Not "the ManyChat MCP". Agents that operate a client's **social + business**, leveraging the whole stack (Composio, ManyChat, voice, content). ManyChat MCP is **connector #1**. | Operators/agencies who want outcomes, not tools. | Subscriptions + the **done-for-you (~$3,500)** high-ticket. |

**The funnel:** OSS brings devs → the hosted instance hooks them (zero setup) → Revenue Operator upsells them to "agents that run my business." Aligns to the $10k/mo target: OSS = inbound, hosted = conversion, done-for-you = high-ticket.

## Two surfaces (and their domains)

| Surface | What | Domain |
|---|---|---|
| **Service / landing** | Revenue Operator marketing + funnel + the vision. Sign-up + dashboard live here too. | `revenueoperator.wizneo.org` (app = `apps/web`, landing + `/dashboard`) |
| **The MCP instance** | The OAuth-connectable endpoint agents point at. No UI — it's the wire. | `mcp.wizneo.org` (gateway, `src/`, hosted_token + OAuth) |

> Optional: `app.revenueoperator.wizneo.org` as a dashboard alias if we ever split marketing from app. Not needed at launch.

## How "connect via OAuth" works (already half-built)

The gateway already ships **OAuth 2.0 + PKCE** (`src/auth/oauth*.ts`) and **`hosted_token`** mode. So the "connect your agent via OAuth, no config" path is real in code — it needs:

1. **Deploy** the gateway to `mcp.wizneo.org` (milestone E).
2. **Per-IDE connect docs** (n8n-mcp style — one short page each): Claude Code, Claude Desktop, Cursor, Codex, VS Code/Copilot, Windsurf. Each = paste the remote URL + OAuth, done.

Connect UX, hosted: dashboard issues a token / OAuth → user pastes a one-line remote MCP config pointing at `https://mcp.wizneo.org/mcp` → their agent operates ManyChat with our vault + limits + audit behind it. No local server, no key handling.

## Connector roadmap (the "no es solo ManyChat" part)

ManyChat MCP is connector #1. Revenue Operator's moat is the **agent layer on top of many connectors**, powered by what we already run:

- **Now:** ManyChat (subscribers, tags, flows, messaging, policy guard).
- **Next (via Composio, 1000+ apps):** the other surfaces a business lives on — DMs, email, CRM, calendar, socials.
- **Plus our stack:** voice (ElevenLabs), content/video, scheduling — the pieces that turn "operate ManyChat" into "operate my business."

The OSS wedge stays ManyChat-specific (clean, discoverable). The **agent orchestration + multi-connector** is the hosted/paid moat — it does NOT get open-sourced.

## Plan logic, re-framed

Value axis evolves from "ManyChat accounts" → **connectors + agent operations + governance**:

| | Free | Supporter | Pro | Done-for-you |
|---|---|---|---|---|
| Connectors | ManyChat | ManyChat | ManyChat (+ more as they ship) | full stack |
| Accounts / limits | 1 · low | 3 · high | 20 · max | — |
| Governance | — | audit + policy-guard logging | team seats + RBAC + multi-workspace | managed by us |
| Agent ops | hosted connect | daily use | agency scale | we build & run the agents |
| Price | $0 | $20 / $209 | $79 / $790 | ~$3,500 |

(Canonical limits stay in `apps/web/lib/site-data-shared.ts`; economics in [`PLAN_LOGIC.md`](../PLAN_LOGIC.md).)

## Legal posture (brand)

- Product/brand/domain = **ours: "Revenue Operator"**. "ManyChat" used only **descriptively** (nominative fair use): *"the MCP server for ManyChat"*, with the existing *"not affiliated with ManyChat"* disclaimer, no logo/colors.
- Keep the repo title "ManyChat MCP" for SEO/discovery (descriptive). The paid surface is Revenue Operator, not the bare trademark.
- Before charging at scale: confirm ManyChat brand guidelines + API ToS; consider a quick legal check.

## What this changes / next

- **Runbook (#16) subdomains updated** to `revenueoperator.wizneo.org` + `mcp.wizneo.org`.
- README hosted section points to the Revenue Operator hosted path.
- **Pending (gated/deploy):** ship the gateway to `mcp.wizneo.org` (E), then write the per-IDE OAuth connect docs against the live endpoint.

## Theme

Public surface keeps **Operator Terminal** (charcoal `#0C0D0F` + cyan `#2DE2C0`). Switch to WIZNEO Matrix `#00FF88` only on Ulises' call.
