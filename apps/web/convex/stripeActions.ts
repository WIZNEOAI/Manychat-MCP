import { v } from "convex/values";
import { StripeSubscriptions, type StripeComponent } from "@convex-dev/stripe";
import { action, type ActionCtx } from "./_generated/server";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { getPriceId, type PaidTier } from "./lib/stripeTiers";

const stripeClient = new StripeSubscriptions(components.stripe as unknown as StripeComponent, {});

function appOrigin(): string {
  return process.env.PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function runSubscriptionCheckout(
  ctx: ActionCtx,
  args: { workspaceId: Id<"workspaces">; tier: PaidTier; interval: "monthly" | "annual" },
): Promise<{ sessionId: string; url: string | null }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const workspace = await ctx.runQuery(internal.billing.getWorkspaceByOwner, {
    workspaceId: args.workspaceId,
    ownerIdentityKey: identity.tokenIdentifier,
    ownerSubject: identity.subject,
  });
  if (!workspace) {
    throw new Error("Workspace not found or access denied");
  }

  const priceId = getPriceId(args.tier, args.interval);
  const origin = appOrigin();
  const customer = await stripeClient.getOrCreateCustomer(ctx, {
    userId: identity.subject,
    email: identity.email ?? undefined,
    name: identity.name ?? undefined,
  });

  await ctx.runMutation(internal.billing.linkStripeCustomer, {
    workspaceId: args.workspaceId,
    stripeCustomerId: customer.customerId,
  });

  return await stripeClient.createCheckoutSession(ctx, {
    priceId,
    customerId: customer.customerId,
    mode: "subscription",
    successUrl: `${origin}/dashboard?checkout=success`,
    cancelUrl: `${origin}/dashboard?checkout=canceled`,
    subscriptionMetadata: {
      workspaceId: args.workspaceId,
      clerkUserId: identity.subject,
      tier: args.tier,
    },
  });
}

export const createSubscriptionCheckout = action({
  args: {
    workspaceId: v.id("workspaces"),
    tier: v.union(v.literal("supporter"), v.literal("pro")),
    interval: v.union(v.literal("monthly"), v.literal("annual")),
  },
  handler: (ctx, args): Promise<{ sessionId: string; url: string | null }> =>
    runSubscriptionCheckout(ctx, args),
});

// Back-compat for the existing dashboard "upgrade to Pro" call site.
export const createProSubscriptionCheckout = action({
  args: {
    workspaceId: v.id("workspaces"),
    interval: v.union(v.literal("monthly"), v.literal("annual")),
  },
  handler: (ctx, args): Promise<{ sessionId: string; url: string | null }> =>
    runSubscriptionCheckout(ctx, { ...args, tier: "pro" }),
});

export const createBillingPortalSession = action({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const workspace = await ctx.runQuery(internal.billing.getWorkspaceByOwner, {
      workspaceId: args.workspaceId,
      ownerIdentityKey: identity.tokenIdentifier,
      ownerSubject: identity.subject,
    });
    if (!workspace?.stripeCustomerId) {
      throw new Error("No Stripe customer linked to this workspace yet");
    }

    const origin = appOrigin();
    return await stripeClient.createCustomerPortalSession(ctx, {
      customerId: workspace.stripeCustomerId,
      returnUrl: `${origin}/dashboard`,
    });
  },
});
