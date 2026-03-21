"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { dashboardPanels, pricingTiers } from "@/lib/site-data";
import { repoBlobUrl } from "@/lib/repo";

function StatusBadge({ status }: { status: "scaffold" | "planned_api" }) {
  const label = status === "scaffold" ? "UI scaffold" : "Planned API";
  const className =
    status === "scaffold"
      ? "bg-amber-500/15 text-amber-900 dark:text-amber-100"
      : "bg-sky-500/15 text-sky-900 dark:text-sky-100";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.14em] ${className}`}>
      {label}
    </span>
  );
}

export function DashboardClient() {
  const searchParams = useSearchParams();
  const checkoutParam = searchParams.get("checkout");

  const viewer = useQuery(api.dashboard.viewer);
  const ensureUser = useMutation(api.users.ensureCurrentUser);
  const createProCheckout = useAction(api.stripeActions.createProSubscriptionCheckout);
  const openBillingPortal = useAction(api.stripeActions.createBillingPortalSession);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await ensureUser();
      } catch (e) {
        if (!cancelled) {
          setBootstrapError(e instanceof Error ? e.message : "Failed to sync user");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureUser]);

  const primaryWorkspace = viewer?.workspaces[0];
  const sessionLine =
    viewer === undefined
      ? "Loading…"
      : viewer === null
        ? "Not authenticated with Convex (check Clerk JWT template “convex” and Convex auth config)."
        : viewer.email ?? viewer.name ?? viewer.clerkUserId;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <section className="card p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">Control plane</p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Workspace dashboard</h1>
            <p className="max-w-3xl text-lg leading-8 muted">
              Clerk handles human sign-in; Convex stores users and workspaces. Pro plan checkout uses Stripe
              (subscription) and webhooks sync <code className="text-sm">plan</code> on the workspace. ManyChat vault
              and MCP tokens are next—see{" "}
              <a
                href={repoBlobUrl("docs/product/control-plane-contracts.md")}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
              >
                control-plane-contracts.md
              </a>{" "}
              and{" "}
              <a
                href={repoBlobUrl("docs/product/action-plan-convex-clerk-stripe.md")}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
              >
                action-plan-convex-clerk-stripe.md
              </a>
              .
            </p>
            {bootstrapError ? (
              <p className="text-sm text-red-600 dark:text-red-400">Convex: {bootstrapError}</p>
            ) : null}
            {checkoutParam === "success" ? (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
                Checkout completed. Stripe may take a moment to confirm—refresh if your plan still shows Free.
              </p>
            ) : null}
            {checkoutParam === "canceled" ? (
              <p className="rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm muted dark:border-white/10">
                Checkout canceled. You can try again anytime.
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.05]">
            <p className="font-semibold">Session</p>
            <p className="mt-1 muted">{sessionLine}</p>
            <p className="mt-3 font-semibold">Primary workspace</p>
            <p className="mt-1 muted">
              {primaryWorkspace
                ? `${primaryWorkspace.name} · Plan: ${primaryWorkspace.plan}`
                : viewer && viewer.workspaces.length === 0
                  ? "No workspace yet (run sync)"
                  : "—"}
            </p>
            {primaryWorkspace && viewer && viewer !== null ? (
              <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
                <p className="font-semibold">Billing</p>
                {billingError ? (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">{billingError}</p>
                ) : null}
                <div className="mt-3 flex flex-col gap-2">
                  {primaryWorkspace.plan === "free" ? (
                    <button
                      type="button"
                      disabled={billingBusy}
                      onClick={async () => {
                        setBillingError(null);
                        setBillingBusy(true);
                        try {
                          const { url } = await createProCheckout({ workspaceId: primaryWorkspace._id });
                          if (url) {
                            window.location.href = url;
                          } else {
                            setBillingError("Stripe did not return a checkout URL.");
                          }
                        } catch (e) {
                          setBillingError(e instanceof Error ? e.message : "Checkout failed");
                        } finally {
                          setBillingBusy(false);
                        }
                      }}
                      className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-black/85 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/85"
                    >
                      {billingBusy ? "Redirecting…" : "Upgrade to Pro — $20/mo"}
                    </button>
                  ) : null}
                  {primaryWorkspace.plan === "pro" && primaryWorkspace.stripeCustomerId ? (
                    <button
                      type="button"
                      disabled={billingBusy}
                      onClick={async () => {
                        setBillingError(null);
                        setBillingBusy(true);
                        try {
                          const { url } = await openBillingPortal({ workspaceId: primaryWorkspace._id });
                          window.location.href = url;
                        } catch (e) {
                          setBillingError(e instanceof Error ? e.message : "Portal failed");
                        } finally {
                          setBillingBusy(false);
                        }
                      }}
                      className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold transition hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10"
                    >
                      {billingBusy ? "Opening…" : "Manage billing (Stripe portal)"}
                    </button>
                  ) : null}
                  {primaryWorkspace.plan === "pro" && !primaryWorkspace.stripeCustomerId ? (
                    <p className="text-xs muted">Pro without Stripe customer id—contact support or re-run checkout.</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {dashboardPanels.map((panel) => (
          <article key={panel.id} className="card flex flex-col p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{panel.title}</h2>
                <p className="mt-2 text-sm leading-6 muted">{panel.description}</p>
              </div>
              <StatusBadge status={panel.status} />
            </div>
            <ul className="mt-5 space-y-2 rounded-xl border border-dashed border-black/12 bg-black/[0.02] px-4 py-3 text-sm dark:border-white/12 dark:bg-white/[0.03]">
              {panel.bullets.map((line) => (
                <li key={line} className="leading-6 muted">
                  • {line}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="card p-6 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Capability bundle (token scope)</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 muted">
              New MCP tokens will pick a bundle: read_only, operator, messaging_safe, or admin. This mirrors MCP tool
              visibility and plan entitlements—see the repo safety model and MCP migration map.
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-200">
            Not enforced in UI yet
          </span>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {["read_only", "operator", "messaging_safe", "admin"].map((bundle) => (
            <div
              key={bundle}
              className="rounded-xl border border-black/8 px-4 py-3 text-sm font-medium dark:border-white/10"
            >
              {bundle}
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">Plans on this workspace</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 muted">
          Stripe sync is not wired yet; plans below mirror the public pricing story.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <article key={tier.name} className="rounded-2xl border border-black/8 p-5 dark:border-white/10">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] muted">{tier.name}</p>
              <p className="mt-2 text-3xl font-semibold">{tier.price}</p>
              <p className="mt-2 text-sm leading-6 muted">{tier.tagline}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
