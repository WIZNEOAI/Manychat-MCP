import { dashboardRoadmap, pricingTiers } from "@/lib/site-data";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <section className="card p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">
          Dashboard scaffold
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Hosted control plane: initial shape, not the full SaaS yet.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 muted">
          This page is the shell for the future hosted experience: workspace auth,
          encrypted ManyChat API key storage, MCP token issuance, client snippets,
          usage limits, and billing. Phase 0 keeps the runtime OSS-first and
          self-hostable.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card p-6">
          <h2 className="text-2xl font-semibold">What the hosted dashboard should do</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 muted">
            {dashboardRoadmap.map((item) => (
              <li key={item} className="rounded-2xl border border-black/8 px-4 py-3 dark:border-white/10">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="text-2xl font-semibold">Workspace auth boundary</h2>
          <div className="mt-5 space-y-4 text-sm leading-7 muted">
            <p>
              In hosted mode, the user authenticates with the control plane, saves
              a ManyChat API key to a workspace vault, and receives MCP credentials
              for client connections.
            </p>
            <p>
              The upstream ManyChat API key remains the execution credential. The
              hosted token becomes the product credential for routing, limits,
              auditing, and billing.
            </p>
            <p>
              That separation keeps the CLI and self-host story simple while making
              the hosted product safer for teams.
            </p>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-2xl font-semibold">Initial hosted plans</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
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
