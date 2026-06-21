import { docsLinks, pricingTiers, productSurfaces } from "./site-data-shared";

export const heroContent = {
  eyebrow: "Revenue Operator System",
  title: "Your leads already exist. The problem is what happens after.",
  body:
    "We build an AI Revenue Ops System so your social, chat, and ad leads do not go cold, get routed correctly, and turn into real booked conversations.",
  primaryCta: "Book strategy call",
  secondaryCta: "See how the system works",
  railLabels: [
    "ManyChat",
    "WhatsApp / Capso",
    "n8n",
    "Meta Ads",
    "Google Ads",
    "Human Handoff",
  ],
} as const;

export const buyerPainCards = [
  {
    title: "Lead response dies in the gap",
    body:
      "Clicks and DMs come in, but nobody owns the first five minutes, so high-intent leads sit too long and the conversation cools off.",
  },
  {
    title: "Channels break the handoff",
    body:
      "ManyChat, WhatsApp, forms, and ad campaigns each do part of the job, but the follow-up logic and reporting live in different places.",
  },
  {
    title: "Operators cannot trust the system",
    body:
      "Without clear routing, guardrails, and human takeover points, teams either spam too early or miss qualified buyers entirely.",
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
