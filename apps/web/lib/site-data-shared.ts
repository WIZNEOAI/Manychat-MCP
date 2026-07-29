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
    // No "no credit card" / "start free" framing while hosted access is closed:
    // the only public entry is the waitlist. Restore the immediate-signup copy
    // when Convex prod exists (not `dusty-lobster-832`) and `/dashboard` is 200.
    tagline: "Safe daily limits for evaluation, from the day hosted access opens.",
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
    monthlyPrice: "$20/mo",
    annualPrice: "$209/year",
    annualSavings: "Save $31/year",
    tagline: "Serious individual usage — and you sustain the open-source core.",
    limits: [
      "1 workspace",
      "Up to 3 connected ManyChat accounts",
      "High request limits under fair use",
      "Up to 3 concurrent MCP sessions",
      "OAuth connect for Claude, Cursor, and Codex",
      "Priority support",
    ],
    cta: "Best for builders running agents on ManyChat every day",
  },
  {
    name: "Pro",
    monthlyPrice: "$79/mo",
    annualPrice: "$790/year",
    annualSavings: "Save $158/year",
    tagline: "Multi-brand scale with team controls and full audit.",
    limits: [
      "Up to 5 workspaces",
      "Up to 20 ManyChat accounts",
      "Highest request and concurrency limits",
      "Up to 10 concurrent MCP sessions",
      "Team seats and permissions",
      "Full audit history",
    ],
    cta: "Best for agencies and multi-brand operators",
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
