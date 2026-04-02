import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import { requireClerkUser, unauthorized } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";
import { encryptVaultValue } from "@/lib/server/hosted";

export async function POST(request: NextRequest, context: any) {
  try {
    const clerkUserId = await requireClerkUser();
    const { workspaceId, accountId } = await context.params;
    const body = (await request.json()) as { apiKey?: string };
    if (!body.apiKey?.trim()) {
      return NextResponse.json({ error: "apiKey is required." }, { status: 400 });
    }

    const convex = getServerConvexClient();
    const encrypted = encryptVaultValue(body.apiKey.trim());
    const result = await convex.mutation(api.hosted.rotateManychatCredential, {
      workspaceId,
      clerkUserId,
      accountId,
      ciphertext: encrypted.ciphertext,
      keyVersion: encrypted.keyVersion,
    });

    return NextResponse.json({ ok: true, account: result });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return unauthorized(error.message);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to rotate key." },
      { status: 400 },
    );
  }
}
