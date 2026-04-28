import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

const bundleValidator = v.union(
  v.literal("read_only"),
  v.literal("operator"),
  v.literal("messaging_safe"),
  v.literal("admin"),
);

/** Normalize legacy "supporter" rows to "pro". */
function normalizePlan(plan: string): "free" | "pro" {
  return plan === "supporter" ? "pro" : (plan as "free" | "pro");
}

const planLimits = {
  free: {
    maxAccounts: 1,
    dailyRequests: 250,
    monthlyRequests: 3000,
    maxConcurrentSessions: 1,
    maxTokens: 2,
  },
  pro: {
    maxAccounts: 20,
    dailyRequests: 100000,
    monthlyRequests: 1000000,
    maxConcurrentSessions: 10,
    maxTokens: 50,
  },
} as const;

type HostedCtx = QueryCtx | MutationCtx;

async function requireWorkspaceOwner(
  ctx: HostedCtx,
  workspaceId: Id<"workspaces">,
  clerkUserId: string,
): Promise<{ workspace: Doc<"workspaces">; user: Doc<"users"> }> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
  if (!user) {
    throw new Error("User not found");
  }

  const workspace = await ctx.db.get(workspaceId);
  if (!workspace || workspace.ownerUserId !== user._id) {
    throw new Error("Workspace not found or access denied");
  }

  return { workspace, user };
}

async function ensureAccountCap(
  ctx: HostedCtx,
  workspaceId: Id<"workspaces">,
  plan: keyof typeof planLimits,
) {
  const existing = await ctx.db
    .query("manychatAccounts")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .collect();
  if (existing.length >= planLimits[plan].maxAccounts) {
    throw new Error(`Plan limit reached for connected ManyChat accounts (${planLimits[plan].maxAccounts}).`);
  }
}

async function ensureTokenCap(
  ctx: HostedCtx,
  workspaceId: Id<"workspaces">,
  plan: keyof typeof planLimits,
) {
  const active = await ctx.db
    .query("mcpTokens")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .collect();
  const activeCount = active.filter((token: Doc<"mcpTokens">) => token.revokedAt === null).length;
  if (activeCount >= planLimits[plan].maxTokens) {
    throw new Error(`Plan limit reached for MCP tokens (${planLimits[plan].maxTokens}).`);
  }
}

function dateKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

function monthKey(now: number): string {
  return new Date(now).toISOString().slice(0, 7);
}

export const upsertManychatAccount = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    clerkUserId: v.string(),
    displayName: v.string(),
    ciphertext: v.string(),
    keyVersion: v.string(),
    isDefault: v.optional(v.boolean()),
    manychatPageName: v.optional(v.string()),
    keyValidatedAt: v.number(),
  },
  returns: v.object({
    accountId: v.id("manychatAccounts"),
    displayName: v.string(),
    lastRotatedAt: v.number(),
    manychatPageName: v.optional(v.string()),
    keyValidationStatus: v.literal("valid"),
    keyValidatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const { workspace, user } = await requireWorkspaceOwner(ctx, args.workspaceId, args.clerkUserId);
    await ensureAccountCap(ctx, args.workspaceId, normalizePlan(workspace.plan));

    const now = Date.now();
    const shouldDefault = args.isDefault ?? true;
    const workspaceAccounts = await ctx.db
      .query("manychatAccounts")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    if (shouldDefault) {
      await Promise.all(
        workspaceAccounts
          .filter((account) => account.isDefault)
          .map((account) => ctx.db.patch(account._id, { isDefault: false })),
      );
    }

    const accountId = await ctx.db.insert("manychatAccounts", {
      workspaceId: args.workspaceId,
      displayName: args.displayName,
      isDefault: shouldDefault || workspaceAccounts.length === 0,
      createdAt: now,
      lastRotatedAt: now,
      manychatPageName: args.manychatPageName,
      keyValidationStatus: "valid",
      keyValidatedAt: args.keyValidatedAt,
    });

    await ctx.db.insert("manychatCredentials", {
      accountId,
      ciphertext: args.ciphertext,
      keyVersion: args.keyVersion,
      createdAt: now,
      lastRotatedAt: now,
    });

    await ctx.db.insert("auditEvents", {
      workspaceId: args.workspaceId,
      actorUserId: user._id,
      actorTokenId: null,
      action: "manychat_account.created",
      metadataJson: JSON.stringify({ displayName: args.displayName }),
      createdAt: now,
    });

    return {
      accountId,
      displayName: args.displayName,
      lastRotatedAt: now,
      manychatPageName: args.manychatPageName,
      keyValidationStatus: "valid" as const,
      keyValidatedAt: args.keyValidatedAt,
    };
  },
});

export const rotateManychatCredential = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    clerkUserId: v.string(),
    accountId: v.id("manychatAccounts"),
    ciphertext: v.string(),
    keyVersion: v.string(),
    manychatPageName: v.optional(v.string()),
    keyValidatedAt: v.number(),
  },
  returns: v.object({
    accountId: v.id("manychatAccounts"),
    lastRotatedAt: v.number(),
    manychatPageName: v.optional(v.string()),
    keyValidationStatus: v.literal("valid"),
    keyValidatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceOwner(ctx, args.workspaceId, args.clerkUserId);
    const account = await ctx.db.get(args.accountId);
    if (!account || account.workspaceId !== args.workspaceId) {
      throw new Error("ManyChat account not found");
    }

    const now = Date.now();
    const credential = await ctx.db
      .query("manychatCredentials")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .unique();

    if (credential) {
      await ctx.db.patch(credential._id, {
        ciphertext: args.ciphertext,
        keyVersion: args.keyVersion,
        lastRotatedAt: now,
      });
    } else {
      await ctx.db.insert("manychatCredentials", {
        accountId: args.accountId,
        ciphertext: args.ciphertext,
        keyVersion: args.keyVersion,
        createdAt: now,
        lastRotatedAt: now,
      });
    }

    await ctx.db.patch(args.accountId, {
      lastRotatedAt: now,
      manychatPageName: args.manychatPageName,
      keyValidationStatus: "valid",
      keyValidatedAt: args.keyValidatedAt,
    });
    await ctx.db.insert("auditEvents", {
      workspaceId: args.workspaceId,
      actorUserId: user._id,
      actorTokenId: null,
      action: "manychat_account.rotated",
      metadataJson: JSON.stringify({ accountId: args.accountId }),
      createdAt: now,
    });

    return {
      accountId: args.accountId,
      lastRotatedAt: now,
      manychatPageName: args.manychatPageName,
      keyValidationStatus: "valid" as const,
      keyValidatedAt: args.keyValidatedAt,
    };
  },
});

export const issueMcpToken = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    clerkUserId: v.string(),
    accountId: v.union(v.id("manychatAccounts"), v.null()),
    name: v.string(),
    bundle: bundleValidator,
    prefix: v.string(),
    tokenHash: v.string(),
  },
  returns: v.object({
    tokenId: v.id("mcpTokens"),
    prefix: v.string(),
    bundle: bundleValidator,
    createdAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const { workspace, user } = await requireWorkspaceOwner(ctx, args.workspaceId, args.clerkUserId);
    await ensureTokenCap(ctx, args.workspaceId, normalizePlan(workspace.plan));

    if (args.accountId) {
      const account = await ctx.db.get(args.accountId);
      if (!account || account.workspaceId !== args.workspaceId) {
        throw new Error("ManyChat account not found");
      }
    }

    const now = Date.now();
    const tokenId = await ctx.db.insert("mcpTokens", {
      workspaceId: args.workspaceId,
      accountId: args.accountId,
      name: args.name,
      prefix: args.prefix,
      tokenHash: args.tokenHash,
      bundle: args.bundle,
      revokedAt: null,
      createdAt: now,
    });

    await ctx.db.insert("auditEvents", {
      workspaceId: args.workspaceId,
      actorUserId: user._id,
      actorTokenId: null,
      action: "mcp_token.issued",
      metadataJson: JSON.stringify({ tokenId, bundle: args.bundle, prefix: args.prefix }),
      createdAt: now,
    });

    return {
      tokenId,
      prefix: args.prefix,
      bundle: args.bundle,
      createdAt: now,
    };
  },
});

export const revokeMcpToken = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    clerkUserId: v.string(),
    tokenId: v.id("mcpTokens"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceOwner(ctx, args.workspaceId, args.clerkUserId);
    const token = await ctx.db.get(args.tokenId);
    if (!token || token.workspaceId !== args.workspaceId) {
      throw new Error("MCP token not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.tokenId, { revokedAt: now });
    await ctx.db.insert("auditEvents", {
      workspaceId: args.workspaceId,
      actorUserId: user._id,
      actorTokenId: null,
      action: "mcp_token.revoked",
      metadataJson: JSON.stringify({ tokenId: args.tokenId }),
      createdAt: now,
    });
    return null;
  },
});

export const revokeAllWorkspaceMcpTokens = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    clerkUserId: v.string(),
  },
  returns: v.object({ revokedCount: v.number() }),
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceOwner(ctx, args.workspaceId, args.clerkUserId);
    const tokens = await ctx.db
      .query("mcpTokens")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const now = Date.now();
    let revokedCount = 0;
    for (const token of tokens) {
      if (token.revokedAt === null) {
        await ctx.db.patch(token._id, { revokedAt: now });
        revokedCount += 1;
      }
    }

    if (revokedCount > 0) {
      await ctx.db.insert("auditEvents", {
        workspaceId: args.workspaceId,
        actorUserId: user._id,
        actorTokenId: null,
        action: "mcp_tokens.revoked_all",
        metadataJson: JSON.stringify({ revokedCount }),
        createdAt: now,
      });
    }

    return { revokedCount };
  },
});

export const disconnectManychatAccount = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    clerkUserId: v.string(),
    accountId: v.id("manychatAccounts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceOwner(ctx, args.workspaceId, args.clerkUserId);
    const account = await ctx.db.get(args.accountId);
    if (!account || account.workspaceId !== args.workspaceId) {
      throw new Error("ManyChat account not found");
    }

    const now = Date.now();
    const tokens = await ctx.db
      .query("mcpTokens")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    for (const token of tokens) {
      if (token.revokedAt === null) {
        await ctx.db.patch(token._id, { revokedAt: now });
      }
    }

    const credential = await ctx.db
      .query("manychatCredentials")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .unique();
    if (credential) {
      await ctx.db.delete(credential._id);
    }

    await ctx.db.delete(args.accountId);

    await ctx.db.insert("auditEvents", {
      workspaceId: args.workspaceId,
      actorUserId: user._id,
      actorTokenId: null,
      action: "manychat_account.disconnected",
      metadataJson: JSON.stringify({ accountId: args.accountId }),
      createdAt: now,
    });

    return null;
  },
});

export const getUsageAndAudit = query({
  args: {
    workspaceId: v.id("workspaces"),
    clerkUserId: v.string(),
  },
  returns: v.object({
    daily: v.object({
      requestCount: v.number(),
      sessionStarts: v.number(),
      authFailures: v.number(),
      dateKey: v.string(),
    }),
    monthly: v.object({
      requestCount: v.number(),
      sessionStarts: v.number(),
      authFailures: v.number(),
      monthKey: v.string(),
    }),
    audit: v.array(
      v.object({
        id: v.id("auditEvents"),
        action: v.string(),
        createdAt: v.number(),
        metadataJson: v.optional(v.string()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId, args.clerkUserId);
    const now = Date.now();
    const daily = await ctx.db
      .query("usageDaily")
      .withIndex("by_workspace_and_date", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("dateKey", dateKey(now)),
      )
      .unique();
    const monthly = await ctx.db
      .query("usageMonthly")
      .withIndex("by_workspace_and_month", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("monthKey", monthKey(now)),
      )
      .unique();
    const audit = await ctx.db
      .query("auditEvents")
      .withIndex("by_workspace_and_created", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(12);

    return {
      daily: {
        dateKey: dateKey(now),
        requestCount: daily?.requestCount ?? 0,
        sessionStarts: daily?.sessionStarts ?? 0,
        authFailures: daily?.authFailures ?? 0,
      },
      monthly: {
        monthKey: monthKey(now),
        requestCount: monthly?.requestCount ?? 0,
        sessionStarts: monthly?.sessionStarts ?? 0,
        authFailures: monthly?.authFailures ?? 0,
      },
      audit: audit.map((event) => ({
        id: event._id,
        action: event.action,
        createdAt: event.createdAt,
        metadataJson: event.metadataJson,
      })),
    };
  },
});

export const getWorkspaceTokens = query({
  args: {
    workspaceId: v.id("workspaces"),
    clerkUserId: v.string(),
  },
  returns: v.array(
    v.object({
      id: v.id("mcpTokens"),
      name: v.string(),
      prefix: v.string(),
      bundle: bundleValidator,
      revokedAt: v.union(v.number(), v.null()),
      createdAt: v.number(),
      accountId: v.union(v.id("manychatAccounts"), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId, args.clerkUserId);
    const tokens = await ctx.db
      .query("mcpTokens")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return tokens
      .sort((left, right) => right.createdAt - left.createdAt)
      .map((token) => ({
        id: token._id,
        name: token.name,
        prefix: token.prefix,
        bundle: token.bundle,
        revokedAt: token.revokedAt,
        createdAt: token.createdAt,
        accountId: token.accountId,
      }));
  },
});

export const getGatewayTokenByPrefix = query({
  args: {
    prefix: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      tokenId: v.id("mcpTokens"),
      tokenHash: v.string(),
      bundle: bundleValidator,
      workspaceId: v.id("workspaces"),
      workspaceName: v.string(),
      plan: v.union(v.literal("free"), v.literal("supporter"), v.literal("pro")),
      accountId: v.union(v.id("manychatAccounts"), v.null()),
      accountName: v.string(),
      ciphertext: v.string(),
      keyVersion: v.string(),
      limits: v.object({
        maxAccounts: v.number(),
        dailyRequests: v.number(),
        monthlyRequests: v.number(),
        maxConcurrentSessions: v.number(),
        maxTokens: v.number(),
      }),
      usage: v.object({
        dailyRequestCount: v.number(),
        monthlyRequestCount: v.number(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const token = await ctx.db
      .query("mcpTokens")
      .withIndex("by_prefix", (q) => q.eq("prefix", args.prefix))
      .unique();
    if (!token || token.revokedAt !== null) {
      return null;
    }

    const workspace = await ctx.db.get(token.workspaceId);
    if (!workspace) {
      return null;
    }

    let account = token.accountId ? await ctx.db.get(token.accountId) : null;
    if (!account) {
      account =
        (await ctx.db
          .query("manychatAccounts")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
          .collect())
          .find((candidate) => candidate.isDefault) ?? null;
    }
    if (!account) {
      return null;
    }

    const credential = await ctx.db
      .query("manychatCredentials")
      .withIndex("by_account", (q) => q.eq("accountId", account._id))
      .unique();
    if (!credential) {
      return null;
    }

    const now = Date.now();
    const daily = await ctx.db
      .query("usageDaily")
      .withIndex("by_workspace_and_date", (q) =>
        q.eq("workspaceId", workspace._id).eq("dateKey", dateKey(now)),
      )
      .unique();
    const monthly = await ctx.db
      .query("usageMonthly")
      .withIndex("by_workspace_and_month", (q) =>
        q.eq("workspaceId", workspace._id).eq("monthKey", monthKey(now)),
      )
      .unique();

    return {
      tokenId: token._id,
      tokenHash: token.tokenHash,
      bundle: token.bundle,
      workspaceId: workspace._id,
      workspaceName: workspace.name,
      plan: workspace.plan,
      accountId: account._id,
      accountName: account.displayName,
      ciphertext: credential.ciphertext,
      keyVersion: credential.keyVersion,
      limits: planLimits[normalizePlan(workspace.plan)],
      usage: {
        dailyRequestCount: daily?.requestCount ?? 0,
        monthlyRequestCount: monthly?.requestCount ?? 0,
      },
    };
  },
});

export const recordGatewayEvent = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    tokenId: v.id("mcpTokens"),
    type: v.union(
      v.literal("session_start"),
      v.literal("session_end"),
      v.literal("request"),
      v.literal("auth_failure"),
    ),
    requestCount: v.optional(v.number()),
    metadataJson: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      return null;
    }

    const now = Date.now();
    const day = dateKey(now);
    const month = monthKey(now);
    const requestDelta = args.type === "request" ? args.requestCount ?? 1 : 0;
    const sessionDelta = args.type === "session_start" ? 1 : 0;
    const failureDelta = args.type === "auth_failure" ? 1 : 0;

    const daily = await ctx.db
      .query("usageDaily")
      .withIndex("by_workspace_and_date", (q) => q.eq("workspaceId", args.workspaceId).eq("dateKey", day))
      .unique();
    const monthly = await ctx.db
      .query("usageMonthly")
      .withIndex("by_workspace_and_month", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("monthKey", month),
      )
      .unique();

    if (daily) {
      await ctx.db.patch(daily._id, {
        requestCount: daily.requestCount + requestDelta,
        sessionStarts: daily.sessionStarts + sessionDelta,
        authFailures: daily.authFailures + failureDelta,
        lastSeenAt: now,
      });
    } else {
      await ctx.db.insert("usageDaily", {
        workspaceId: args.workspaceId,
        dateKey: day,
        requestCount: requestDelta,
        sessionStarts: sessionDelta,
        authFailures: failureDelta,
        lastSeenAt: now,
      });
    }

    if (monthly) {
      await ctx.db.patch(monthly._id, {
        requestCount: monthly.requestCount + requestDelta,
        sessionStarts: monthly.sessionStarts + sessionDelta,
        authFailures: monthly.authFailures + failureDelta,
        lastSeenAt: now,
      });
    } else {
      await ctx.db.insert("usageMonthly", {
        workspaceId: args.workspaceId,
        monthKey: month,
        requestCount: requestDelta,
        sessionStarts: sessionDelta,
        authFailures: failureDelta,
        lastSeenAt: now,
      });
    }

    await ctx.db.insert("auditEvents", {
      workspaceId: args.workspaceId,
      actorUserId: null,
      actorTokenId: args.tokenId,
      action: `gateway.${args.type}`,
      metadataJson: args.metadataJson,
      createdAt: now,
    });

    return null;
  },
});

export const authorizeGatewayRequest = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    tokenId: v.id("mcpTokens"),
    accountId: v.optional(v.union(v.id("manychatAccounts"), v.null())),
  },
  returns: v.object({
    ok: v.boolean(),
    dailyRequestCount: v.number(),
    monthlyRequestCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found.");
    }

    const token = await ctx.db.get(args.tokenId);
    if (!token || token.workspaceId !== args.workspaceId || token.revokedAt !== null) {
      throw new Error("Hosted token not found or revoked.");
    }

    const now = Date.now();
    const day = dateKey(now);
    const month = monthKey(now);
    const limits = planLimits[normalizePlan(workspace.plan)];

    const daily = await ctx.db
      .query("usageDaily")
      .withIndex("by_workspace_and_date", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("dateKey", day),
      )
      .unique();
    const monthly = await ctx.db
      .query("usageMonthly")
      .withIndex("by_workspace_and_month", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("monthKey", month),
      )
      .unique();

    const nextDaily = (daily?.requestCount ?? 0) + 1;
    const nextMonthly = (monthly?.requestCount ?? 0) + 1;

    if (nextDaily > limits.dailyRequests) {
      throw new Error(`Daily request limit reached for workspace ${workspace.name}.`);
    }

    if (nextMonthly > limits.monthlyRequests) {
      throw new Error(`Monthly request limit reached for workspace ${workspace.name}.`);
    }

    if (daily) {
      await ctx.db.patch(daily._id, {
        requestCount: nextDaily,
        lastSeenAt: now,
      });
    } else {
      await ctx.db.insert("usageDaily", {
        workspaceId: args.workspaceId,
        dateKey: day,
        requestCount: 1,
        sessionStarts: 0,
        authFailures: 0,
        lastSeenAt: now,
      });
    }

    if (monthly) {
      await ctx.db.patch(monthly._id, {
        requestCount: nextMonthly,
        lastSeenAt: now,
      });
    } else {
      await ctx.db.insert("usageMonthly", {
        workspaceId: args.workspaceId,
        monthKey: month,
        requestCount: 1,
        sessionStarts: 0,
        authFailures: 0,
        lastSeenAt: now,
      });
    }

    await ctx.db.insert("auditEvents", {
      workspaceId: args.workspaceId,
      actorUserId: null,
      actorTokenId: args.tokenId,
      action: "gateway.request",
      metadataJson:
        args.accountId === undefined
          ? undefined
          : JSON.stringify({ accountId: args.accountId }),
      createdAt: now,
    });

    return {
      ok: true,
      dailyRequestCount: nextDaily,
      monthlyRequestCount: nextMonthly,
    };
  },
});
