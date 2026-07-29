import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  customerIdFromSubscription,
  isEntitledStatus,
  planSyncFromDeletedSubscription,
  planSyncFromSubscription,
  type SubscriptionEventObject,
} from "./subscriptionPlan.js";

/**
 * Price ids mirror the Stripe TEST ladder wired into Convex env vars.
 * Supporter $20/mo · $209/yr — Pro $79/mo · $790/yr.
 */
const SUPPORTER_MONTHLY = "price_1TkoIiCOsXH9DRgP0tM75GN3";
const SUPPORTER_ANNUAL = "price_1TkoIiCOsXH9DRgPDFSFK5RS";
const PRO_MONTHLY = "price_1TkoIiCOsXH9DRgPq4SNbx82";
const PRO_ANNUAL = "price_1TkoIjCOsXH9DRgPcKfY2fEV";

const WORKSPACE = "k171phw6mmxv553x3tbs59gp098bezbk";
const CUSTOMER = "cus_UyQEq3bsrGADVF";

const ENV_KEYS = [
  "STRIPE_SUPPORTER_MONTHLY_PRICE_ID",
  "STRIPE_SUPPORTER_ANNUAL_PRICE_ID",
  "STRIPE_PRO_MONTHLY_PRICE_ID",
  "STRIPE_PRO_ANNUAL_PRICE_ID",
];

/** Build the subscription shape Stripe puts in `event.data.object`. */
function subscriptionEvent(
  overrides: Partial<SubscriptionEventObject> & { priceId?: string | null } = {},
): SubscriptionEventObject {
  const { priceId, ...rest } = overrides;
  return {
    status: "active",
    customer: CUSTOMER,
    metadata: { workspaceId: WORKSPACE, tier: "pro", clerkUserId: "user_probe" },
    items: { data: [{ price: { id: priceId ?? PRO_MONTHLY } }] },
    ...rest,
  };
}

describe("subscriptionPlan", () => {
  beforeEach(() => {
    process.env.STRIPE_SUPPORTER_MONTHLY_PRICE_ID = SUPPORTER_MONTHLY;
    process.env.STRIPE_SUPPORTER_ANNUAL_PRICE_ID = SUPPORTER_ANNUAL;
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID = PRO_MONTHLY;
    process.env.STRIPE_PRO_ANNUAL_PRICE_ID = PRO_ANNUAL;
  });
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  describe("entitled statuses", () => {
    it("grants access while active or trialing", () => {
      expect(isEntitledStatus("active")).toBe(true);
      expect(isEntitledStatus("trialing")).toBe(true);
    });

    // Each of these is a way a card can stop working. None may keep paid access.
    it.each([
      "past_due",
      "unpaid",
      "incomplete",
      "incomplete_expired",
      "canceled",
      "paused",
    ])("revokes access on %s", (status) => {
      expect(isEntitledStatus(status)).toBe(false);
    });
  });

  describe("planSyncFromSubscription", () => {
    it("maps each paid price to its tier", () => {
      expect(planSyncFromSubscription(subscriptionEvent({ priceId: SUPPORTER_MONTHLY }))?.plan).toBe(
        "supporter",
      );
      expect(planSyncFromSubscription(subscriptionEvent({ priceId: SUPPORTER_ANNUAL }))?.plan).toBe(
        "supporter",
      );
      expect(planSyncFromSubscription(subscriptionEvent({ priceId: PRO_MONTHLY }))?.plan).toBe("pro");
      expect(planSyncFromSubscription(subscriptionEvent({ priceId: PRO_ANNUAL }))?.plan).toBe("pro");
    });

    it("prefers the price id over the metadata tier", () => {
      // A subscription whose price says supporter must not be upgraded to pro
      // just because checkout metadata claimed pro.
      const event = subscriptionEvent({
        priceId: SUPPORTER_MONTHLY,
        metadata: { workspaceId: WORKSPACE, tier: "pro" },
      });
      expect(planSyncFromSubscription(event)?.plan).toBe("supporter");
    });

    it("falls back to the metadata tier when the price is unmapped", () => {
      const event = subscriptionEvent({
        priceId: "price_not_ours",
        metadata: { workspaceId: WORKSPACE, tier: "pro" },
      });
      expect(planSyncFromSubscription(event)?.plan).toBe("pro");
    });

    it("never over-grants when nothing resolves", () => {
      const event = subscriptionEvent({
        priceId: "price_not_ours",
        metadata: { workspaceId: WORKSPACE },
      });
      expect(planSyncFromSubscription(event)?.plan).toBe("supporter");
    });

    it("grants the paid tier during a trial", () => {
      const event = subscriptionEvent({ status: "trialing", priceId: PRO_MONTHLY });
      expect(planSyncFromSubscription(event)?.plan).toBe("pro");
    });

    it.each([
      "past_due",
      "unpaid",
      "incomplete",
      "incomplete_expired",
      "canceled",
      "paused",
    ])("drops a paying workspace to free on %s", (status) => {
      const event = subscriptionEvent({ status, priceId: PRO_ANNUAL });
      expect(planSyncFromSubscription(event)).toEqual({
        workspaceIdString: WORKSPACE,
        plan: "free",
        stripeCustomerId: CUSTOMER,
      });
    });

    it("ignores a subscription with no workspace id — never guesses a tenant", () => {
      expect(planSyncFromSubscription(subscriptionEvent({ metadata: {} }))).toBeNull();
      expect(planSyncFromSubscription(subscriptionEvent({ metadata: null }))).toBeNull();
      expect(planSyncFromSubscription(subscriptionEvent({ metadata: undefined }))).toBeNull();
    });

    it("carries the customer id through so the billing portal can be opened later", () => {
      expect(planSyncFromSubscription(subscriptionEvent())?.stripeCustomerId).toBe(CUSTOMER);
    });

    it("omits the customer id rather than writing a bogus one", () => {
      const event = subscriptionEvent({ customer: null });
      const result = planSyncFromSubscription(event);
      expect(result).not.toBeNull();
      expect(result).not.toHaveProperty("stripeCustomerId");
    });

    it("tolerates a subscription with no line items", () => {
      const event = subscriptionEvent({
        items: undefined,
        metadata: { workspaceId: WORKSPACE, tier: "supporter" },
      });
      expect(planSyncFromSubscription(event)?.plan).toBe("supporter");
    });
  });

  describe("planSyncFromDeletedSubscription", () => {
    it("drops the workspace to free", () => {
      expect(
        planSyncFromDeletedSubscription({ metadata: { workspaceId: WORKSPACE, tier: "pro" } }),
      ).toEqual({ workspaceIdString: WORKSPACE, plan: "free" });
    });

    it("ignores a deletion with no workspace id", () => {
      expect(planSyncFromDeletedSubscription({ metadata: {} })).toBeNull();
      expect(planSyncFromDeletedSubscription({ metadata: null })).toBeNull();
    });
  });

  describe("customerIdFromSubscription", () => {
    it("reads a bare customer id", () => {
      expect(customerIdFromSubscription({ customer: CUSTOMER })).toBe(CUSTOMER);
    });

    it("reads an expanded customer object", () => {
      expect(customerIdFromSubscription({ customer: { id: CUSTOMER } })).toBe(CUSTOMER);
    });

    it("returns undefined when absent", () => {
      expect(customerIdFromSubscription({ customer: null })).toBeUndefined();
      expect(customerIdFromSubscription({ customer: {} })).toBeUndefined();
    });
  });

  describe("full lifecycle replay", () => {
    // Replays the exact sequence validated against Convex dev with Stripe test
    // webhooks: signup, upgrade, downgrade, renewal failure, cancellation.
    it("tracks the plan through signup, upgrade, downgrade, dunning and cancel", () => {
      const steps: Array<[SubscriptionEventObject, string]> = [
        [subscriptionEvent({ priceId: SUPPORTER_MONTHLY, status: "active" }), "supporter"],
        [subscriptionEvent({ priceId: PRO_MONTHLY, status: "active" }), "pro"],
        [subscriptionEvent({ priceId: SUPPORTER_ANNUAL, status: "active" }), "supporter"],
        [subscriptionEvent({ priceId: SUPPORTER_ANNUAL, status: "past_due" }), "free"],
      ];

      let plan = "free";
      for (const [event, expected] of steps) {
        plan = planSyncFromSubscription(event)!.plan;
        expect(plan).toBe(expected);
      }

      plan = planSyncFromDeletedSubscription({ metadata: { workspaceId: WORKSPACE } })!.plan;
      expect(plan).toBe("free");
    });
  });
});
