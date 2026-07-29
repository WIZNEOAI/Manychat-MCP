import { z } from "zod";

/**
 * The wire contract between this gateway and a hosted control plane.
 *
 * The gateway and the control plane ship from separate repositories and deploy
 * on separate cadences, so this file is the seam: types are *derived* from the
 * schemas rather than written alongside them, which makes it impossible for the
 * validator and the type to drift apart.
 *
 * See `docs/control-plane-contract.md` for the endpoint-level contract.
 */

export const HOSTED_PLANS = ["free", "supporter", "pro"] as const;
export const hostedPlanSchema = z.enum(HOSTED_PLANS);
export type HostedPlan = z.infer<typeof hostedPlanSchema>;

export const CAPABILITY_BUNDLES = [
  "read_only",
  "operator",
  "messaging_safe",
  "admin",
] as const;
export const capabilityBundleSchema = z.enum(CAPABILITY_BUNDLES);
export type CapabilityBundle = z.infer<typeof capabilityBundleSchema>;

export const hostedPlanLimitsSchema = z.object({
  maxAccounts: z.number(),
  dailyRequests: z.number(),
  monthlyRequests: z.number(),
  maxTokens: z.number(),
});
export type HostedPlanLimits = z.infer<typeof hostedPlanLimitsSchema>;

/**
 * Response body of `POST /api/internal/mcp/resolve`.
 *
 * Required fields are exactly the ones gateway code reads. Everything else the
 * control plane sends is declared optional on purpose: an unread field that is
 * typed as required is a latent crash — the type promises a value the gateway
 * never checked for. Marking them optional keeps the shape honest and forces
 * any future reader to handle absence.
 *
 * Unknown keys are stripped, not rejected, so the control plane can add fields
 * without a coordinated gateway release.
 *
 * Plan ceilings are enforced control-plane side (it answers 429 before the
 * gateway ever sees the session). `limits` travels for observability only —
 * this gateway must never treat it as the authority.
 */
export const hostedResolvedSessionSchema = z.object({
  workspaceId: z.string().min(1),
  tokenId: z.string().min(1),
  /** `null` / absent both mean "the workspace's default account". */
  accountId: z.string().nullable().optional(),
  apiKey: z.string().min(1),
  capabilityBundle: capabilityBundleSchema,

  workspaceName: z.string().optional(),
  accountName: z.string().optional(),
  plan: hostedPlanSchema.optional(),
  limits: hostedPlanLimitsSchema.optional(),
});
export type HostedResolvedSession = z.infer<typeof hostedResolvedSessionSchema>;

/**
 * Request body of `POST /api/internal/mcp/record`. Outbound only — the control
 * plane validates it on arrival, so there is nothing for the gateway to parse.
 */
export interface HostedGatewayEvent {
  tokenId: string;
  workspaceId: string;
  accountId?: string | null;
  type: "session_start" | "session_end" | "request" | "auth_failure";
  requestCount?: number;
  metadata?: Record<string, unknown>;
}
