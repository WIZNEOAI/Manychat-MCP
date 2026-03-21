export const supportedClients = [
  "Claude",
  "Claude Code",
  "Cursor",
  "Codex",
  "Antigravity",
  "other streamable HTTP MCP clients",
] as const;

export const productSurfaces = [
  {
    name: "CLI",
    status: "Primary",
    description:
      "The source of truth for deterministic ManyChat execution, automation, and JSON-first operator workflows.",
  },
  {
    name: "Local MCP",
    status: "Supported",
    description:
      "Stdio transport for local coding-agent setups that want MCP compatibility without changing the execution model.",
  },
  {
    name: "Remote MCP",
    status: "Supported",
    description:
      "Self-hosted HTTP MCP for remote clients, Railway deploys, and VPS setups that need a stable public endpoint.",
  },
  {
    name: "Web control plane",
    status: "Scaffolded",
    description:
      "Landing, docs, and future dashboard shell for onboarding, API key vaulting, token issuance, and billing.",
  },
] as const;

export const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    tagline: "Try the hosted model with safe limits.",
    limits: [
      "1 workspace",
      "1 ManyChat account connection",
      "daily request allowance",
      "1 concurrent remote client",
      "community support",
    ],
  },
  {
    name: "Supporter",
    price: "$20/mo",
    tagline: "Unlimited personal usage under fair-use, plus open-source support.",
    limits: [
      "unlimited individual usage under fair-use",
      "up to 3 ManyChat accounts",
      "up to 3 concurrent remote clients",
      "priority support",
      "supports the OSS core",
    ],
  },
  {
    name: "Pro",
    price: "Planned",
    tagline: "More accounts, more concurrency, and team workflows.",
    limits: [
      "more ManyChat accounts per workspace",
      "higher concurrency caps",
      "team members and audit logs",
      "usage insights and billing controls",
      "capability-bundle policy controls",
    ],
  },
] as const;

export const dashboardRoadmap = [
  "Save a ManyChat API key per workspace",
  "Issue remote MCP tokens for supported clients",
  "Copy client-specific snippets for Claude, Cursor, Codex, and Antigravity",
  "Inspect enabled capability bundles before exposing write tools",
  "Track usage, concurrency, and billing limits by plan",
] as const;

export const docsLinks = [
  {
    title: "Deploy on Railway",
    href: "/docs#railway",
    description: "Explicit HTTP MCP startup, health checks, and production-mode guidance.",
  },
  {
    title: "Deploy on VPS + Docker",
    href: "/docs#vps-docker",
    description: "Container-first self-host setup with reverse proxy and TLS notes.",
  },
  {
    title: "Connect MCP clients",
    href: "/docs#clients",
    description: "Client setup notes for Claude, Cursor, Codex, and Claude Desktop.",
  },
] as const;
