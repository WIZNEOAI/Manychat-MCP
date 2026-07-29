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
      maxAccounts: 3,
      dailyRequests: 5000,
      monthlyRequests: 100000,
      maxTokens: 10,
    });
    expect(resolveHostedPlanLimits("supporter")).not.toEqual(resolveHostedPlanLimits("pro"));
  });

  it("keeps free and pro unchanged", () => {
    expect(resolveHostedPlanLimits("free")).toEqual({
      maxAccounts: 1,
      dailyRequests: 250,
      monthlyRequests: 3000,
      maxTokens: 2,
    });
    expect(resolveHostedPlanLimits("pro")).toEqual({
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

  /**
   * There is no create-workspace path: `users.ensureCurrentUser` mints exactly one
   * "Personal" workspace and only when the owner has none, so a workspace ceiling
   * has nothing to guard. The control plane's resolve payload never carried the
   * field either, which made it `undefined` behind a `number` type.
   */
  it("exposes no workspace ceiling", () => {
    for (const plan of ALL_PLANS) {
      expect(resolveHostedPlanLimits(plan)).not.toHaveProperty("maxWorkspaces");
    }
  });

  /** The gateway row must stay field-for-field what the control plane sends. */
  it("carries exactly the four enforced ceilings", () => {
    for (const plan of ALL_PLANS) {
      expect(Object.keys(resolveHostedPlanLimits(plan)).sort()).toEqual([
        "dailyRequests",
        "maxAccounts",
        "maxTokens",
        "monthlyRequests",
      ]);
    }
  });
});
