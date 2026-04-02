import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import { requireClerkUser, unauthorized } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const clerkUserId = await requireClerkUser();
    const { workspaceId } = await context.params;
    const convex = getServerConvexClient();
    const result = await convex.query(api.hosted.getUsageAndAudit, {
      workspaceId,
      clerkUserId,
    });
    return NextResponse.json({ ok: true, usage: { daily: result.daily, monthly: result.monthly } });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return unauthorized(error.message);
    }
    return NextResponse.json({ error: "Failed to load usage." }, { status: 400 });
  }
}
