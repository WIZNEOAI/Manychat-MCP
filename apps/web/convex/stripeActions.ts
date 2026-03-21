import { v } from "convex/values";
import { StripeSubscriptions, type StripeComponent } from "@convex-dev/stripe";
import { action } from "./_generated/server";
import { components, internal } from "./_generated/api";

const stripeClient = new StripeSubscriptions(components.stripe as unknown as StripeComponent, {});

function appOrigin(): string {
  return process.env.PUBLIC_APP_URL ?? "http://localhost:3000";
}

export const createProSubscriptionCheckout = action({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args): Promise<{ sessionId: string; url: string | null }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const workspace = await ctx.runQuery(internal.billing.getWorkspaceByOwner, {
      workspaceId: args.workspaceId,
      clerkUserId: identity.subject,
    });
    if (!workspace) {
      throw new Error("Workspace not found or access denied");
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      throw new Error("STRIPE_PRO_PRICE_ID is not set in Convex environment variables");
    }

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
      },
    });
  },
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
      clerkUserId: identity.subject,
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
