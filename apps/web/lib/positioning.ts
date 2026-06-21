import { docsLinks, pricingTiers, productSurfaces } from "./site-data-shared";

export const heroContent = {
  eyebrow: "Open-source · ManyChat MCP",
  title: "Give your AI agents ManyChat superpowers.",
  body:
    "An MCP that lets Claude, Cursor, and Codex operate your ManyChat — with a policy guard that stops them from breaking Meta's rules and getting your page flagged. Open-source. Bring your own API key.",
  primaryCta: "Install in 60 seconds",
  secondaryCta: "See the safety layer",
  railLabels: [
    "Claude",
    "Cursor",
    "Codex",
    "CLI",
    "MCP",
    "Self-host",
  ],
} as const;

export const buyerPainCards = [
  {
    title: "Raw API tools get accounts flagged",
    body:
      "An agent wired straight to the ManyChat API will happily message outside the 24-hour window. Meta flags the page, and the number that drives your revenue goes cold.",
  },
  {
    title: "Every other integration is a thin wrapper",
    body:
      "The existing ManyChat MCPs hand an agent naked tools with zero Meta-policy awareness, no structure, and no safety. Powerful and dangerous in the same breath.",
  },
  {
    title: "Connecting agents should take a minute",
    body:
      "Paste one snippet, install the skill, and your agent operates ManyChat correctly — validating every send against policy before it goes out.",
  },
] as const;

export const offerTiers: Array<{
  name: string;
  setupPrice: string | null;
  monthlyPrice: string | null;
  audience: string;
  bullets: string[];
  cta: string;
  badge?: string;
}> = [
  {
    name: "Builder OSS",
    setupPrice: null,
    monthlyPrice: null,
    audience: "Developers, operators, and internal agent workflows.",
    bullets: ["Open-source CLI", "MCP server", "Self-host docs", "Bring-your-own infra"],
    cta: "Use the OSS core",
  },
  {
    name: "Revenue Operator",
    setupPrice: "$3,500",
    monthlyPrice: "$750/mo",
    audience: "One business that needs faster response, cleaner handoff, and fewer lost leads.",
    bullets: ["1 workspace", "ManyChat rail", "WhatsApp handoff", "Reporting baseline"],
    cta: "Book Operator setup",
    badge: "Recommended",
  },
] as const;

export const ossStory = {
  title: "Builder OSS",
  body: "Keep the CLI and MCP broadly usable while the paid product sells the operating system around them.",
  bullets: ["CLI + MCP", docsLinks[1].title, "Community contributions"],
} as const;

export const operatorStory = {
  title: "Operator-first delivery",
  body:
    "The paid layer is not generic hosting. It is an implementation and accountability layer around real lead response, routing, and booked-conversation outcomes.",
  bullets: [productSurfaces[3].name, pricingTiers[1].name, docsLinks[3].title],
} as const;
