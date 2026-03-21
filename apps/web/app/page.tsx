import Link from "next/link";
import {
  dashboardRoadmap,
  docsLinks,
  pricingTiers,
  productSurfaces,
  supportedClients,
} from "@/lib/site-data";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-12 md:py-16">
      <section className="card overflow-hidden p-8 md:p-12">
        <div className="grid gap-10 md:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-emerald-600/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              CLI-first • remote MCP • self-host + hosted path
            </span>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
              ManyChat for coding agents and remote MCP clients.
            </h1>
            <p className="max-w-2xl text-lg leading-8 muted">
              Bring your ManyChat API key, operate safely from the CLI, and connect
              remote clients like Claude, Cursor, Codex, and Antigravity through a
              production HTTP MCP endpoint.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/docs"
                className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85"
              >
                Read deployment docs
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                View dashboard scaffold
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">
              Supported clients
            </p>
            <ul className="mt-4 grid gap-3 text-sm">
              {supportedClients.map((client) => (
                <li
                  key={client}
                  className="rounded-2xl border border-black/8 px-4 py-3 dark:border-white/10"
                >
                  {client}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm muted">
              Hosted mode will handle client auth and workspace routing, while the
              ManyChat API key remains the execution credential underneath.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">
            Product surfaces
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">One runtime, multiple ways to use it.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {productSurfaces.map((surface) => (
            <article key={surface.name} className="card p-6">
              <div className="flex items-center justify-between gap-4">
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

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">
            Docs-ready onboarding
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Make self-hosted setup obvious.</h2>
          <div className="mt-5 grid gap-4">
            {docsLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="rounded-2xl border border-black/8 px-4 py-4 transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
              >
                <p className="font-semibold">{link.title}</p>
                <p className="mt-2 text-sm leading-6 muted">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">
            Dashboard direction
          </p>
          <h2 className="mt-2 text-2xl font-semibold">The control-plane shell starts here.</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 muted">
            {dashboardRoadmap.map((item) => (
              <li key={item} className="rounded-2xl border border-black/8 px-4 py-3 dark:border-white/10">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">
            Hosted pricing direction
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">Free to adopt, paid to scale and support the OSS core.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <article key={tier.name} className="card flex flex-col gap-5 p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] muted">{tier.name}</p>
                <h3 className="text-3xl font-semibold">{tier.price}</h3>
                <p className="text-sm leading-6 muted">{tier.tagline}</p>
              </div>
              <ul className="space-y-2 text-sm leading-6 muted">
                {tier.limits.map((limit) => (
                  <li key={limit}>- {limit}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
