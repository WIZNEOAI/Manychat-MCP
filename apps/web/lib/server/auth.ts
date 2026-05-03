import { auth } from "@clerk/nextjs/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

export async function requireClerkUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
}

export function assertInternalSecret(request: NextRequest): void {
  const expected =
    process.env.MCP_INTERNAL_SHARED_SECRET ??
    process.env.HOSTED_CONTROL_PLANE_SECRET;
  const actual = request.headers.get("x-manychat-internal-secret");

  if (!expected || !actual || !safeEqualSecret(actual, expected)) {
    throw new Error("Invalid internal secret");
  }
}

function safeEqualSecret(actual: string, expected: string): boolean {
  const actualHash = createHash("sha256").update(actual).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export function unauthorized(message: string) {
  return NextResponse.json({ error: message }, { status: 401 });
}
