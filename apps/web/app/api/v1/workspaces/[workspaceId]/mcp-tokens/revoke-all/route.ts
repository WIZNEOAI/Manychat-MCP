import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { clientSafeError } from "@/lib/server/api-errors";
import { requireClerkSession, unauthorized } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";
import { rateLimitAllow } from "@/lib/server/rate-limit";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  if (!rateLimitAllow(request, "mcp-revoke-all", 10)) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  try {
    const { convexToken } = await requireClerkSession();
    const { workspaceId } = await context.params;
    const convex = getServerConvexClient(convexToken);
    const result = await convex.mutation(api.hosted.revokeAllWorkspaceMcpTokens, {
      workspaceId: workspaceId as Id<"workspaces">,
    });
    return NextResponse.json({ ok: true, revokedCount: result.revokedCount });
  } catch (error) {
    if (error instanceof Error && (error.message === "Authentication required" || error.message === "Convex auth token required")) {
      return unauthorized(error.message);
    }
    return NextResponse.json(
      {
        error: clientSafeError(
          error,
          "Could not revoke tokens.",
          error instanceof Error ? error.message : undefined,
        ),
      },
      { status: 400 },
    );
  }
}
