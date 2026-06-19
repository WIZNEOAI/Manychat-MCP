import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

const leadSourceValidator = v.union(
  v.literal("manual"),
  v.literal("manychat"),
  v.literal("meta_ads"),
  v.literal("google_ads"),
  v.literal("whatsapp"),
  v.literal("other"),
);

const leadStatusValidator = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("qualified"),
  v.literal("booked"),
  v.literal("won"),
  v.literal("lost"),
);

type LeadStatus = "new" | "contacted" | "qualified" | "booked" | "won" | "lost";
const leadStatuses: LeadStatus[] = ["new", "contacted", "qualified", "booked", "won", "lost"];

type LeadCtx = QueryCtx | MutationCtx;

async function getAuthenticatedUser(ctx: LeadCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }

  const user =
    (await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.tokenIdentifier))
      .unique()) ??
    (await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .unique());

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

async function requireWorkspaceOwner(
  ctx: LeadCtx,
  workspaceId: Id<"workspaces">,
): Promise<{ workspace: Doc<"workspaces">; user: Doc<"users"> }> {
  const user = await getAuthenticatedUser(ctx);
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace || workspace.ownerUserId !== user._id) {
    throw new Error("Workspace not found or access denied");
  }

  return { workspace, user };
}

function emptyStatusCounts(): Record<LeadStatus, number> {
  return {
    new: 0,
    contacted: 0,
    qualified: 0,
    booked: 0,
    won: 0,
    lost: 0,
  };
}

async function rebuildStatusCounts(
  ctx: LeadCtx,
  workspaceId: Id<"workspaces">,
): Promise<Record<LeadStatus, number>> {
  const counts = emptyStatusCounts();
  for (const status of leadStatuses) {
    for await (const lead of ctx.db
      .query("operatorLeads")
      .withIndex("by_workspace_and_status", (q) =>
        q.eq("workspaceId", workspaceId).eq("status", status),
      )) {
      counts[lead.status] += 1;
    }
  }
  return counts;
}

async function getStatusCounts(
  ctx: LeadCtx,
  workspace: Doc<"workspaces">,
): Promise<Record<LeadStatus, number>> {
  return workspace.operatorLeadStatusCounts
    ? { ...emptyStatusCounts(), ...workspace.operatorLeadStatusCounts }
    : await rebuildStatusCounts(ctx, workspace._id);
}

async function patchStatusCounts(
  ctx: MutationCtx,
  workspaceId: Id<"workspaces">,
  deltas: Partial<Record<LeadStatus, number>>,
) {
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found or access denied");
  }

  const counts = await getStatusCounts(ctx, workspace);
  for (const status of leadStatuses) {
    const delta = deltas[status] ?? 0;
    if (delta !== 0) {
      counts[status] = Math.max(0, counts[status] + delta);
    }
  }

  await ctx.db.patch(workspaceId, { operatorLeadStatusCounts: counts });
}

export const listWorkspaceLeads = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.object({
    leads: v.array(
      v.object({
        id: v.id("operatorLeads"),
        source: leadSourceValidator,
        status: leadStatusValidator,
        displayName: v.string(),
        contactHandle: v.optional(v.string()),
        intent: v.optional(v.string()),
        nextAction: v.optional(v.string()),
        nextActionAt: v.optional(v.number()),
        lastStatusChangedAt: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
    counts: v.object({
      new: v.number(),
      contacted: v.number(),
      qualified: v.number(),
      booked: v.number(),
      won: v.number(),
      lost: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const { workspace } = await requireWorkspaceOwner(ctx, args.workspaceId);
    const rows = await ctx.db
      .query("operatorLeads")
      .withIndex("by_workspace_and_updated", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(50);

    const counts = await getStatusCounts(ctx, workspace);

    return {
      leads: rows.map((row) => ({
        id: row._id,
        source: row.source,
        status: row.status,
        displayName: row.displayName,
        contactHandle: row.contactHandle,
        intent: row.intent,
        nextAction: row.nextAction,
        nextActionAt: row.nextActionAt,
        lastStatusChangedAt: row.lastStatusChangedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      counts,
    };
  },
});

export const createLead = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    source: leadSourceValidator,
    displayName: v.string(),
    contactHandle: v.optional(v.string()),
    intent: v.optional(v.string()),
    nextAction: v.optional(v.string()),
    nextActionAt: v.optional(v.number()),
  },
  returns: v.object({ leadId: v.id("operatorLeads") }),
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceOwner(ctx, args.workspaceId);
    const now = Date.now();
    const leadId = await ctx.db.insert("operatorLeads", {
      workspaceId: args.workspaceId,
      source: args.source,
      status: "new",
      displayName: args.displayName,
      contactHandle: args.contactHandle,
      intent: args.intent,
      nextAction: args.nextAction,
      nextActionAt: args.nextActionAt,
      lastStatusChangedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await patchStatusCounts(ctx, args.workspaceId, { new: 1 });

    await ctx.db.insert("auditEvents", {
      workspaceId: args.workspaceId,
      actorUserId: user._id,
      actorTokenId: null,
      action: "lead.created",
      metadataJson: JSON.stringify({ leadId, source: args.source }),
      createdAt: now,
    });

    return { leadId };
  },
});

export const updateLeadStatus = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    leadId: v.id("operatorLeads"),
    status: leadStatusValidator,
    nextAction: v.optional(v.string()),
    nextActionAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user } = await requireWorkspaceOwner(ctx, args.workspaceId);
    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.workspaceId !== args.workspaceId) {
      throw new Error("Lead not found or access denied");
    }

    const now = Date.now();
    await ctx.db.patch(args.leadId, {
      status: args.status,
      nextAction: args.nextAction,
      nextActionAt: args.nextActionAt,
      lastStatusChangedAt: lead.status === args.status ? lead.lastStatusChangedAt : now,
      updatedAt: now,
    });
    if (lead.status !== args.status) {
      await patchStatusCounts(ctx, args.workspaceId, {
        [lead.status]: -1,
        [args.status]: 1,
      });
    }

    await ctx.db.insert("auditEvents", {
      workspaceId: args.workspaceId,
      actorUserId: user._id,
      actorTokenId: null,
      action: "lead.status_changed",
      metadataJson: JSON.stringify({
        leadId: args.leadId,
        from: lead.status,
        to: args.status,
      }),
      createdAt: now,
    });

    return null;
  },
});
