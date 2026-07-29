import { describe, expect, it } from "vitest";
import { HOSTED_PLAN_LIMITS, resolveHostedPlanLimits } from "../src/hosted/plans.js";
import type { HostedPlan } from "../src/hosted/types.js";

const ALL_PLANS: HostedPlan[] = ["free", "supporter", "pro"];

/**
 * Gateway-side mirror of apps/web/convex/lib/planLimits.ts. Supporter used to be
 * normalized to pro here too, so these assertions pin it as its own tier.
 */
describe("hosted plan limits", () => {
  it("resolves a distinct row for every hosted plan", () => {
    expect(Object.keys(HOSTED_PLAN_LIMITS).sort()).toEqual([...ALL_PLANS].sort());
  });

  it("resolves supporter to the supporter allowance, not pro", () => {
    expect(resolveHostedPlanLimits("supporter")).toEqual({
      maxWorkspaces: 1,
      maxAccounts: 3,
      dailyRequests: 5000,
      monthlyRequests: 100000,
      maxTokens: 10,
    });
    expect(resolveHostedPlanLimits("supporter")).not.toEqual(resolveHostedPlanLimits("pro"));
  });

  it("keeps free and pro unchanged", () => {
    expect(resolveHostedPlanLimits("free")).toEqual({
      maxWorkspaces: 1,
      maxAccounts: 1,
      dailyRequests: 250,
      monthlyRequests: 3000,
      maxTokens: 2,
    });
    expect(resolveHostedPlanLimits("pro")).toEqual({
      maxWorkspaces: 5,
      maxAccounts: 20,
      dailyRequests: 100000,
      monthlyRequests: 1000000,
      maxTokens: 50,
    });
  });

  it("exposes no session ceiling", () => {
    for (const plan of ALL_PLANS) {
      expect(resolveHostedPlanLimits(plan)).not.toHaveProperty("maxConcurrentSessions");
    }
  });
});
