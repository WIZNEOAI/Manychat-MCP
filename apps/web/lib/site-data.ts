export const supportedClients = [
  "Claude Desktop",
  "Claude Code",
  "Cursor",
  "Codex",
  "Other streamable HTTP MCP clients",
] as const;

export const launchStats = [
  { label: "Root tests", value: "40" },
  { label: "Web tests", value: "28" },
  { label: "Gateway modes", value: "3" },
] as const;

export const channelLanes = [
  {
    channel: "Instagram",
    trigger: "Comments, DMs, story replies",
    play: "Keyword capture, product quiz, MCP-assisted account audit, human handoff.",
  },
  {
    channel: "Messenger",
    trigger: "24h window + tagged follow-up",
    play: "Read segment, apply tag, route to a compliant flow, verify before send.",
  },
  {
    channel: "WhatsApp",
    trigger: "Approved opt-in + template paths",
    play: "Qualify lead, sync CRM context, escalate sales-ready conversations.",
  },
  {
    channel: "TikTok",
    trigger: "Lead intent from comments and profile traffic",
    play: "Bridge into ManyChat entry points, then hand to n8n and Gnosix CRM.",
  },
] as const;

export const automationPlays = [
  "Comment keyword to lead magnet",
  "Story reply to qualification",
  "Dormant lead reactivation",
  "Operator review before risky sends",
  "n8n handoff for WhatsApp, CRM, and reporting",
] as const;


export { docsLinks, pricingTiers, productSurfaces } from "./site-data-shared";

export const dashboardRoadmap = [
  "Encrypted ManyChat vault with one-way save and key rotation",
  "Hosted MCP tokens with one-time reveal and revocation",
  "Workspace usage meters for daily and monthly limits",
  "Capability bundles for read_only, operator, messaging_safe, and admin",
  "Client snippets for Claude Code, Cursor, Codex, and Claude Desktop",
  "Pro upgrade path with monthly and annual billing options",
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
    hosted: "Free + Pro tiers for convenience, limits, and support",
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

export {
  buyerPainCards,
  heroContent,
  offerTiers,
  operatorStory,
  ossStory,
} from "./positioning";
