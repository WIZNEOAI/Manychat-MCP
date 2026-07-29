import type { HostedPlan, HostedPlanLimits } from "./types.js";

/**
 * Gateway-side mirror of the control-plane ceilings in
 * `apps/web/convex/lib/planLimits.ts`. Every hosted plan gets its own row —
 * indexing is total over `HostedPlan`, so a new tier cannot silently inherit
 * another tier's allowance.
 *
 * Field-for-field identical to the control-plane row on purpose: the resolve
 * payload is cast, not parsed, so a key here that the control plane never sends
 * is `undefined` at runtime while the type claims a number. Add a ceiling here
 * only once the control plane both sends and enforces it.
 */
export const HOSTED_PLAN_LIMITS: Record<HostedPlan, HostedPlanLimits> = {
  free: {
    maxAccounts: 1,
    dailyRequests: 250,
    monthlyRequests: 3000,
    maxTokens: 2,
  },
  supporter: {
    maxAccounts: 3,
    dailyRequests: 5000,
    monthlyRequests: 100000,
    maxTokens: 10,
  },
  pro: {
    maxAccounts: 20,
    dailyRequests: 100000,
    monthlyRequests: 1000000,
    maxTokens: 50,
  },
};

export function resolveHostedPlanLimits(plan: HostedPlan): HostedPlanLimits {
  return HOSTED_PLAN_LIMITS[plan];
}
