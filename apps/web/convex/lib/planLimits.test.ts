import { describe, expect, it } from "vitest";
import { planLimits, type PlanLimits } from "./planLimits.js";
import type { WorkspacePlan } from "./subscriptionPlan.js";

/**
 * Supporter used to be normalized to Pro before the limits lookup, which handed a
 * $20 workspace the $79 allowance and left the Pro tier with nothing to sell.
 * These tests exist so collapsing the tiers again fails the build.
 */
describe("plan limits", () => {
  const ALL_PLANS: WorkspacePlan[] = ["free", "supporter", "pro"];

  it("gives every workspace plan its own row", () => {
    expect(Object.keys(planLimits).sort()).toEqual([...ALL_PLANS].sort());
  });

  it("entitles supporter to the supporter allowance", () => {
    expect(planLimits.supporter).toEqual({
      maxAccounts: 3,
      dailyRequests: 5000,
      monthlyRequests: 100000,
      maxTokens: 10,
    });
  });

  it("never lets supporter inherit the pro allowance", () => {
    const fields: Array<keyof PlanLimits> = [
      "maxAccounts",
      "dailyRequests",
      "monthlyRequests",
      "maxTokens",
    ];
    for (const field of fields) {
      expect(planLimits.supporter[field]).toBeLessThan(planLimits.pro[field]);
      expect(planLimits.supporter[field]).toBeGreaterThan(planLimits.free[field]);
    }
  });

  it("keeps the free and pro allowances untouched", () => {
    expect(planLimits.free).toEqual({
      maxAccounts: 1,
      dailyRequests: 250,
      monthlyRequests: 3000,
      maxTokens: 2,
    });
    expect(planLimits.pro).toEqual({
      maxAccounts: 20,
      dailyRequests: 100000,
      monthlyRequests: 1000000,
      maxTokens: 50,
    });
  });

  it("carries no session ceiling — stateless serving has no sessions to cap", () => {
    for (const plan of ALL_PLANS) {
      expect(planLimits[plan]).not.toHaveProperty("maxConcurrentSessions");
    }
  });
});
