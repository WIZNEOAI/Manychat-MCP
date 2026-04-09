import { registerRoutes, type StripeComponent } from "@convex-dev/stripe";
import { httpRouter, type GenericActionCtx, type GenericDataModel } from "convex/server";
import { components, internal } from "./_generated/api";

async function syncWorkspacePlanFromSubscription(
  ctx: GenericActionCtx<GenericDataModel>,
  sub: { metadata?: Record<string, string> | null; status: string; customer: string | { id?: string } | null },
) {
  const workspaceId = sub.metadata?.workspaceId;
  if (!workspaceId || typeof workspaceId !== "string") {
    return;
  }
  const status = sub.status;
  const plan =
    status === "active" || status === "trialing" ? ("pro" as const) : ("free" as const);
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

export default http;
