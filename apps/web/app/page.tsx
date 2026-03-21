import Link from "next/link";
import {
  credentialLanes,
  dashboardRoadmap,
  docsLinks,
  executionFlowSteps,
  pricingTiers,
  productSurfaces,
  selfHostVsHosted,
  supportedClients,
} from "@/lib/site-data";
import { REPO_TREE_BASE } from "@/lib/repo";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12 md:gap-20 md:py-16">
      <section className="card relative overflow-hidden p-8 md:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(16, 185, 129, 0.22), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 20%, rgba(59, 130, 246, 0.12), transparent 50%)",
          }}
        />
        <div className="relative grid gap-10 md:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-emerald-600/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-200">
              CLI-first · MCP compatible · OSS + hosted path
            </span>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl md:leading-[1.05]">
              The agent-ready layer for ManyChat operations.
            </h1>
            <p className="max-w-2xl text-lg leading-8 muted">
              Use the <span className="font-semibold text-[var(--foreground)]">manychat</span> CLI for automation,
              add <span className="font-semibold text-[var(--foreground)]">stdio MCP</span> for local coding agents, or
              run <span className="font-semibold text-[var(--foreground)]">HTTP MCP</span> on your infra. The ManyChat
              API key stays the execution credential; hosted mode adds vaulting and product tokens without changing
              the core runtime.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/docs"
                className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85"
              >
                Deployment & client docs
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-black/15 px-5 py-3 text-sm font-semibold transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                Control plane preview
              </Link>
              <a
                href={REPO_TREE_BASE}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-transparent px-5 py-3 text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline dark:text-emerald-200"
              >
                Source on GitHub
              </a>
            </div>
          </div>

          <div className="card relative border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-black/50">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">Remote MCP clients</p>
            <ul className="mt-4 grid gap-2 text-sm">
              {supportedClients.map((client) => (
                <li
                  key={client}
                  className="rounded-xl border border-black/8 px-4 py-2.5 dark:border-white/10"
                >
                  {client}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-6 muted">
              Streamable HTTP MCP is the flagship remote connection. Self-host today; hosted adds workspace routing,
              encrypted keys, and usage limits.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        {executionFlowSteps.map((item) => (
          <article key={item.step} className="card p-6">
            <p className="text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{item.step}</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 muted">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">Surfaces</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Same runtime. Pick how you connect.</h2>
          <p className="max-w-3xl text-lg leading-8 muted">
            Nothing here replaces the CLI—the command tree and JSON contracts remain the source of truth. MCP is
            packaging and transport for agents that speak MCP.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {productSurfaces.map((surface) => (
            <article key={surface.name} className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold">{surface.name}</h3>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] dark:bg-white/10">
                  {surface.status}
                </span>
              </div>
              <p className="mt-3 leading-7 muted">{surface.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">Deployment choice</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Self-host now. Hosted when you want polish.</h2>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10">
                <th className="px-5 py-4 font-semibold">Topic</th>
                <th className="px-5 py-4 font-semibold">Self-host (OSS)</th>
                <th className="px-5 py-4 font-semibold">Hosted (planned)</th>
              </tr>
            </thead>
            <tbody>
              {selfHostVsHosted.map((row) => (
                <tr key={row.dimension} className="border-b border-black/8 last:border-0 dark:border-white/10">
                  <td className="px-5 py-4 font-medium">{row.dimension}</td>
                  <td className="px-5 py-4 leading-6 muted">{row.selfHost}</td>
                  <td className="px-5 py-4 leading-6 muted">{row.hosted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">Credentials</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Two different keys, one execution story.</h2>
          <p className="max-w-3xl text-lg leading-8 muted">
            Confusing these breaks onboarding. We keep them explicit everywhere: ManyChat keys execute API calls;
            hosted MCP tokens govern access to your workspace.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {credentialLanes.map((lane) => (
            <article key={lane.title} className="card flex flex-col gap-3 p-6">
              <div>
                <h3 className="text-lg font-semibold">{lane.title}</h3>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                  {lane.subtitle}
                </p>
              </div>
              <p className="text-sm leading-6 muted">{lane.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="card p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">Docs in the repo</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Everything you need to go live.</h2>
          <div className="mt-6 grid gap-3">
            {docsLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="rounded-2xl border border-black/8 px-4 py-4 transition hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/[0.04]"
              >
                <p className="font-semibold">{link.title}</p>
                <p className="mt-2 text-sm leading-6 muted">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">Dashboard roadmap</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Where the hosted control plane is heading.</h2>
          <ul className="mt-6 space-y-3 text-sm leading-6 muted">
            {dashboardRoadmap.map((item) => (
              <li key={item} className="rounded-2xl border border-black/8 px-4 py-3 dark:border-white/10">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">Hosted pricing (initial)</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Free to try, Supporter at $20, Pro for teams.</h2>
          <p className="max-w-3xl text-lg leading-8 muted">
            OSS stays fully usable without an account. Hosted tiers add convenience, concurrency, and support—not a
            wall around the runtime.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <article key={tier.name} className="card flex flex-col gap-5 p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] muted">{tier.name}</p>
                <h3 className="text-3xl font-semibold">{tier.price}</h3>
                <p className="text-sm leading-6 muted">{tier.tagline}</p>
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">{tier.cta}</p>
              </div>
              <ul className="space-y-2 text-sm leading-6 muted">
                {tier.limits.map((limit) => (
                  <li key={limit} className="flex gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                    <span>{limit}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
