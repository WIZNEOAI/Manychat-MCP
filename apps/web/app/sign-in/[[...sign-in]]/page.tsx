import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-6xl items-center px-6 py-12">
      <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="card p-8 md:p-10">
          <p className="brand-kicker text-xs">
            Welcome back
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Sign in to manage your hosted ManyChat workspace.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 muted">
            Clerk handles account access, Convex stores the workspace state, and
            the hosted MCP gateway on Railway uses product tokens so your AI
            clients never need the raw ManyChat API key.
          </p>
          <div className="mt-6 grid gap-3 text-sm leading-6 muted">
            <div className="surface-soft rounded-2xl px-4 py-4">
              Save a ManyChat API key once and keep it encrypted at rest.
            </div>
            <div className="surface-soft rounded-2xl px-4 py-4">
              Issue hosted MCP bearer tokens for Claude, Cursor, and Codex.
            </div>
            <div className="surface-soft rounded-2xl px-4 py-4">
              Upgrade to Supporter with Stripe when you need higher hosted limits.
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
          />
        </section>
      </div>
    </div>
  );
}
