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
    monthlyPrice: "$0",
    annualPrice: "$0",
    annualSavings: null,
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
    name: "Pro",
    monthlyPrice: "$20/mo",
    annualPrice: "$209/year",
    annualSavings: "Save $31/year",
    tagline: "Unlimited-scale operations with priority support.",
    limits: [
      "Up to 5 workspaces",
      "Up to 20 ManyChat accounts",
      "100,000 requests/day, 1,000,000 requests/month",
      "Up to 10 concurrent MCP sessions",
      "50 active MCP tokens",
      "Priority support and full audit history",
    ],
    cta: "Best for operators, marketers, and AI-heavy workflows",
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
