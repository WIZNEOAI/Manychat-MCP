import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { clientSafeError } from "@/lib/server/api-errors";
import { mcpTokenIssueBodySchema, schemaErrorMessage } from "@/lib/server/api-schemas";
import { requireClerkUser, unauthorized } from "@/lib/server/auth";
import { getServerConvexClient } from "@/lib/server/convex";
import { createHostedTokenSecret, hashHostedToken, parseHostedTokenPrefix } from "@/lib/server/hosted";
import { rateLimitAllow } from "@/lib/server/rate-limit";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const clerkUserId = await requireClerkUser();
    const { workspaceId } = await context.params;
    const convex = getServerConvexClient();
    const tokens = await convex.query(api.hosted.getWorkspaceTokens, {
      workspaceId: workspaceId as Id<"workspaces">,
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

export async function POST(request: NextRequest, context: RouteContext) {
  if (!rateLimitAllow(request, "mcp-issue", 30)) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  try {
    const clerkUserId = await requireClerkUser();
    const { workspaceId } = await context.params;
    const raw = await request.json();
    const parsed = mcpTokenIssueBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: schemaErrorMessage(parsed.error) }, { status: 400 });
    }
    const body = parsed.data;

    const secret = createHostedTokenSecret();
    const prefix = parseHostedTokenPrefix(secret);
    if (!prefix) {
      return NextResponse.json({ error: "Failed to generate MCP token." }, { status: 500 });
    }

    const convex = getServerConvexClient();
    const token = await convex.mutation(api.hosted.issueMcpToken, {
      workspaceId: workspaceId as Id<"workspaces">,
      clerkUserId,
      accountId: (body.accountId ?? null) as Id<"manychatAccounts"> | null,
      name: body.name,
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
      {
        error: clientSafeError(
          error,
          "Failed to issue token.",
          error instanceof Error ? error.message : undefined,
        ),
      },
      { status: 400 },
    );
  }
}
