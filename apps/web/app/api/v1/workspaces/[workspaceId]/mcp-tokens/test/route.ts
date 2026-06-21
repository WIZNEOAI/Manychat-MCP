import { NextResponse, type NextRequest } from "next/server";
import type { Id } from "@/convex/_generated/dataModel";
import { clientSafeError } from "@/lib/server/api-errors";
import { mcpTokenTestBodySchema, schemaErrorMessage } from "@/lib/server/api-schemas";
import { requireClerkSession, unauthorized } from "@/lib/server/auth";
import { callControlPlane } from "@/lib/server/convex";
import {
  decryptVaultValue,
  hashHostedToken,
  parseHostedTokenPrefix,
  safeEqualHex,
  type GatewayTokenRecord,
} from "@/lib/server/hosted";
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
    // Validates a Clerk session exists. The token-to-workspace binding is verified
    // below (the token must belong to the requested workspace); user-to-workspace
    // ownership is not enforced here, since testing requires possession of the full token.
    await requireClerkSession();
    const { workspaceId } = await context.params;
    const raw = await request.json();
    const parsed = mcpTokenTestBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: schemaErrorMessage(parsed.error) }, { status: 400 });
    }

    const prefix = parseHostedTokenPrefix(parsed.data.token);
    if (!prefix) {
      return NextResponse.json({ error: "Invalid hosted token format." }, { status: 400 });
    }

    const tokenRecord = await callControlPlane<GatewayTokenRecord | null>(
      "/internal/mcp/resolve-token",
      { prefix },
    );
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
    if (error instanceof Error && (error.message === "Authentication required" || error.message === "Convex auth token required")) {
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
