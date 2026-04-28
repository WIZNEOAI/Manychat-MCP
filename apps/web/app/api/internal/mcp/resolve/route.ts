import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import { clientSafeError } from "@/lib/server/api-errors";
import { internalHostedTokenBodySchema, schemaErrorMessage } from "@/lib/server/api-schemas";
import { assertInternalSecret } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";
import {
  decryptVaultValue,
  hashHostedToken,
  parseHostedTokenPrefix,
  safeEqualHex,
} from "@/lib/server/hosted";
import { rateLimitAllow } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest) {
  if (!rateLimitAllow(request, "internal-resolve", 120)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    assertInternalSecret(request);
    const raw = await request.json();
    const parsed = internalHostedTokenBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: schemaErrorMessage(parsed.error) }, { status: 400 });
    }
    const body = parsed.data;

    const prefix = parseHostedTokenPrefix(body.token);
    if (!prefix) {
      return NextResponse.json({ error: "Invalid hosted token format." }, { status: 401 });
    }

    const convex = getServerConvexClient();
    const tokenRecord = await convex.query(api.hosted.getGatewayTokenByPrefix, { prefix });
    if (!tokenRecord) {
      return NextResponse.json({ error: "Token not found or revoked." }, { status: 401 });
    }

    const hashed = hashHostedToken(body.token);
    if (!safeEqualHex(hashed, tokenRecord.tokenHash)) {
      await convex.mutation(api.hosted.recordGatewayEvent, {
        workspaceId: tokenRecord.workspaceId,
        tokenId: tokenRecord.tokenId,
        type: "auth_failure",
        metadataJson: JSON.stringify({ prefix }),
      });
      return NextResponse.json({ error: "Invalid hosted token." }, { status: 401 });
    }

    const apiKey = decryptVaultValue(tokenRecord.ciphertext);
    if (tokenRecord.usage.dailyRequestCount >= tokenRecord.limits.dailyRequests) {
      return NextResponse.json(
        {
          error: `Daily request limit reached for workspace ${tokenRecord.workspaceName}.`,
        },
        { status: 429 },
      );
    }

    if (tokenRecord.usage.monthlyRequestCount >= tokenRecord.limits.monthlyRequests) {
      return NextResponse.json(
        {
          error: `Monthly request limit reached for workspace ${tokenRecord.workspaceName}.`,
        },
        { status: 429 },
      );
    }

    return NextResponse.json({
      workspaceId: tokenRecord.workspaceId,
      workspaceName: tokenRecord.workspaceName,
      tokenId: tokenRecord.tokenId,
      accountId: tokenRecord.accountId,
      accountName: tokenRecord.accountName,
      apiKey,
      plan: tokenRecord.plan,
      capabilityBundle: tokenRecord.bundle,
      limits: tokenRecord.limits,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid internal secret") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      {
        error: clientSafeError(
          error,
          "Failed to resolve token.",
          error instanceof Error ? error.message : undefined,
        ),
      },
      { status: 400 },
    );
  }
}
