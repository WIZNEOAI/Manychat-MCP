"use client";

import {
  SignInButton,
  SignUpButton,
  useAuth,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { REPO_TREE_BASE } from "@/lib/repo";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Docs" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

const authButtonClass =
  "wiz-button-secondary px-3 py-1.5 text-sm font-medium";

export function SiteHeader() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-[rgba(13,13,13,0.84)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="group flex flex-col leading-tight">
          <span className="text-xs font-semibold tracking-[0.22em] text-[var(--primary)]">
            MANYCHAT
          </span>
          <span className="text-[11px] text-white/[0.55] transition group-hover:text-white/[0.78]">
            CLI + MCP
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm text-white/[0.72] sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 transition hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={REPO_TREE_BASE}
            target="_blank"
            rel="noreferrer"
            className="brand-link rounded-full px-3 py-1.5 font-medium hover:bg-[rgba(0,255,136,0.08)]"
          >
            GitHub
          </a>
          {!isLoaded ? (
            <span className="px-3 py-1.5 text-xs muted">...</span>
          ) : isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full px-3 py-1.5 font-medium transition hover:bg-white/[0.06] hover:text-white"
              >
                Workspace
              </Link>
              <UserButton
                appearance={{
                  elements: { avatarBox: "h-8 w-8" },
                }}
              />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className={authButtonClass}
                >
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="wiz-button-primary px-3 py-1.5 text-sm font-medium"
                >
                  Create account
                </button>
              </SignUpButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
