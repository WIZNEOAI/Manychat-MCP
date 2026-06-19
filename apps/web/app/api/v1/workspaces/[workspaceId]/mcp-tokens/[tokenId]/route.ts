import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { clientSafeError } from "@/lib/server/api-errors";
import { requireClerkSession, unauthorized } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";
import { rateLimitAllow } from "@/lib/server/rate-limit";

type RouteContext = {
  params: Promise<{ workspaceId: string; tokenId: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!rateLimitAllow(request, "mcp-revoke", 40)) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  try {
    const { convexToken } = await requireClerkSession();
    const { workspaceId, tokenId } = await context.params;
    const convex = getServerConvexClient(convexToken);
    await convex.mutation(api.hosted.revokeMcpToken, {
      workspaceId: workspaceId as Id<"workspaces">,
      tokenId: tokenId as Id<"mcpTokens">,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "Authentication required" || error.message === "Convex auth token required")) {
      return unauthorized(error.message);
    }
    return NextResponse.json(
      {
        error: clientSafeError(
          error,
          "Failed to revoke token.",
          error instanceof Error ? error.message : undefined,
        ),
      },
      { status: 400 },
    );
  }
}
