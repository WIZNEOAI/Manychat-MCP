import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import { requireClerkUser, unauthorized } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";
import { createHostedTokenSecret, hashHostedToken, parseHostedTokenPrefix } from "@/lib/server/hosted";

export async function GET(_request: NextRequest, context: any) {
  try {
    const clerkUserId = await requireClerkUser();
    const { workspaceId } = await context.params;
    const convex = getServerConvexClient();
    const tokens = await convex.query(api.hosted.getWorkspaceTokens, {
      workspaceId,
      clerkUserId,
    });
    return NextResponse.json({ ok: true, tokens });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return unauthorized(error.message);
    }
    return NextResponse.json({ error: "Failed to load MCP tokens." }, { status: 400 });
  }
}

export async function POST(request: NextRequest, context: any) {
  try {
    const clerkUserId = await requireClerkUser();
    const { workspaceId } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      bundle?: "read_only" | "operator" | "messaging_safe" | "admin";
      accountId?: string | null;
    };

    if (!body.name?.trim() || !body.bundle) {
      return NextResponse.json({ error: "name and bundle are required." }, { status: 400 });
    }

    const secret = createHostedTokenSecret();
    const prefix = parseHostedTokenPrefix(secret);
    if (!prefix) {
      return NextResponse.json({ error: "Failed to generate MCP token." }, { status: 500 });
    }

    const convex = getServerConvexClient();
    const token = await convex.mutation(api.hosted.issueMcpToken, {
      workspaceId,
      clerkUserId,
      accountId: body.accountId ?? null,
      name: body.name.trim(),
      bundle: body.bundle,
      prefix,
      tokenHash: hashHostedToken(secret),
    });

    return NextResponse.json({
      ok: true,
      token,
      secret,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return unauthorized(error.message);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to issue token." },
      { status: 400 },
    );
  }
}
