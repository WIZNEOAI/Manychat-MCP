import type { Metadata } from "next";
import { dashboardPanels, pricingTiers } from "@/lib/site-data";
import { repoBlobUrl } from "@/lib/repo";

export const metadata: Metadata = {
  title: "Dashboard",
};

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

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <section className="card p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">Control plane preview</p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Workspace dashboard (scaffold)</h1>
            <p className="max-w-3xl text-lg leading-8 muted">
              This screen maps to the hosted product: workspaces, members, ManyChat accounts, encrypted vault, MCP
              tokens, and usage meters. Data is illustrative until <code className="text-sm">apps/api</code> exists;
              see{" "}
              <a
                href={repoBlobUrl("docs/product/control-plane-contracts.md")}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
              >
                control-plane-contracts.md
              </a>{" "}
              for routes and entity shapes.
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.05]">
            <p className="font-semibold">Session</p>
            <p className="mt-1 muted">Sign-in not wired (planned)</p>
            <p className="mt-3 font-semibold">Workspace</p>
            <p className="mt-1 muted">Acme Growth · Plan: Free</p>
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
          Mirrors the public pricing story. Enforcement happens in the future API + gateway, not in this static page.
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
