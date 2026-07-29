import { describe, expect, it } from "vitest";
import { pricingTiers } from "./site-data-shared";
import { planLimits } from "../convex/lib/planLimits";
import type { WorkspacePlan } from "../convex/lib/subscriptionPlan";

/**
 * The landing must not advertise a ceiling the control plane does not enforce.
 * Each pricing card is checked against the row the gateway actually reads, so a
 * copy edit that invents headroom — or a limits edit that quietly shrinks it —
 * fails here instead of in a customer's dashboard.
 */
const TIER_PLAN: Record<string, WorkspacePlan> = {
  Free: "free",
  Supporter: "supporter",
  Pro: "pro",
};

const n = (value: number) => value.toLocaleString("en-US");

describe("pricing copy matches enforced plan limits", () => {
  it("covers every advertised tier", () => {
    expect(pricingTiers.map((tier) => tier.name)).toEqual(["Free", "Supporter", "Pro"]);
  });

  for (const tier of pricingTiers) {
    const limits = planLimits[TIER_PLAN[tier.name]];

    it(`states the real request ceiling for ${tier.name}`, () => {
      expect(tier.limits).toContain(
        `${n(limits.dailyRequests)} requests/day, ${n(limits.monthlyRequests)} requests/month`,
      );
    });

    it(`states the real account and token ceilings for ${tier.name}`, () => {
      const accounts = tier.limits.find((line) => /ManyChat account/i.test(line));
      expect(accounts).toContain(String(limits.maxAccounts));
      expect(tier.limits).toContain(`${limits.maxTokens} active MCP tokens`);
    });

    it(`advertises no session ceiling for ${tier.name}`, () => {
      for (const line of tier.limits) {
        expect(line).not.toMatch(/concurren/i);
        expect(line).not.toMatch(/session/i);
      }
    });

    it(`advertises no unquantified "fair use" headroom for ${tier.name}`, () => {
      for (const line of tier.limits) {
        expect(line).not.toMatch(/fair use/i);
      }
    });

    /**
     * Workspaces are not a sold dimension. `users.ensureCurrentUser` mints one
     * "Personal" workspace per owner and only when they have none — there is no
     * second-workspace path to cap, so "Up to 5 workspaces" was copy the product
     * could not honour rather than a ceiling anyone could hit.
     */
    it(`advertises no workspace ceiling for ${tier.name}`, () => {
      for (const line of tier.limits) {
        expect(line).not.toMatch(/workspace/i);
      }
    });
  }

  it("keeps Supporter strictly below Pro on the landing, not just in code", () => {
    const supporter = pricingTiers.find((tier) => tier.name === "Supporter")!;
    const pro = pricingTiers.find((tier) => tier.name === "Pro")!;
    expect(supporter.limits).not.toEqual(pro.limits);
    expect(planLimits.supporter.dailyRequests).toBeLessThan(planLimits.pro.dailyRequests);
  });
});
