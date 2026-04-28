import { query } from "./_generated/server";

/** Normalize legacy "supporter" rows to "pro". */
function normalizePlan(plan: string): "free" | "pro" {
  return plan === "supporter" ? "pro" : (plan as "free" | "pro");
}

const planLimits = {
  free: {
    dailyRequests: 250,
    monthlyRequests: 3000,
    maxConcurrentSessions: 1,
    maxAccounts: 1,
    maxTokens: 2,
  },
  pro: {
    dailyRequests: 100000,
    monthlyRequests: 1000000,
    maxConcurrentSessions: 10,
    maxAccounts: 20,
    maxTokens: 50,
  },
} as const;

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

    const detailedWorkspaces = await Promise.all(
      workspaces.map(async (workspace) => {
        const accounts = await ctx.db
          .query("manychatAccounts")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
          .collect();
        const tokens = await ctx.db
          .query("mcpTokens")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
          .collect();
        const today = new Date().toISOString().slice(0, 10);
        const thisMonth = new Date().toISOString().slice(0, 7);
        const dailyUsage = await ctx.db
          .query("usageDaily")
          .withIndex("by_workspace_and_date", (q) =>
            q.eq("workspaceId", workspace._id).eq("dateKey", today),
          )
          .unique();
        const monthlyUsage = await ctx.db
          .query("usageMonthly")
          .withIndex("by_workspace_and_month", (q) =>
            q.eq("workspaceId", workspace._id).eq("monthKey", thisMonth),
          )
          .unique();
        const audit = await ctx.db
          .query("auditEvents")
          .withIndex("by_workspace_and_created", (q) => q.eq("workspaceId", workspace._id))
          .order("desc")
          .take(8);

        return {
          _id: workspace._id,
          name: workspace.name,
          slug: workspace.slug,
          plan: workspace.plan,
          stripeCustomerId: workspace.stripeCustomerId,
          limits: planLimits[normalizePlan(workspace.plan)],
          accounts: accounts.map((account) => ({
            _id: account._id,
            displayName: account.displayName,
            isDefault: account.isDefault,
            lastRotatedAt: account.lastRotatedAt,
            manychatPageName: account.manychatPageName,
            keyValidationStatus: account.keyValidationStatus,
            keyValidatedAt: account.keyValidatedAt,
          })),
          tokens: tokens.map((token) => ({
            _id: token._id,
            name: token.name,
            prefix: token.prefix,
            bundle: token.bundle,
            revokedAt: token.revokedAt,
            createdAt: token.createdAt,
          })),
          usage: {
            daily: {
              requestCount: dailyUsage?.requestCount ?? 0,
              sessionStarts: dailyUsage?.sessionStarts ?? 0,
              authFailures: dailyUsage?.authFailures ?? 0,
            },
            monthly: {
              requestCount: monthlyUsage?.requestCount ?? 0,
              sessionStarts: monthlyUsage?.sessionStarts ?? 0,
              authFailures: monthlyUsage?.authFailures ?? 0,
            },
          },
          audit: audit.map((event) => ({
            _id: event._id,
            action: event.action,
            metadataJson: event.metadataJson,
            createdAt: event.createdAt,
          })),
        };
      }),
    );

    return {
      clerkUserId: identity.subject,
      email: identity.email ?? undefined,
      name: identity.name ?? undefined,
      userId: user?._id,
      workspaces: detailedWorkspaces,
    };
  },
});
