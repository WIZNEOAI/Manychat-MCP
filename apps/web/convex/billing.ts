import { internalMutation, internalQuery, query } from "./_generated/server";
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

/**
 * Public entitlement check for the authenticated owner of a workspace.
 * Authorization derives from ctx.auth, never from a client-passed user id.
 */
export const getWorkspaceEntitlements = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.object({
    plan: v.union(v.literal("free"), v.literal("supporter"), v.literal("pro")),
    isPaid: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }
    const owner = await ctx.db.get(workspace.ownerUserId);
    if (
      !owner ||
      (owner.clerkUserId !== identity.tokenIdentifier && owner.clerkUserId !== identity.subject)
    ) {
      throw new Error("Access denied");
    }
    return { plan: workspace.plan, isPaid: workspace.plan !== "free" };
  },
});
