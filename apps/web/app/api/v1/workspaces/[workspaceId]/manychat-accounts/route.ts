import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { requireClerkUser, unauthorized } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";
import { encryptVaultValue } from "@/lib/server/hosted";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const clerkUserId = await requireClerkUser();
    const { workspaceId } = await context.params;
    const body = (await request.json()) as {
      displayName?: string;
      apiKey?: string;
      isDefault?: boolean;
    };

    if (!body.displayName?.trim() || !body.apiKey?.trim()) {
      return NextResponse.json(
        { error: "displayName and apiKey are required." },
        { status: 400 },
      );
    }

    const convex = getServerConvexClient();
    const encrypted = encryptVaultValue(body.apiKey.trim());
    const result = await convex.mutation(api.hosted.upsertManychatAccount, {
      workspaceId: workspaceId as Id<"workspaces">,
      clerkUserId,
      displayName: body.displayName.trim(),
      ciphertext: encrypted.ciphertext,
      keyVersion: encrypted.keyVersion,
      isDefault: body.isDefault ?? true,
    });

    return NextResponse.json({ ok: true, account: result });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return unauthorized(error.message);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save ManyChat account." },
      { status: 400 },
    );
  }
}
