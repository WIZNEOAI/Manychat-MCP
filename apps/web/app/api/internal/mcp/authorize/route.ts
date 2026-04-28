import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { clientSafeError } from "@/lib/server/api-errors";
import { internalAuthorizeBodySchema, schemaErrorMessage } from "@/lib/server/api-schemas";
import { assertInternalSecret } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";
import { rateLimitAllow } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest) {
  if (!rateLimitAllow(request, "internal-authorize", 600)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    assertInternalSecret(request);
    const raw = await request.json();
    const parsed = internalAuthorizeBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: schemaErrorMessage(parsed.error) }, { status: 400 });
    }
    const body = parsed.data;

    const convex = getServerConvexClient();
    const result = await convex.mutation(api.hosted.authorizeGatewayRequest, {
      workspaceId: body.workspaceId as Id<"workspaces">,
      tokenId: body.tokenId as Id<"mcpTokens">,
      accountId: body.accountId as Id<"manychatAccounts"> | null | undefined,
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

    const safeMessage =
      status === 400
        ? clientSafeError(error, "Failed to authorize request.", message)
        : message;

    return NextResponse.json({ error: safeMessage }, { status });
  }
}
