import { NextResponse, type NextRequest } from "next/server";
import { clientSafeError } from "@/lib/server/api-errors";
import { internalRecordBodySchema, schemaErrorMessage } from "@/lib/server/api-schemas";
import { assertInternalSecret } from "@/lib/server/auth";
import { callControlPlane } from "@/lib/server/convex";
import { rateLimitAllow } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest) {
  if (!rateLimitAllow(request, "internal-record", 600)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    assertInternalSecret(request);
    const raw = await request.json();
    const parsed = internalRecordBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: schemaErrorMessage(parsed.error) }, { status: 400 });
    }
    const body = parsed.data;

    await callControlPlane("/internal/mcp/record-event", {
      workspaceId: body.workspaceId,
      tokenId: body.tokenId,
      type: body.type,
      requestCount: body.requestCount,
      metadataJson: body.metadata ? JSON.stringify(body.metadata) : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid internal secret") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: clientSafeError(error, "Failed to record event.") },
      { status: 400 },
    );
  }
}
