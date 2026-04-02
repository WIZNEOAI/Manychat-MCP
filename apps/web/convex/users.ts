import { mutation } from "./_generated/server";

function slugifyWorkspaceName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "personal"
  );
}

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
        createdAt: Date.now(),
      });
    }

    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", userId))
      .collect();

    if (workspaces.length === 0) {
      const createdAt = Date.now();
      await ctx.db.insert("workspaces", {
        name: "Personal",
        slug: slugifyWorkspaceName(`personal-${identity.subject.slice(0, 6)}`),
        ownerUserId: userId,
        plan: "free",
        createdAt,
      });
    }

    return userId;
  },
});
