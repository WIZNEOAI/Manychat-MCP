import type { HostedPlan, HostedPlanLimits } from "./types.js";

/** Normalize legacy "supporter" rows to "pro". */
export function normalizePlan(plan: HostedPlan): "free" | "pro" {
  return plan === "supporter" ? "pro" : plan;
}

export const HOSTED_PLAN_LIMITS: Record<"free" | "pro", HostedPlanLimits> = {
  free: {
    maxWorkspaces: 1,
    maxAccounts: 1,
    dailyRequests: 250,
    monthlyRequests: 3000,
    maxConcurrentSessions: 1,
    maxTokens: 2,
  },
  pro: {
    maxWorkspaces: 5,
    maxAccounts: 20,
    dailyRequests: 100000,
    monthlyRequests: 1000000,
    maxConcurrentSessions: 10,
    maxTokens: 50,
  },
};

export function resolveHostedPlanLimits(plan: HostedPlan): HostedPlanLimits {
  return HOSTED_PLAN_LIMITS[normalizePlan(plan)];
}
