export const supportedClients = [
  "Claude Desktop",
  "Claude Code",
  "Cursor",
  "Codex",
  "Other streamable HTTP MCP clients",
] as const;

export const productSurfaces = [
  {
    name: "CLI",
    status: "Primary",
    description:
      "Deterministic ManyChat operations: JSON on stdout, stable exit codes, and the command tree agents already rely on.",
  },
  {
    name: "Local MCP (stdio)",
    status: "Supported",
    description:
      "Drop-in MCP transport for coding agents on your machine. Same execution layer as the CLI and no extra hosted dependency.",
  },
  {
    name: "Remote MCP (HTTP)",
    status: "Supported",
    description:
      "Production HTTP endpoint for Railway, Docker, or a VPS. Hosted mode adds product tokens, quotas, and routing on top.",
  },
  {
    name: "Hosted dashboard",
    status: "Beta",
    description:
      "Sign in, store ManyChat keys securely, issue MCP tokens, inspect usage, and copy client snippets without changing the OSS runtime.",
  },
] as const;

export const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    tagline: "Try hosted MCP with safe daily limits and no credit card.",
    limits: [
      "1 workspace",
      "1 connected ManyChat account",
      "250 requests/day, 3,000 requests/month",
      "1 concurrent MCP session",
      "2 active MCP tokens",
      "Community support",
    ],
    cta: "Best for evaluation and light personal usage",
  },
  {
    name: "Supporter",
    price: "$20/mo",
    tagline: "Serious individual usage under fair-use, plus support for the OSS core.",
    limits: [
      "1 workspace",
      "Up to 3 ManyChat accounts",
      "10,000 requests/day, 100,000 requests/month",
      "Up to 3 concurrent MCP sessions",
      "10 active MCP tokens",
      "Priority support and basic audit history",
    ],
    cta: "Best for operators, marketers, and AI-heavy workflows",
  },
] as const;

export const dashboardRoadmap = [
  "Encrypted ManyChat vault with one-way save and key rotation",
  "Hosted MCP tokens with one-time reveal and revocation",
  "Workspace usage meters for daily and monthly limits",
  "Capability bundles for read_only, operator, messaging_safe, and admin",
  "Client snippets for Claude Code, Cursor, Codex, and Claude Desktop",
  "Manual Pro upgrade path for agencies and team governance",
] as const;

export const selfHostVsHosted = [
  {
    dimension: "Who runs the MCP server",
    selfHost: "You (local, Railway, Docker, VPS)",
    hosted: "We run the MCP endpoint and product token layer",
  },
  {
    dimension: "ManyChat API key",
    selfHost: "Your env or X-ManyChat-API-Key",
    hosted: "Stored encrypted per workspace and injected server-side",
  },
  {
    dimension: "Client credential",
    selfHost: "Usually the same ManyChat key or your own proxy rules",
    hosted: "Workspace-scoped MCP product token",
  },
  {
    dimension: "Billing",
    selfHost: "Free OSS and your infra only",
    hosted: "Free + Supporter tiers for convenience, limits, and support",
  },
] as const;

export const credentialLanes = [
  {
    title: "ManyChat API key",
    subtitle: "Execution credential",
    body: "Required to call the ManyChat Account Public API. In OSS you set MANYCHAT_API_KEY or pass a header. In hosted, it lives in the encrypted vault and never goes back to the MCP client.",
  },
  {
    title: "Dashboard login",
    subtitle: "Human control plane",
    body: "Owners manage workspaces, connected accounts, billing, and token issuance. It is not used by the CLI self-host path.",
  },
  {
    title: "Hosted MCP token",
    subtitle: "Product credential",
    body: "What Claude, Cursor, Codex, and similar clients send to the hosted MCP endpoint. It maps to a workspace, enforces limits, and keeps ManyChat keys off laptops.",
  },
] as const;

export const executionFlowSteps = [
  {
    step: "01",
    title: "Pick your surface",
    body: "Use the CLI for automation, stdio MCP for local agents, HTTP MCP for self-hosted remote access, or the hosted control plane when you want vaulting and product tokens.",
  },
  {
    step: "02",
    title: "Attach the ManyChat key",
    body: "OSS uses environment variables or headers. Hosted asks for the key once, encrypts it at rest, and injects it server-side when the MCP gateway runs.",
  },
  {
    step: "03",
    title: "Operate with guardrails",
    body: "Read before write, verify after mutations, respect messaging windows, and keep stdout machine-readable for agents and automation.",
  },
] as const;

export const docsLinks = [
  {
    title: "Deploy on Railway",
    href: "/docs#railway",
    description: "Explicit HTTP MCP startup, hosted_token mode, and production env guidance.",
  },
  {
    title: "Deploy on VPS + Docker",
    href: "/docs#vps-docker",
    description: "Container layout, TLS, and when Redis is still relevant for OAuth.",
  },
  {
    title: "Connect MCP clients",
    href: "/docs#clients",
    description: "Claude, Cursor, Codex, and hosted bearer-token snippets.",
  },
  {
    title: "Hosted control plane",
    href: "/docs#product",
    description: "Workspaces, vault, tokens, usage, and plan limits.",
  },
] as const;

export const docsSections = [
  {
    id: "overview",
    title: "Overview",
    body: "This project is CLI-first: the command surface and JSON contracts remain the source of truth. MCP adds compatibility and remote access, while the web app is the control plane and onboarding layer.",
    path: "README.md",
  },
  {
    id: "railway",
    title: "Deploy on Railway",
    body: "Use the explicit production command npm run start:mcp:http, honor PORT, expose GET /health and POST /mcp, and choose between manychat_header, hosted_token, or OAuth modes intentionally.",
    path: "docs/deploy/railway.md",
  },
  {
    id: "vps-docker",
    title: "Deploy on VPS + Docker",
    body: "Run the same HTTP MCP entrypoint in a container, terminate TLS at a reverse proxy, and keep OAuth + Redis only for clients that truly need remote OAuth compatibility.",
    path: "docs/deploy/vps-docker.md",
  },
  {
    id: "clients",
    title: "Connect MCP clients",
    body: "Wire Claude, Cursor, Codex, and Claude Desktop to streamable HTTP MCP. Hosted bearer tokens become the product credential; ManyChat API keys remain the execution credential.",
    path: "docs/connect/mcp-clients.md",
  },
  {
    id: "product",
    title: "Hosted control plane",
    body: "Workspaces, encrypted ManyChat vault, MCP tokens, usage, and pricing intent for the hosted control plane.",
    path: "docs/product/hosted-control-plane.md",
    extraPaths: [
      "docs/product/pricing-tiers.md",
      "docs/product/control-plane-contracts.md",
      "docs/product/action-plan-convex-clerk-stripe.md",
    ],
  },
] as const;
