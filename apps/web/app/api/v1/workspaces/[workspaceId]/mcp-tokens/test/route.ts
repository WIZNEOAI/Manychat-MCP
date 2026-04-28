import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { clientSafeError } from "@/lib/server/api-errors";
import { mcpTokenTestBodySchema, schemaErrorMessage } from "@/lib/server/api-schemas";
import { requireClerkUser, unauthorized } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";
import { decryptVaultValue, hashHostedToken, parseHostedTokenPrefix, safeEqualHex } from "@/lib/server/hosted";
import { validateManyChatApiKey } from "@/lib/server/manychat-validate";
import { rateLimitAllow } from "@/lib/server/rate-limit";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  if (!rateLimitAllow(request, "mcp-test", 20)) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  try {
    await requireClerkUser();
    const { workspaceId } = await context.params;
    const raw = await request.json();
    const parsed = mcpTokenTestBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: schemaErrorMessage(parsed.error) }, { status: 400 });
    }

    const convex = getServerConvexClient();
    const prefix = parseHostedTokenPrefix(parsed.data.token);
    if (!prefix) {
      return NextResponse.json({ error: "Invalid hosted token format." }, { status: 400 });
    }

    const tokenRecord = await convex.query(api.hosted.getGatewayTokenByPrefix, { prefix });
    if (!tokenRecord || tokenRecord.workspaceId !== (workspaceId as Id<"workspaces">)) {
      return NextResponse.json(
        { error: "Token not found, revoked, or does not belong to this workspace." },
        { status: 400 },
      );
    }

    const hashed = hashHostedToken(parsed.data.token);
    if (!safeEqualHex(hashed, tokenRecord.tokenHash)) {
      return NextResponse.json({ error: "Invalid hosted token secret." }, { status: 400 });
    }

    let apiKey: string;
    try {
      apiKey = decryptVaultValue(tokenRecord.ciphertext);
    } catch {
      return NextResponse.json({ error: "Could not decrypt stored credential." }, { status: 500 });
    }

    const mc = await validateManyChatApiKey(apiKey);
    if (!mc.ok) {
      return NextResponse.json(
        { error: `ManyChat check failed: ${mc.userFacing}` },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      pageName: mc.pageName,
      accountName: tokenRecord.accountName,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return unauthorized(error.message);
    }
    return NextResponse.json(
      {
        error: clientSafeError(
          error,
          "Connection test failed.",
          error instanceof Error ? error.message : undefined,
        ),
      },
      { status: 400 },
    );
  }
}
