import { query } from "./_generated/server";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    const workspaces = user
      ? await ctx.db
          .query("workspaces")
          .withIndex("by_owner", (q) => q.eq("ownerUserId", user._id))
          .collect()
      : [];

    return {
      clerkUserId: identity.subject,
      email: identity.email ?? undefined,
      name: identity.name ?? undefined,
      userId: user?._id,
      workspaces: workspaces.map((w) => ({
        _id: w._id,
        name: w.name,
        plan: w.plan,
      })),
    };
  },
});
