import { NextResponse } from "next/server";
import { hashIp, parseWaitlistInput, saveWaitlistLead } from "@/lib/server/waitlist";
import { sendWaitlistConfirmation } from "@/lib/server/waitlist-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body." }, { status: 400 });
  }

  const input = parseWaitlistInput(body);
  if (!input) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  let outcome: Awaited<ReturnType<typeof saveWaitlistLead>>;
  try {
    outcome = await saveWaitlistLead(input, { ipHash: hashIp(clientIp(request)) });
  } catch (error) {
    console.error("waitlist_save_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "We could not save your spot. Try again in a moment." },
      { status: 502 },
    );
  }

  // The lead is already stored; a failed email must not turn into a failed request.
  if (outcome === "created") {
    const email = await sendWaitlistConfirmation(input.email, input.name);
    if (!email.sent) {
      console.error("waitlist_email_failed", { reason: email.reason });
    }
  }

  return NextResponse.json({ outcome }, { status: 200 });
}
