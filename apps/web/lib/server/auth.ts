import { auth } from "@clerk/nextjs/server";
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

  if (!expected || !actual || actual !== expected) {
    throw new Error("Invalid internal secret");
  }
}

export function unauthorized(message: string) {
  return NextResponse.json({ error: message }, { status: 401 });
}
