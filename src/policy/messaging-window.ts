import type {
  ManyChatChannel,
  OutboundMessageContext,
  PolicyFinding,
  PolicyLevel,
  PolicyVerdict,
} from "./types.js";

export type { OutboundMessageContext, PolicyVerdict, PolicyFinding, PolicyLevel } from "./types.js";

/** Standard window in hours for Messenger/Instagram. */
const STANDARD_WINDOW_HOURS = 24;
/** HUMAN_AGENT human-support window in hours (7 days). */
const HUMAN_AGENT_WINDOW_HOURS = 168;
/** Meta global Message Tags deprecation cutoff. */
export const TAG_DEPRECATION_DATE = new Date("2026-02-10T00:00:00Z");
/** Tags ManyChat/Meta accept outside the standard window. */
export const VALID_MESSAGE_TAGS = [
  "CONFIRMED_EVENT_UPDATE",
  "POST_PURCHASE_UPDATE",
  "ACCOUNT_UPDATE",
  "HUMAN_AGENT",
] as const;

const WINDOW_CHANNELS: ReadonlySet<ManyChatChannel> = new Set(["messenger", "instagram"]);

function worst(a: PolicyLevel, b: PolicyLevel): PolicyLevel {
  const order: PolicyLevel[] = ["allow", "warn", "block"];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

export function validateOutboundMessage(ctx: OutboundMessageContext): PolicyVerdict {
  const findings: PolicyFinding[] = [];
  const now = ctx.now ?? new Date();
  const hours = ctx.hoursSinceLastInteraction;
  const withinStandard = typeof hours === "number" && hours <= STANDARD_WINDOW_HOURS;
  const tag = ctx.messageTag;

  if (ctx.hasOptIn === false) {
    findings.push({
      code: "MISSING_OPT_IN",
      level: "warn",
      message: "Subscriber has no recorded opt-in; confirm consent before sending.",
      rule: "opt-in",
    });
  }

  if (ctx.channel === "whatsapp" && !withinStandard) {
    findings.push({
      code: "WA_TEMPLATE_REQUIRED",
      level: "warn",
      message: "WhatsApp outside the 24h window requires an approved template, not a message tag.",
      rule: "whatsapp-template",
    });
  }

  if (WINDOW_CHANNELS.has(ctx.channel) && !withinStandard) {
    if (!tag) {
      findings.push({
        code: "OUTSIDE_WINDOW_NO_TAG",
        level: "block",
        message: "Outside the 24h window with no message tag. Re-engage the subscriber or use a valid tag.",
        rule: "24h-window",
      });
    } else if (!VALID_MESSAGE_TAGS.includes(tag as (typeof VALID_MESSAGE_TAGS)[number])) {
      findings.push({
        code: "INVALID_TAG",
        level: "block",
        message: `Unknown message tag "${tag}". Valid tags: ${VALID_MESSAGE_TAGS.join(", ")}.`,
        rule: "message-tags",
      });
    } else if (tag === "HUMAN_AGENT") {
      if (typeof hours === "number" && hours > HUMAN_AGENT_WINDOW_HOURS) {
        findings.push({
          code: "HUMAN_AGENT_WINDOW_EXPIRED",
          level: "block",
          message: "HUMAN_AGENT only covers a 7-day (168h) human-support window, which has passed.",
          rule: "human-agent",
        });
      }
    } else {
      // valid standard tag
      if (ctx.promotional) {
        findings.push({
          code: "PROMO_UNDER_NONPROMO_TAG",
          level: "block",
          message: `Message tag "${tag}" must not carry promotional content. This violates Meta policy.`,
          rule: "tag-promotional",
        });
      }
      if (now >= TAG_DEPRECATION_DATE) {
        findings.push({
          code: "TAG_DEPRECATED",
          level: "warn",
          message: "Standard message tags are deprecated for Messenger after 2026-02-10. Prefer HUMAN_AGENT or re-engagement.",
          rule: "tag-deprecation",
        });
      }
    }
  }

  const level = findings.reduce<PolicyLevel>((acc, f) => worst(acc, f.level), "allow");
  return { level, allowed: level !== "block", findings };
}
