# Directory submissions plan (draft-first)

> **Nothing here is submitted yet.** Every public submission is a gate — needs Ulises' explicit OK.
> Research current as of 2026-06-22. Re-verify URLs/commands before submitting (registries move fast).

## TL;DR

The repo is launch-ready in **content** (README, skills, verified MCP handshake, 28 tools), but **two hard prerequisites block every submission**:

1. **Repo must be PUBLIC.** `WIZNEOAI/Manychat-MCP` is currently **private**. Glama, PulseMCP, and mcp.so are crawl-based on public GitHub; the official registry's `io.github.*` namespace and `awesome-mcp-servers` PRs also require a public repo. → **GATE: Ulises approves making the repo public** (per global rule: never make a repo public without explicit confirmation).
2. **A reachable artifact.** The official registry needs either:
   - an **npm package** (`manychat` is currently *unpublished* — was unpublished 2026-05-17), or
   - a **deployed remote URL** (the hosted gateway — milestone E).
   Crawl-based directories only need the public repo; they don't need npm/deploy.

Also: GitHub classifies the license as "Other", not AGPL-3.0 — worth confirming `LICENSE` is the canonical AGPL-3.0 text so registries display the license correctly.

## What can go out, and when

| Registry | Method | Needs public repo | Needs npm/deploy | Can submit after "public"? |
|---|---|---|---|---|
| **Glama** (glama.ai/mcp) | crawl → claim | ✅ | ❌ | ✅ yes (auto-discovered, then claim) |
| **PulseMCP** | crawl → claim | ✅ | ❌ | ✅ yes |
| **mcp.so** | manual submit | ✅ | ❌ | ✅ yes |
| **awesome-mcp-servers** (punkpeye) | GitHub PR | ✅ | ❌ | ✅ yes |
| **Smithery** | `smithery mcp publish <url>` | ✅ | **deploy (E)** | ⏳ after gateway deploy |
| **Official MCP Registry** | `mcp-publisher` + `server.json` | ✅ | **npm OR deploy** | ⏳ after npm publish or deploy |

**Recommended sequence:** (1) make repo public → (2) submit the 4 crawl/PR directories immediately → (3) after milestone E (or an npm publish), do Smithery + the official registry.

---

## 1. Official MCP Registry — registry.modelcontextprotocol.io

The community feed many clients read. Listing = publishing a `server.json` under a name you prove you own.

- **Namespace:** `io.github.WIZNEOAI/manychat-mcp` — ownership proven via GitHub OAuth (the `mcp-publisher login github` flow), since the repo is under the `WIZNEOAI` GitHub org. No domain proof needed for the `io.github.*` namespace.
- **Flow:**
  ```bash
  # one-time
  mcp-publisher login github
  # in repo root
  mcp-publisher init        # scaffolds server.json
  mcp-publisher publish      # validates + publishes
  ```
- **`server.json` must point to a real artifact**: either a `packages` entry (npm) or a `remotes` entry (deployed HTTP). Blocked until npm publish or deploy.
- **Draft `server.json`** (remote/HTTP variant, fill `<gateway-url>` after E):
  ```json
  {
    "name": "io.github.WIZNEOAI/manychat-mcp",
    "description": "Give your AI agents ManyChat superpowers — operate subscribers, tags, fields, flows and messages, with a built-in Meta policy-validation guard.",
    "version": "0.1.0",
    "repository": { "url": "https://github.com/WIZNEOAI/Manychat-MCP", "source": "github" },
    "remotes": [
      { "type": "streamable-http", "url": "https://<gateway-url>/mcp" }
    ]
  }
  ```
  npm variant (if we re-publish `manychat`): replace `remotes` with
  ```json
  "packages": [
    { "registryType": "npm", "identifier": "manychat", "version": "0.1.0", "transport": { "type": "stdio" } }
  ]
  ```
- **Risk:** namespace + artifact ownership is enforced; can't fake. The 4KB `_meta` limit only matters if we add publisher metadata.

## 2. Smithery — smithery.ai

Agent-tool focused; hosted-first. We already ship `smithery.yaml` (http startCommand, OAuth or `X-ManyChat-API-Key`).

- **Flow:** `smithery mcp publish https://<gateway-url> -n WIZNEOAI/manychat-mcp` (needs the deployed gateway base URL → milestone E).
- **Note:** `smithery.yaml` references a public HTTPS `baseUrl`; confirm it matches the deployed gateway. Publisher verification gives a clean (non-"crawled") listing.
- **Blocked until:** gateway deploy (E).

## 3. Glama — glama.ai/mcp

Largest directory (~37k servers mid-2026). **Crawl-based**: auto-discovers public GitHub MCP repos, then the author **claims** ownership (GitHub) to move from "crawled" → "Claimed"/"Official" tier.

- **Flow:** make repo public → wait for crawl (or submit the repo URL) → sign in with GitHub → claim the listing → fill metadata (description, homepage, license).
- **No npm/deploy needed.** Doable right after the repo is public.

## 4. PulseMCP

**Crawl-based**, claim available after discovery. Same pattern as Glama: public repo → claim → polish metadata. No npm/deploy needed.

## 5. mcp.so

Largest by raw count. **Manual submit.** Required info: server name, one-sentence capability description, **tool count (28)**, transport (stdio + Streamable HTTP), GitHub repo URL, homepage URL, optional icon.

- **Draft entry:**
  - Name: **ManyChat MCP**
  - Description: *Give your AI agents ManyChat superpowers, with a built-in Meta policy-validation guard.*
  - Tools: **28** · Transports: **stdio + Streamable HTTP** · License: **AGPL-3.0**
  - Repo: `https://github.com/WIZNEOAI/Manychat-MCP` · Homepage: `https://manychat.wizneo.org` (after E)
- No npm/deploy strictly needed, but a live homepage (E) makes a stronger listing.

## 6. awesome-mcp-servers (punkpeye)

Curated GitHub list; **inclusion = a PR**. Fork → branch → add **one server per line, alphabetical, under the correct category** (Messaging / Marketing / Communication). 

- **Draft line** (place alphabetically under the right category):
  ```
  - [WIZNEOAI/Manychat-MCP](https://github.com/WIZNEOAI/Manychat-MCP) 📇 ☁️ - Operate ManyChat from AI agents (subscribers, tags, flows, messaging) with a Meta policy-validation guard.
  ```
  (Confirm the repo's emoji legend — 📇 = TypeScript, ☁️ = cloud/remote — against the list's current legend before submitting.)
- **Note:** `wong2/awesome-mcp-servers` does **not** take PRs — it submits via `https://mcpservers.org/submit`. Only `punkpeye/awesome-mcp-servers` takes PRs.

---

## Pre-submission checklist (do before any submit)

- [ ] **GATE:** Ulises approves making `WIZNEOAI/Manychat-MCP` public.
- [ ] Confirm `LICENSE` is canonical AGPL-3.0 so GitHub/registries detect it (currently shows "Other").
- [ ] Repo description + topics set on GitHub (`mcp`, `manychat`, `ai-agents`, `model-context-protocol`).
- [ ] README renders well publicly (badges, links resolve) — done in #13/#14.
- [ ] Decide artifact path for official registry + Smithery: **npm re-publish** vs **wait for gateway deploy (E)**.
- [ ] For each submission: draft prepared above → **Ulises OK** → submit → record the live listing URL back here.

## Sources

- [MCP Registries in 2026 — RoxyAPI](https://roxyapi.com/blogs/mcp-registries-where-to-list-your-server-2026)
- [How to list your MCP server (Smithery/Glama/PulseMCP) — Tallyfy](https://tallyfy.com/how-to-list-mcp-server-registry-smithery-glama-pulsemcp/)
- [Official MCP Registry server.json requirements — Glama](https://glama.ai/blog/2026-01-24-official-mcp-registry-serverjson-requirements)
- [Official MCP Registry](https://registry.modelcontextprotocol.io/) · [registry repo](https://github.com/modelcontextprotocol/registry)
- [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) · [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers)
