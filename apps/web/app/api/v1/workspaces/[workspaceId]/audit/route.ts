import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { requireClerkSession, unauthorized } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { convexToken } = await requireClerkSession();
    const { workspaceId } = await context.params;
    const convex = getServerConvexClient(convexToken);
    const result = await convex.query(api.hosted.getUsageAndAudit, {
      workspaceId: workspaceId as Id<"workspaces">,
    });
    return NextResponse.json({ ok: true, audit: result.audit });
  } catch (error) {
    if (error instanceof Error && (error.message === "Authentication required" || error.message === "Convex auth token required")) {
      return unauthorized(error.message);
    }
    return NextResponse.json({ error: "Failed to load audit log." }, { status: 400 });
  }
}
