"use client";

import {
  SignInButton,
  SignUpButton,
  useAuth,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";

const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85";

const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-black/15 px-5 py-3 text-sm font-semibold transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10";

export function HomeAuthCard() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <div className="card relative border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-black/50">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">
        Welcome
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
        Start with the hosted control plane
      </h2>
      <p className="mt-3 text-sm leading-6 muted">
        Sign in to create your workspace, store a ManyChat API key in the vault,
        issue an MCP token, and copy the snippet for Claude, Cursor, or Codex.
      </p>

      {!isLoaded ? (
        <div className="mt-6 rounded-2xl border border-dashed border-black/12 px-4 py-4 text-sm muted dark:border-white/12">
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
          <div className="rounded-2xl border border-black/8 px-4 py-4 text-sm leading-6 muted dark:border-white/10">
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
  );
}
