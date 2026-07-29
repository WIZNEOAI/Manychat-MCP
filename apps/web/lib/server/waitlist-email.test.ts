import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { __emailInternals, sendWaitlistConfirmation } from "./waitlist-email";

const { buildHtml, buildText } = __emailInternals;

describe("waitlist confirmation markup", () => {
  it("greets by name when one was captured", () => {
    expect(buildHtml("Ulises")).toContain("Hola Ulises,");
    expect(buildText("Ulises")).toContain("Hola Ulises,");
  });

  it("falls back to a bare greeting without a name", () => {
    expect(buildHtml()).toContain("Hola,");
    expect(buildText()).toContain("Hola,");
  });

  it("escapes operator-supplied names instead of injecting markup", () => {
    const html = buildHtml('<img src=x onerror="alert(1)">');
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("carries the required non-affiliation disclaimer in both parts", () => {
    expect(buildHtml()).toContain("No afiliado a ManyChat.");
    expect(buildText()).toContain("No afiliado a ManyChat.");
  });

  it("keeps the plain-text part in sync with the HTML rails and CTA", () => {
    const html = buildHtml();
    const text = buildText();
    for (const rail of [
      "Un solo server entre tus agentes y ManyChat.",
      "La política de mensajería de Meta, validada antes de enviar.",
    ]) {
      expect(html).toContain(rail);
      expect(text).toContain(rail);
    }
    expect(text).toContain("/docs");
  });

  it("styles inline only — no class attributes a mail client would drop", () => {
    expect(buildHtml("Ulises")).not.toMatch(/\sclass=/);
  });

  it("declares a dark color scheme so clients skip their inversion pass", () => {
    expect(buildHtml()).toContain('name="color-scheme" content="dark"');
  });
});

describe("sendWaitlistConfirmation", () => {
  const originalResend = process.env.RESEND_API_KEY;
  const originalWizneo = process.env.RESEND_WIZNEO_API_KEY;

  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_WIZNEO_API_KEY;
  });

  afterEach(() => {
    if (originalResend === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalResend;
    if (originalWizneo === undefined) delete process.env.RESEND_WIZNEO_API_KEY;
    else process.env.RESEND_WIZNEO_API_KEY = originalWizneo;
  });

  it("reports the failure instead of throwing when no API key is configured", async () => {
    await expect(sendWaitlistConfirmation("lead@example.com")).resolves.toEqual({
      sent: false,
      reason: "missing_api_key",
    });
  });
});
