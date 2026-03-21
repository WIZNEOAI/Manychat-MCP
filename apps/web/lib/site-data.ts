export const supportedClients = [
  "Claude Desktop",
  "Claude Code",
  "Cursor",
  "Codex",
  "Antigravity",
  "Other streamable HTTP MCP clients",
] as const;

export const productSurfaces = [
  {
    name: "CLI",
    status: "Primary",
    description:
      "Deterministic ManyChat operations: JSON on stdout, stable exit codes, and the full command tree agents rely on.",
  },
  {
    name: "Local MCP (stdio)",
    status: "Supported",
    description:
      "Drop-in MCP transport for coding agents on your machine. Same execution layer as the CLI—no separate runtime.",
  },
  {
    name: "Remote MCP (HTTP)",
    status: "Supported",
    description:
      "Production HTTP endpoint for Railway, Docker, or any VPS. Explicit startup contract: health check + POST /mcp.",
  },
  {
    name: "Web (this app)",
    status: "Scaffolded",
    description:
      "Landing, docs shell, and dashboard shell. Hosted mode will add auth, vault, tokens, and usage—without replacing the CLI.",
  },
] as const;

export const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    tagline: "Validate hosted remote MCP with safe limits.",
    limits: [
      "1 workspace",
      "1 connected ManyChat account",
      "Capped daily requests",
      "1 concurrent remote MCP session",
      "Community support",
    ],
    cta: "Best for trying the hosted path",
  },
  {
    name: "Supporter",
    price: "$20/mo",
    tagline: "Serious individual use, fair-use limits, and OSS sustainability.",
    limits: [
      "Unlimited individual usage under fair-use",
      "Up to 3 connected ManyChat accounts",
      "Up to 3 concurrent remote sessions",
      "Priority support",
      "Helps fund the open-source core",
    ],
    cta: "Best for power users who want hosted convenience",
  },
  {
    name: "Pro",
    price: "Custom",
    tagline: "Agencies and teams: more accounts, concurrency, and governance.",
    limits: [
      "Higher account and concurrency caps",
      "Team members and roles",
      "Audit logs and usage visibility",
      "Capability bundles and policy controls",
      "Billing-ready metering hooks",
    ],
    cta: "Best for multi-brand and multi-seat operators",
  },
] as const;

export const dashboardRoadmap = [
  "Workspace creation and plan badge (Free / Supporter / Pro)",
  "Members and roles (Pro): invite, revoke, audit who changed what",
  "Connected ManyChat accounts: name, default account, disconnect",
  "Encrypted vault: keys never re-displayed after save; rotation flow",
  "MCP tokens: issue, one-time reveal, revoke; scoped to workspace + bundle",
  "Usage meters: daily/monthly requests, concurrent sessions vs plan caps",
] as const;

export const selfHostVsHosted = [
  {
    dimension: "Who runs the MCP server",
    selfHost: "You (local, Railway, Docker, VPS)",
    hosted: "We run HTTPS MCP; you connect clients",
  },
  {
    dimension: "ManyChat API key",
    selfHost: "Your env or X-ManyChat-API-Key (you manage rotation)",
    hosted: "Stored encrypted per workspace; injected server-side",
  },
  {
    dimension: "Client credential",
    selfHost: "Often the same key or your own proxy rules",
    hosted: "Dashboard / MCP product token (routing, limits, audit)",
  },
  {
    dimension: "Billing",
    selfHost: "Free OSS; your infra costs only",
    hosted: "Free / Supporter / Pro tiers for scale and support",
  },
] as const;

export const credentialLanes = [
  {
    title: "ManyChat API key",
    subtitle: "Execution credential",
    body: "Required to call the ManyChat Account Public API. In OSS you set MANYCHAT_API_KEY or pass a header. In hosted, it lives in an encrypted vault and never goes back to the MCP client.",
  },
  {
    title: "Dashboard login (hosted)",
    subtitle: "Human control plane",
    body: "Owners manage workspaces, connected accounts, issued MCP tokens, and plan limits. Not used by the CLI self-host path.",
  },
  {
    title: "MCP access token",
    subtitle: "Product credential",
    body: "What Claude, Cursor, Codex, and similar clients send to the hosted MCP endpoint. Maps to a workspace, enforces concurrency and usage, and keeps ManyChat keys off laptops.",
  },
] as const;

export const executionFlowSteps = [
  {
    step: "01",
    title: "Choose a surface",
    body: "CLI for automation, stdio MCP for local agents, HTTP MCP for remote clients—or hosted MCP when you want vault + tokens.",
  },
  {
    step: "02",
    title: "Attach the ManyChat key",
    body: "OSS: environment or header. Hosted: paste once in the dashboard; the server encrypts and uses it for execution.",
  },
  {
    step: "03",
    title: "Operate with guardrails",
    body: "Read before write, verify after mutations, respect messaging windows. JSON stays on stdout; diagnostics on stderr.",
  },
] as const;

export const docsSections = [
  {
    id: "overview",
    title: "Overview",
    body: "This project is CLI-first: the command surface and JSON contracts are the source of truth. MCP adds compatibility and remote access; the web app is packaging and onboarding.",
    path: "README.md",
  },
  {
    id: "railway",
    title: "Deploy on Railway",
    body: "Use the explicit production command npm run start:mcp:http, honor PORT, expose GET /health and POST /mcp, and keep Phase 0 services single-replica unless you know why not.",
    path: "docs/deploy/railway.md",
  },
  {
    id: "vps-docker",
    title: "VPS + Docker",
    body: "Run the same HTTP MCP entrypoint in a container, terminate TLS at a reverse proxy, and enable Redis-backed OAuth only when MCP_REMOTE_AUTH=oauth.",
    path: "docs/deploy/vps-docker.md",
  },
  {
    id: "clients",
    title: "Connect MCP clients",
    body: "Wire Claude, Cursor, Codex, and Claude Desktop to streamable HTTP MCP. ManyChat keys remain the execution credential; OAuth is optional compatibility for some clients.",
    path: "docs/connect/mcp-clients.md",
  },
  {
    id: "product",
    title: "Product & hosted model",
    body: "Hosted control plane, pricing intent, API/route sketch, and how the repo may grow (apps/api, optional MCP service).",
    path: "docs/product/hosted-control-plane.md",
    extraPaths: [
      "docs/product/pricing-tiers.md",
      "docs/product/control-plane-contracts.md",
      "docs/product/repository-evolution.md",
    ],
  },
] as const;

export const docsLinks = [
  {
    title: "Deploy on Railway",
    href: "/docs#railway",
    description: "Explicit HTTP MCP startup, PORT, health checks, and production env.",
  },
  {
    title: "Deploy on VPS + Docker",
    href: "/docs#vps-docker",
    description: "Container layout, TLS, and when Redis is required.",
  },
  {
    title: "Connect MCP clients",
    href: "/docs#clients",
    description: "Claude, Cursor, Codex, Antigravity, and streamable HTTP patterns.",
  },
  {
    title: "Hosted control plane",
    href: "/docs#product",
    description: "Workspaces, vault, MCP tokens, usage, and plan limits (spec).",
  },
] as const;

export type DashboardPanelStatus = "scaffold" | "planned_api";

export const dashboardPanels = [
  {
    id: "workspace",
    title: "Workspace",
    description: "Active workspace name, plan (Free / Supporter / Pro), and billing placeholder.",
    status: "scaffold" satisfies DashboardPanelStatus,
    bullets: ["Default workspace: Acme Growth (example)", "Plan: Free — upgrade for higher limits"],
  },
  {
    id: "members",
    title: "Members",
    description: "Team access to the control plane. Pro-tier invites and roles.",
    status: "planned_api" satisfies DashboardPanelStatus,
    bullets: ["Owner: you@example.com", "Role: owner · Last active —"],
  },
  {
    id: "accounts",
    title: "ManyChat accounts",
    description: "Named connections; each maps to encrypted credentials in the vault.",
    status: "planned_api" satisfies DashboardPanelStatus,
    bullets: ["No accounts connected yet", "Connect from ManyChat → API token docs"],
  },
  {
    id: "vault",
    title: "Encrypted key vault",
    description: "ManyChat API keys at rest. Never shown in full after save.",
    status: "planned_api" satisfies DashboardPanelStatus,
    bullets: ["Encryption: KMS envelope (planned)", "Rotation: supported via dashboard (planned)"],
  },
  {
    id: "tokens",
    title: "MCP tokens",
    description: "Issue scoped tokens for remote MCP clients; revoke anytime.",
    status: "planned_api" satisfies DashboardPanelStatus,
    bullets: ["No active tokens", "Bundle default: read_only (example)"],
  },
  {
    id: "usage",
    title: "Usage & limits",
    description: "Requests, concurrent sessions, and account counts vs plan.",
    status: "planned_api" satisfies DashboardPanelStatus,
    bullets: ["Daily requests: 0 / quota (placeholder)", "Concurrent MCP sessions: 0 / cap (placeholder)"],
  },
] as const;
