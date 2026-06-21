import { describe, it, expect } from "vitest";
import { validateOutboundMessage } from "../../src/policy/messaging-window.js";

const BEFORE_DEPRECATION = new Date("2026-01-01T00:00:00Z");
const AFTER_DEPRECATION = new Date("2026-03-01T00:00:00Z");

describe("validateOutboundMessage", () => {
  it("allows a messenger message within the 24h window", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 2 });
    expect(v.level).toBe("allow");
    expect(v.allowed).toBe(true);
    expect(v.findings).toHaveLength(0);
  });

  it("blocks outside the window with no tag", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 48 });
    expect(v.level).toBe("block");
    expect(v.allowed).toBe(false);
    expect(v.findings.map((f) => f.code)).toContain("OUTSIDE_WINDOW_NO_TAG");
  });

  it("treats unknown interaction time as outside the window", () => {
    const v = validateOutboundMessage({ channel: "messenger" });
    expect(v.allowed).toBe(false);
    expect(v.findings.map((f) => f.code)).toContain("OUTSIDE_WINDOW_NO_TAG");
  });

  it("blocks an invalid/unknown message tag", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 48, messageTag: "MADE_UP_TAG", now: BEFORE_DEPRECATION });
    expect(v.level).toBe("block");
    expect(v.findings.map((f) => f.code)).toContain("INVALID_TAG");
  });

  it("blocks promotional content under a non-promotional tag", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 48, messageTag: "ACCOUNT_UPDATE", promotional: true, now: BEFORE_DEPRECATION });
    expect(v.level).toBe("block");
    expect(v.findings.map((f) => f.code)).toContain("PROMO_UNDER_NONPROMO_TAG");
  });

  it("allows a valid non-promo tag outside the window before deprecation", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 48, messageTag: "CONFIRMED_EVENT_UPDATE", now: BEFORE_DEPRECATION });
    expect(v.allowed).toBe(true);
    expect(v.level).toBe("allow");
  });

  it("warns that standard tags are deprecated after 2026-02-10", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 48, messageTag: "CONFIRMED_EVENT_UPDATE", now: AFTER_DEPRECATION });
    expect(v.level).toBe("warn");
    expect(v.allowed).toBe(true);
    expect(v.findings.map((f) => f.code)).toContain("TAG_DEPRECATED");
  });

  it("allows HUMAN_AGENT within the 7-day window even after deprecation", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 100, messageTag: "HUMAN_AGENT", now: AFTER_DEPRECATION });
    expect(v.allowed).toBe(true);
    expect(v.level).toBe("allow");
  });

  it("blocks HUMAN_AGENT past the 7-day window", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 200, messageTag: "HUMAN_AGENT" });
    expect(v.level).toBe("block");
    expect(v.findings.map((f) => f.code)).toContain("HUMAN_AGENT_WINDOW_EXPIRED");
  });

  it("warns when WhatsApp is outside the window (template required, not modeled)", () => {
    const v = validateOutboundMessage({ channel: "whatsapp", hoursSinceLastInteraction: 48 });
    expect(v.findings.map((f) => f.code)).toContain("WA_TEMPLATE_REQUIRED");
  });

  it("warns when opt-in is explicitly missing", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 2, hasOptIn: false });
    expect(v.findings.map((f) => f.code)).toContain("MISSING_OPT_IN");
  });
});
