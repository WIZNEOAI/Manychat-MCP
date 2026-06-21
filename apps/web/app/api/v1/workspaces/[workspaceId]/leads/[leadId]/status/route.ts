import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { FunctionReference } from "convex/server";
import { clientSafeError } from "@/lib/server/api-errors";
import { leadStatusUpdateBodySchema, schemaErrorMessage } from "@/lib/server/api-schemas";
import { requireClerkSession, unauthorized } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";
import { rateLimitAllow } from "@/lib/server/rate-limit";

type RouteContext = {
  params: Promise<{ workspaceId: string; leadId: string }>;
};

type LeadStatus = "contacted" | "qualified" | "booked" | "won" | "lost";

const leadApi = (api as typeof api & {
  leads: {
    updateLeadStatus: FunctionReference<
      "mutation",
      "public",
      {
        workspaceId: Id<"workspaces">;
        leadId: Id<"operatorLeads">;
        status: LeadStatus;
        nextAction?: string;
        nextActionAt?: number;
      },
      null
    >;
  };
}).leads;

function isAuthError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    (error.message === "Authentication required" || error.message === "Convex auth token required")
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!rateLimitAllow(request, "lead-status", 120)) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  try {
    const { convexToken } = await requireClerkSession();
    const { workspaceId, leadId } = await context.params;
    const raw = await request.json();
    const parsed = leadStatusUpdateBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: schemaErrorMessage(parsed.error) }, { status: 400 });
    }

    const convex = getServerConvexClient(convexToken);
    await convex.mutation(leadApi.updateLeadStatus, {
      workspaceId: workspaceId as Id<"workspaces">,
      leadId: leadId as Id<"operatorLeads">,
      ...parsed.data,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isAuthError(error)) return unauthorized(error.message);
    return NextResponse.json(
      {
        error: clientSafeError(
          error,
          "Failed to update lead status.",
          error instanceof Error ? error.message : undefined,
        ),
      },
      { status: 400 },
    );
  }
}
