import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { requireClerkUser, unauthorized } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";

type RouteContext = {
  params: Promise<{ workspaceId: string; tokenId: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const clerkUserId = await requireClerkUser();
    const { workspaceId, tokenId } = await context.params;
    const convex = getServerConvexClient();
    await convex.mutation(api.hosted.revokeMcpToken, {
      workspaceId: workspaceId as Id<"workspaces">,
      clerkUserId,
      tokenId: tokenId as Id<"mcpTokens">,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return unauthorized(error.message);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to revoke token." },
      { status: 400 },
    );
  }
}
