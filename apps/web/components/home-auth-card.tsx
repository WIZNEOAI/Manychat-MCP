"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const primaryButtonClass = "wiz-button-primary px-5 py-3 text-sm";
const secondaryButtonClass = "wiz-button-secondary px-5 py-3 text-sm";

// Waitlist-only public entry: no sign-up / sign-in CTA while hosted access is in
// private validation. Registering today would create a Clerk account that lands
// on a 404 dashboard wired to a Convex *dev* deployment. Restore the auth
// buttons when a Convex prod deployment exists (not `dusty-lobster-832`) and
// `/dashboard` returns 200. The routes themselves stay live for direct testing.
export function HomeAuthCard() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <div className="card relative overflow-hidden p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at top right, rgba(16, 185, 129, 0.14), transparent 36%), linear-gradient(135deg, rgba(244, 244, 245, 0.05), transparent 42%)",
        }}
      />
      <div className="relative">
        <p className="brand-kicker text-xs">Early access</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          The hosted control plane is in private validation
        </h2>
        <p className="mt-3 text-sm leading-6 muted">
          Workspaces, the encrypted key vault, hosted MCP tokens, and usage are
          not open yet. Join the waitlist and you get the connection details the
          day access opens.
        </p>

        {isLoaded && isSignedIn ? (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <UserButton appearance={{ elements: { avatarBox: "h-10 w-10" } }} />
              <div>
                <p className="text-sm font-semibold">You are signed in</p>
                <p className="text-xs muted">
                  Continue into the dashboard to manage your hosted workspace.
                </p>
              </div>
            </div>
            <Link href="/dashboard" className={primaryButtonClass}>
              Open dashboard
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            <Link href="/#waitlist" className={primaryButtonClass}>
              Join the waitlist
            </Link>
            <Link href="/docs#clients" className={secondaryButtonClass}>
              Self-host the OSS runtime
            </Link>
            <div className="surface-soft rounded-2xl px-4 py-4 text-sm leading-6 muted">
              The OSS CLI and MCP server run on your own ManyChat key today, with
              no account and nothing hosted by us.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
