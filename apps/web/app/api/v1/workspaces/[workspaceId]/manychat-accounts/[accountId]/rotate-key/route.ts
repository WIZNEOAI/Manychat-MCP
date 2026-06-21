import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { clientSafeError } from "@/lib/server/api-errors";
import {
  manychatRotateKeyBodySchema,
  schemaErrorMessage,
} from "@/lib/server/api-schemas";
import { requireClerkSession, unauthorized } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";
import { encryptVaultValue } from "@/lib/server/hosted";
import { validateManyChatApiKey } from "@/lib/server/manychat-validate";
import { rateLimitAllow } from "@/lib/server/rate-limit";

type RouteContext = {
  params: Promise<{ workspaceId: string; accountId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  if (!rateLimitAllow(request, "manychat-rotate", 30)) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  try {
    const { convexToken } = await requireClerkSession();
    const { workspaceId, accountId } = await context.params;
    const raw = await request.json();
    const parsed = manychatRotateKeyBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: schemaErrorMessage(parsed.error) }, { status: 400 });
    }
    const body = parsed.data;

    const validation = await validateManyChatApiKey(body.apiKey);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.userFacing }, { status: 400 });
    }

    const convex = getServerConvexClient(convexToken);
    const encrypted = encryptVaultValue(body.apiKey);
    const result = await convex.mutation(api.hosted.rotateManychatCredential, {
      workspaceId: workspaceId as Id<"workspaces">,
      accountId: accountId as Id<"manychatAccounts">,
      ciphertext: encrypted.ciphertext,
      keyVersion: encrypted.keyVersion,
      manychatPageName: validation.pageName,
      keyValidatedAt: validation.validatedAt,
    });

    return NextResponse.json({ ok: true, account: result });
  } catch (error) {
    if (error instanceof Error && (error.message === "Authentication required" || error.message === "Convex auth token required")) {
      return unauthorized(error.message);
    }
    return NextResponse.json(
      {
        error: clientSafeError(
          error,
          "Failed to rotate key.",
          error instanceof Error ? error.message : undefined,
        ),
      },
      { status: 400 },
    );
  }
}
