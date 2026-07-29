import type { HostedPlan, HostedPlanLimits } from "./types.js";

/**
 * Gateway-side mirror of the control-plane ceilings in
 * `apps/web/convex/lib/planLimits.ts`. Every hosted plan gets its own row —
 * indexing is total over `HostedPlan`, so a new tier cannot silently inherit
 * another tier's allowance.
 */
export const HOSTED_PLAN_LIMITS: Record<HostedPlan, HostedPlanLimits> = {
  free: {
    maxWorkspaces: 1,
    maxAccounts: 1,
    dailyRequests: 250,
    monthlyRequests: 3000,
    maxTokens: 2,
  },
  supporter: {
    maxWorkspaces: 1,
    maxAccounts: 3,
    dailyRequests: 5000,
    monthlyRequests: 100000,
    maxTokens: 10,
  },
  pro: {
    maxWorkspaces: 5,
    maxAccounts: 20,
    dailyRequests: 100000,
    monthlyRequests: 1000000,
    maxTokens: 50,
  },
};

export function resolveHostedPlanLimits(plan: HostedPlan): HostedPlanLimits {
  return HOSTED_PLAN_LIMITS[plan];
}
