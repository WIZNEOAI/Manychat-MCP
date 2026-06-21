import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getPriceId, getTierFromPriceId } from "./stripeTiers.js";

const ENV_KEYS = [
  "STRIPE_SUPPORTER_MONTHLY_PRICE_ID",
  "STRIPE_SUPPORTER_ANNUAL_PRICE_ID",
  "STRIPE_PRO_MONTHLY_PRICE_ID",
  "STRIPE_PRO_ANNUAL_PRICE_ID",
];

describe("stripeTiers", () => {
  beforeEach(() => {
    process.env.STRIPE_SUPPORTER_MONTHLY_PRICE_ID = "price_sup_m";
    process.env.STRIPE_SUPPORTER_ANNUAL_PRICE_ID = "price_sup_y";
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID = "price_pro_m";
    process.env.STRIPE_PRO_ANNUAL_PRICE_ID = "price_pro_y";
  });
  afterEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
  });

  it("resolves a price id for each tier + interval", () => {
    expect(getPriceId("supporter", "monthly")).toBe("price_sup_m");
    expect(getPriceId("supporter", "annual")).toBe("price_sup_y");
    expect(getPriceId("pro", "monthly")).toBe("price_pro_m");
    expect(getPriceId("pro", "annual")).toBe("price_pro_y");
  });

  it("throws a clear error when a price env var is missing", () => {
    delete process.env.STRIPE_PRO_ANNUAL_PRICE_ID;
    expect(() => getPriceId("pro", "annual")).toThrow(/STRIPE_PRO_ANNUAL_PRICE_ID/);
  });

  it("reverse-maps a price id to its tier", () => {
    expect(getTierFromPriceId("price_sup_m")).toBe("supporter");
    expect(getTierFromPriceId("price_sup_y")).toBe("supporter");
    expect(getTierFromPriceId("price_pro_m")).toBe("pro");
    expect(getTierFromPriceId("price_pro_y")).toBe("pro");
  });

  it("returns null for an unknown price id", () => {
    expect(getTierFromPriceId("price_unknown")).toBeNull();
  });
});
