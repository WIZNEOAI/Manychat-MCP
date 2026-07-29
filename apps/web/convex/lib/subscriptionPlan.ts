/**
 * Pure derivation of a workspace plan from a Stripe subscription event.
 *
 * Kept free of Convex context so the billing rules that decide whether someone
 * keeps paid access can be unit-tested against hand-written webhook payloads,
 * with no Stripe account and no deployment in the loop.
 */
import { resolvePaidTier } from "./stripeTiers.js";

export type WorkspacePlan = "free" | "supporter" | "pro";

export type SubscriptionEventObject = {
  metadata?: Record<string, string> | null;
  status: string;
  customer: string | { id?: string } | null;
  items?: { data?: Array<{ price?: { id?: string | null } | null } | null> } | null;
};

/**
 * Subscription statuses that grant paid entitlement. Everything Stripe can
 * report outside this set — past_due, unpaid, incomplete, incomplete_expired,
 * canceled, paused — falls back to free, so a lapsed card revokes access
 * instead of silently extending it.
 */
const ENTITLED_STATUSES: ReadonlySet<string> = new Set(["active", "trialing"]);

export function isEntitledStatus(status: string): boolean {
  return ENTITLED_STATUSES.has(status);
}

/** Stripe sends `customer` either expanded or as a bare id depending on the event. */
export function customerIdFromSubscription(
  sub: Pick<SubscriptionEventObject, "customer">,
): string | undefined {
  if (typeof sub.customer === "string") {
    return sub.customer;
  }
  if (sub.customer && typeof sub.customer === "object" && "id" in sub.customer && sub.customer.id) {
    return sub.customer.id;
  }
  return undefined;
}

export type PlanSyncInstruction = {
  workspaceIdString: string;
  plan: WorkspacePlan;
  stripeCustomerId?: string;
};

/**
 * Translate a created/updated subscription event into the patch to apply, or
 * null when the event carries no workspace id (a subscription created outside
 * our checkout — never guess which workspace it belongs to).
 */
export function planSyncFromSubscription(
  sub: SubscriptionEventObject,
): PlanSyncInstruction | null {
  const workspaceId = sub.metadata?.workspaceId;
  if (!workspaceId || typeof workspaceId !== "string") {
    return null;
  }

  const plan: WorkspacePlan = isEntitledStatus(sub.status)
    ? resolvePaidTier({
        priceId: sub.items?.data?.[0]?.price?.id,
        metadataTier: sub.metadata?.tier,
      })
    : "free";

  const stripeCustomerId = customerIdFromSubscription(sub);
  return {
    workspaceIdString: workspaceId,
    plan,
    ...(stripeCustomerId ? { stripeCustomerId } : {}),
  };
}

/** A deleted subscription always drops the workspace to free. */
export function planSyncFromDeletedSubscription(
  sub: Pick<SubscriptionEventObject, "metadata">,
): PlanSyncInstruction | null {
  const workspaceId = sub.metadata?.workspaceId;
  if (!workspaceId || typeof workspaceId !== "string") {
    return null;
  }
  return { workspaceIdString: workspaceId, plan: "free" };
}
