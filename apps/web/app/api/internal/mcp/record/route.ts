import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { assertInternalSecret } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";

export async function POST(request: NextRequest) {
  try {
    assertInternalSecret(request);
    const body = (await request.json()) as {
      workspaceId?: string;
      tokenId?: string;
      type?: "session_start" | "session_end" | "request" | "auth_failure";
      requestCount?: number;
      metadata?: Record<string, unknown>;
    };

    if (!body.workspaceId || !body.tokenId || !body.type) {
      return NextResponse.json(
        { error: "workspaceId, tokenId, and type are required." },
        { status: 400 },
      );
    }

    const convex = getServerConvexClient();
    await convex.mutation(api.hosted.recordGatewayEvent, {
      workspaceId: body.workspaceId as Id<"workspaces">,
      tokenId: body.tokenId as Id<"mcpTokens">,
      type: body.type,
      requestCount: body.requestCount,
      metadataJson: body.metadata ? JSON.stringify(body.metadata) : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid internal secret") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to record event." }, { status: 400 });
  }
}
