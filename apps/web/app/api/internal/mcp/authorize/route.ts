import { NextResponse, type NextRequest } from "next/server";
import { clientSafeError } from "@/lib/server/api-errors";
import { internalAuthorizeBodySchema, schemaErrorMessage } from "@/lib/server/api-schemas";
import { assertInternalSecret } from "@/lib/server/auth";
import { callControlPlane } from "@/lib/server/convex";
import { rateLimitAllow } from "@/lib/server/rate-limit";

type AuthorizeResult = {
  ok: boolean;
  dailyRequestCount: number;
  monthlyRequestCount: number;
};

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

    const result = await callControlPlane<AuthorizeResult>("/internal/mcp/authorize", {
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

    const safeMessage =
      status === 400
        ? clientSafeError(error, "Failed to authorize request.", message)
        : message;

    return NextResponse.json({ error: safeMessage }, { status });
  }
}
