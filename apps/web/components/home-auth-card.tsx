"use client";

import {
  SignInButton,
  SignUpButton,
  useAuth,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";

const primaryButtonClass = "wiz-button-primary px-5 py-3 text-sm";
const secondaryButtonClass = "wiz-button-secondary px-5 py-3 text-sm";

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
        <p className="brand-kicker text-xs">Welcome</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Start with the hosted control plane
        </h2>
        <p className="mt-3 text-sm leading-6 muted">
          Sign in to create your workspace, store a ManyChat API key in the vault,
          issue an MCP token, and copy the snippet for Claude, Cursor, or Codex.
        </p>

        {!isLoaded ? (
          <div className="surface-dashed mt-6 rounded-2xl px-4 py-4 text-sm muted">
            Loading authentication...
          </div>
        ) : !isSignedIn ? (
          <div className="mt-6 grid gap-3">
            <SignUpButton mode="modal">
              <button type="button" className={primaryButtonClass}>
                Create account
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button type="button" className={secondaryButtonClass}>
                Sign in
              </button>
            </SignInButton>
            <div className="surface-soft rounded-2xl px-4 py-4 text-sm leading-6 muted">
              Use the dashboard to connect Clerk, Convex, Stripe, and the hosted
              Railway MCP gateway. The OSS CLI still works with no account.
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
