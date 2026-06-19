import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const getWorkspaceByOwner = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    ownerIdentityKey: v.string(),
    ownerSubject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      return null;
    }
    const owner = await ctx.db.get(workspace.ownerUserId);
    if (
      !owner ||
      (owner.clerkUserId !== args.ownerIdentityKey &&
        owner.clerkUserId !== args.ownerSubject)
    ) {
      return null;
    }
    return workspace;
  },
});

export const linkStripeCustomer = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workspaceId, { stripeCustomerId: args.stripeCustomerId });
  },
});

/**
 * Called from Stripe webhook handlers; workspace id comes from subscription metadata.
 */
export const setWorkspacePlanFromStripe = internalMutation({
  args: {
    workspaceIdString: v.string(),
    plan: v.union(v.literal("free"), v.literal("supporter"), v.literal("pro")),
    stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = args.workspaceIdString as Id<"workspaces">;
    const workspace = await ctx.db.get(id);
    if (!workspace) {
      return;
    }
    await ctx.db.patch(id, {
      plan: args.plan,
      ...(args.stripeCustomerId ? { stripeCustomerId: args.stripeCustomerId } : {}),
    });
  },
});
