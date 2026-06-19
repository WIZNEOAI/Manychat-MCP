import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { FunctionReference } from "convex/server";
import { clientSafeError } from "@/lib/server/api-errors";
import { leadCreateBodySchema, schemaErrorMessage } from "@/lib/server/api-schemas";
import { requireClerkSession, unauthorized } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";
import { rateLimitAllow } from "@/lib/server/rate-limit";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

type LeadSource = "manual" | "manychat" | "meta_ads" | "google_ads" | "whatsapp" | "other";
type LeadStatus = "new" | "contacted" | "qualified" | "booked" | "won" | "lost";

type WorkspaceLead = {
  id: Id<"operatorLeads">;
  source: LeadSource;
  status: LeadStatus;
  displayName: string;
  contactHandle?: string;
  intent?: string;
  nextAction?: string;
  nextActionAt?: number;
  lastStatusChangedAt: number;
  createdAt: number;
  updatedAt: number;
};

const leadApi = (api as typeof api & {
  leads: {
    listWorkspaceLeads: FunctionReference<
      "query",
      "public",
      { workspaceId: Id<"workspaces"> },
      { leads: WorkspaceLead[]; counts: Record<LeadStatus, number> }
    >;
    createLead: FunctionReference<
      "mutation",
      "public",
      {
        workspaceId: Id<"workspaces">;
        source: LeadSource;
        displayName: string;
        contactHandle?: string;
        intent?: string;
        nextAction?: string;
        nextActionAt?: number;
      },
      { leadId: Id<"operatorLeads"> }
    >;
  };
}).leads;

function isAuthError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    (error.message === "Authentication required" || error.message === "Convex auth token required")
  );
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { convexToken } = await requireClerkSession();
    const { workspaceId } = await context.params;
    const convex = getServerConvexClient(convexToken);
    const result = await convex.query(leadApi.listWorkspaceLeads, {
      workspaceId: workspaceId as Id<"workspaces">,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (isAuthError(error)) return unauthorized(error.message);
    return NextResponse.json({ error: "Failed to load leads." }, { status: 400 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!rateLimitAllow(request, "lead-create", 60)) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  try {
    const { convexToken } = await requireClerkSession();
    const { workspaceId } = await context.params;
    const raw = await request.json();
    const parsed = leadCreateBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: schemaErrorMessage(parsed.error) }, { status: 400 });
    }

    const convex = getServerConvexClient(convexToken);
    const lead = await convex.mutation(leadApi.createLead, {
      workspaceId: workspaceId as Id<"workspaces">,
      ...parsed.data,
    });
    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    if (isAuthError(error)) return unauthorized(error.message);
    return NextResponse.json(
      {
        error: clientSafeError(
          error,
          "Failed to create lead.",
          error instanceof Error ? error.message : undefined,
        ),
      },
      { status: 400 },
    );
  }
}
