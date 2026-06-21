import { registerRoutes, type StripeComponent } from "@convex-dev/stripe";
import { httpRouter, type GenericActionCtx, type GenericDataModel } from "convex/server";
import { components, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { constantTimeEqual } from "./hosted";
import { resolvePaidTier } from "./lib/stripeTiers";

type SubscriptionEventObject = {
  metadata?: Record<string, string> | null;
  status: string;
  customer: string | { id?: string } | null;
  items?: { data?: Array<{ price?: { id?: string | null } | null } | null> } | null;
};

async function syncWorkspacePlanFromSubscription(
  ctx: GenericActionCtx<GenericDataModel>,
  sub: SubscriptionEventObject,
) {
  const workspaceId = sub.metadata?.workspaceId;
  if (!workspaceId || typeof workspaceId !== "string") {
    return;
  }
  const active = sub.status === "active" || sub.status === "trialing";
  const plan: "free" | "supporter" | "pro" = active
    ? resolvePaidTier({
        priceId: sub.items?.data?.[0]?.price?.id,
        metadataTier: sub.metadata?.tier,
      })
    : "free";
  let customerId: string | undefined;
  if (typeof sub.customer === "string") {
    customerId = sub.customer;
  } else if (sub.customer && typeof sub.customer === "object" && "id" in sub.customer && sub.customer.id) {
    customerId = sub.customer.id;
  }
  await ctx.runMutation(internal.billing.setWorkspacePlanFromStripe, {
    workspaceIdString: workspaceId,
    plan,
    ...(customerId ? { stripeCustomerId: customerId } : {}),
  });
}

const http = httpRouter();

registerRoutes(http, components.stripe as unknown as StripeComponent, {
  webhookPath: "/stripe/webhook",
  events: {
    "customer.subscription.created": async (ctx, event) => {
      await syncWorkspacePlanFromSubscription(ctx, event.data.object);
    },
    "customer.subscription.updated": async (ctx, event) => {
      await syncWorkspacePlanFromSubscription(ctx, event.data.object);
    },
    "customer.subscription.deleted": async (ctx, event) => {
      const sub = event.data.object;
      const workspaceId = sub.metadata?.workspaceId;
      if (!workspaceId || typeof workspaceId !== "string") {
        return;
      }
      await ctx.runMutation(internal.billing.setWorkspacePlanFromStripe, {
        workspaceIdString: workspaceId,
        plan: "free",
      });
    },
  },
});

// --- Internal control-plane endpoints (C2) -------------------------------
// These authenticate the shared secret from the `x-control-plane-secret` HEADER
// and delegate to internal* functions. Headers are not recorded as Convex
// function args, so the secret never lands in query/mutation history.

function controlPlaneSecretOk(req: Request): boolean {
  const expected =
    process.env.MCP_INTERNAL_SHARED_SECRET ?? process.env.HOSTED_CONTROL_PLANE_SECRET;
  const actual = req.headers.get("x-control-plane-secret");
  return Boolean(expected && actual && constantTimeEqual(actual, expected));
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

http.route({
  path: "/internal/mcp/resolve-token",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!controlPlaneSecretOk(req)) {
      return jsonResponse({ error: "Invalid control plane secret" }, 401);
    }
    const body = (await req.json()) as { prefix: string };
    const result = await ctx.runQuery(internal.hosted.getGatewayTokenByPrefix, {
      prefix: body.prefix,
    });
    return jsonResponse(result);
  }),
});

http.route({
  path: "/internal/mcp/record-event",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!controlPlaneSecretOk(req)) {
      return jsonResponse({ error: "Invalid control plane secret" }, 401);
    }
    const body = (await req.json()) as {
      workspaceId: Id<"workspaces">;
      tokenId: Id<"mcpTokens">;
      type: "session_start" | "session_end" | "request" | "auth_failure";
      requestCount?: number;
      metadataJson?: string;
    };
    try {
      await ctx.runMutation(internal.hosted.recordGatewayEvent, {
        workspaceId: body.workspaceId,
        tokenId: body.tokenId,
        type: body.type,
        ...(body.requestCount !== undefined ? { requestCount: body.requestCount } : {}),
        ...(body.metadataJson !== undefined ? { metadataJson: body.metadataJson } : {}),
      });
      return jsonResponse({ ok: true });
    } catch (error) {
      return jsonResponse(
        { error: error instanceof Error ? error.message : "Failed to record event." },
        400,
      );
    }
  }),
});

http.route({
  path: "/internal/mcp/authorize",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!controlPlaneSecretOk(req)) {
      return jsonResponse({ error: "Invalid control plane secret" }, 401);
    }
    const body = (await req.json()) as {
      workspaceId: Id<"workspaces">;
      tokenId: Id<"mcpTokens">;
      accountId?: Id<"manychatAccounts"> | null;
    };
    try {
      const result = await ctx.runMutation(internal.hosted.authorizeGatewayRequest, {
        workspaceId: body.workspaceId,
        tokenId: body.tokenId,
        ...(body.accountId !== undefined ? { accountId: body.accountId } : {}),
      });
      return jsonResponse(result);
    } catch (error) {
      return jsonResponse(
        { error: error instanceof Error ? error.message : "Failed to authorize request." },
        400,
      );
    }
  }),
});

export default http;
