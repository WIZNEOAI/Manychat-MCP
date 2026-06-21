import { auth } from "@clerk/nextjs/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

export async function requireClerkSession() {
  const { userId, getToken } = await auth();
  if (!userId) {
    throw new Error("Authentication required");
  }

  const convexToken = await getToken({ template: "convex" });
  if (!convexToken) {
    throw new Error("Convex auth token required");
  }

  return { userId, convexToken };
}

export async function requireClerkUser() {
  const { userId } = await requireClerkSession();
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
export function requireInternalControlPlaneSecret(): string {
  const secret =
    process.env.MCP_INTERNAL_SHARED_SECRET ??
    process.env.HOSTED_CONTROL_PLANE_SECRET;
  if (!secret) {
    throw new Error("Internal control plane secret is not configured");
  }
  return secret;
}


function safeEqualSecret(actual: string, expected: string): boolean {
  const actualHash = createHash("sha256").update(actual).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export function unauthorized(message: string) {
  return NextResponse.json({ error: message }, { status: 401 });
}
