/**
 * Per-plan entitlement ceilings — the single copy the dashboard, the account and
 * token caps, and the gateway authorizer all read.
 *
 * Keyed by the exact `workspaces.plan` union, so a tier added to the schema
 * without limits of its own is a compile error rather than a silent fallback.
 * That is deliberate: the previous shape mapped "supporter" onto "pro" before
 * the lookup, which handed a $20 workspace the full $79 allowance.
 */
import type { WorkspacePlan } from "./subscriptionPlan.js";

export type PlanLimits = {
  maxAccounts: number;
  dailyRequests: number;
  monthlyRequests: number;
  maxTokens: number;
};

export const planLimits: Record<WorkspacePlan, PlanLimits> = {
  /** Evaluation: enough to wire an agent up and see it work. */
  free: {
    maxAccounts: 1,
    dailyRequests: 250,
    monthlyRequests: 3000,
    maxTokens: 2,
  },
  /** Enough headroom to run one brand's ManyChat every day. */
  supporter: {
    maxAccounts: 3,
    dailyRequests: 5000,
    monthlyRequests: 100000,
    maxTokens: 10,
  },
  /** Heavy, multi-account operation. */
  pro: {
    maxAccounts: 20,
    dailyRequests: 100000,
    monthlyRequests: 1000000,
    maxTokens: 50,
  },
};
