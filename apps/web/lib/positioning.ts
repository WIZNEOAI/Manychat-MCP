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

// Single pricing source: derive the landing offer cards from the canonical
// SaaS tiers (Free / Supporter / Pro) so the landing, dashboard, and docs never
// drift from the prices Stripe actually charges.
export type OfferTier = {
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  audience: string;
  bullets: readonly string[];
  cta: string;
  badge?: string;
};

export const offerTiers: readonly OfferTier[] = pricingTiers.map((tier) => ({
  name: tier.name,
  monthlyPrice: tier.monthlyPrice,
  annualPrice: tier.annualPrice,
  audience: tier.tagline,
  bullets: tier.limits,
  cta: tier.cta,
  badge: tier.name === "Supporter" ? "Recommended" : undefined,
}));

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

// Done-for-you managed service (Revenue Operator). The CTA points at the live
// Stripe payment link; paying redirects to the kickoff booking. Public URL, not a secret.
export const doneForYou = {
  eyebrow: "Done-for-you · Revenue Operator",
  title: "Don't want to run it? We operate your revenue for you.",
  price: "$3,500",
  cadence: "/mo",
  body:
    "Fully managed, month-to-month. We build and run the agents that operate your social and business — ManyChat automated and policy-safe, with the rest of your stack wired in. You configure nothing.",
  includes: [
    "Kickoff session — we map your funnel, accounts, and goals",
    "We build and run the agents — hands-off for you",
    "ManyChat automated, policy-safe: capture → qualify → nurture → recover",
    "Multi-connector via Composio: DMs, email, CRM, calendar",
    "Voice and content where it moves the number",
    "Hosted Pro included: vault, tokens, multi-workspace, full audit",
    "Weekly optimization, monthly report, and a direct support line",
  ],
  cta: "Start — $3,500/mo",
  ctaHref: "https://buy.stripe.com/9B6eVcfLOcl22jI9fkbbG0a",
  note: "Pay and book your kickoff call in the same flow. Cancel anytime.",
} as const;
