import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import { assertInternalSecret } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";

export async function POST(request: NextRequest) {
  try {
    assertInternalSecret(request);
    const body = (await request.json()) as {
      workspaceId?: string;
      tokenId?: string;
      accountId?: string | null;
    };

    if (!body.workspaceId || !body.tokenId) {
      return NextResponse.json(
        { error: "workspaceId and tokenId are required." },
        { status: 400 },
      );
    }

    const convex = getServerConvexClient();
    const result = await convex.mutation(api.hosted.authorizeGatewayRequest, {
      workspaceId: body.workspaceId,
      tokenId: body.tokenId,
      accountId: body.accountId,
    });

    return NextResponse.json({ ok: true, usage: result });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid internal secret") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to authorize request.";
    const status =
      message.includes("limit reached")
        ? 429
        : message.includes("revoked")
          ? 401
          : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
