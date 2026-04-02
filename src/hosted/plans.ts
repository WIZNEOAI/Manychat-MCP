import type { HostedPlan, HostedPlanLimits } from "./types.js";

export const HOSTED_PLAN_LIMITS: Record<HostedPlan, HostedPlanLimits> = {
  free: {
    maxWorkspaces: 1,
    maxAccounts: 1,
    dailyRequests: 250,
    monthlyRequests: 3000,
    maxConcurrentSessions: 1,
    maxTokens: 2,
  },
  supporter: {
    maxWorkspaces: 1,
    maxAccounts: 3,
    dailyRequests: 10000,
    monthlyRequests: 100000,
    maxConcurrentSessions: 3,
    maxTokens: 10,
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
  return HOSTED_PLAN_LIMITS[plan];
}
