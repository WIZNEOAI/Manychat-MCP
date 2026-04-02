import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import { requireClerkUser, unauthorized } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";

export async function GET(_request: NextRequest, context: any) {
  try {
    const clerkUserId = await requireClerkUser();
    const { workspaceId } = await context.params;
    const convex = getServerConvexClient();
    const result = await convex.query(api.hosted.getUsageAndAudit, {
      workspaceId,
      clerkUserId,
    });
    return NextResponse.json({ ok: true, audit: result.audit });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return unauthorized(error.message);
    }
    return NextResponse.json({ error: "Failed to load audit log." }, { status: 400 });
  }
}
