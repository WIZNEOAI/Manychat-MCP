import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_user", ["clerkUserId"]),

  workspaces: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerUserId: v.id("users"),
    // "supporter" is legacy, treated identically to "pro"
    plan: v.union(v.literal("free"), v.literal("supporter"), v.literal("pro")),
    stripeCustomerId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerUserId"])
    .index("by_slug", ["slug"]),

  manychatAccounts: defineTable({
    workspaceId: v.id("workspaces"),
    displayName: v.string(),
    isDefault: v.boolean(),
    createdAt: v.number(),
    lastRotatedAt: v.number(),
    /** From ManyChat page/getInfo when key was last validated */
    manychatPageName: v.optional(v.string()),
    keyValidationStatus: v.optional(
      v.union(v.literal("valid"), v.literal("pending"), v.literal("invalid")),
    ),
    keyValidatedAt: v.optional(v.number()),
  }).index("by_workspace", ["workspaceId"]),

  manychatCredentials: defineTable({
    accountId: v.id("manychatAccounts"),
    ciphertext: v.string(),
    keyVersion: v.string(),
    createdAt: v.number(),
    lastRotatedAt: v.number(),
  }).index("by_account", ["accountId"]),

  mcpTokens: defineTable({
    workspaceId: v.id("workspaces"),
    accountId: v.union(v.id("manychatAccounts"), v.null()),
    name: v.string(),
    prefix: v.string(),
    tokenHash: v.string(),
    bundle: v.union(
      v.literal("read_only"),
      v.literal("operator"),
      v.literal("messaging_safe"),
      v.literal("admin"),
    ),
    revokedAt: v.union(v.number(), v.null()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_prefix", ["prefix"]),

  usageDaily: defineTable({
    workspaceId: v.id("workspaces"),
    dateKey: v.string(),
    requestCount: v.number(),
    sessionStarts: v.number(),
    authFailures: v.number(),
    lastSeenAt: v.number(),
  }).index("by_workspace_and_date", ["workspaceId", "dateKey"]),

  usageMonthly: defineTable({
    workspaceId: v.id("workspaces"),
    monthKey: v.string(),
    requestCount: v.number(),
    sessionStarts: v.number(),
    authFailures: v.number(),
    lastSeenAt: v.number(),
  }).index("by_workspace_and_month", ["workspaceId", "monthKey"]),

  auditEvents: defineTable({
    workspaceId: v.id("workspaces"),
    actorUserId: v.union(v.id("users"), v.null()),
    actorTokenId: v.union(v.id("mcpTokens"), v.null()),
    action: v.string(),
    metadataJson: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_workspace_and_created", ["workspaceId", "createdAt"]),
});
