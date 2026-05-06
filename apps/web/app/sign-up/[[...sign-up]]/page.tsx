import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-6xl items-center px-6 py-12">
      <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="card p-8 md:p-10">
          <p className="brand-kicker text-xs">
            Create your account
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Start with the hosted control plane in a few minutes.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 muted">
            After sign-up, the dashboard will bootstrap your personal workspace,
            connect Clerk to Convex, and give you a clean path to store your
            ManyChat key, mint MCP tokens, and connect an AI client safely.
          </p>
          <div className="mt-6 grid gap-3 text-sm leading-6 muted">
            <div className="surface-soft rounded-2xl px-4 py-4">
              Free tier with generous daily limits and no card required.
            </div>
            <div className="surface-soft rounded-2xl px-4 py-4">
              Supporter plan at $20/month through the official Convex Stripe component.
            </div>
            <div className="surface-soft rounded-2xl px-4 py-4">
              Railway hosts the MCP gateway while Vercel serves the app and API routes.
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/dashboard"
          />
        </section>
      </div>
    </div>
  );
}
