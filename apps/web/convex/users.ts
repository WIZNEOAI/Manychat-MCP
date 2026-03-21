import { mutation } from "./_generated/server";

/**
 * Upserts the Convex user row from Clerk identity and ensures a default workspace exists.
 * Call once after sign-in (e.g. from the dashboard layout).
 */
export const ensureCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("ensureCurrentUser called without authentication");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    let userId;
    if (existing) {
      userId = existing._id;
      await ctx.db.patch(existing._id, {
        email: identity.email ?? undefined,
        name: identity.name ?? undefined,
        imageUrl: identity.pictureUrl ?? undefined,
      });
    } else {
      userId = await ctx.db.insert("users", {
        clerkUserId: identity.subject,
        email: identity.email ?? undefined,
        name: identity.name ?? undefined,
        imageUrl: identity.pictureUrl ?? undefined,
      });
    }

    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", userId))
      .collect();

    if (workspaces.length === 0) {
      await ctx.db.insert("workspaces", {
        name: "Personal",
        ownerUserId: userId,
        plan: "free",
      });
    }

    return userId;
  },
});
