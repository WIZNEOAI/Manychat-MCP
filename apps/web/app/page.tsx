import { HomeAuthCard } from "@/components/home-auth-card";
import {
  AccentCard,
  CtaLink,
  CodeWindow,
  ExternalCta,
  PricingBadge,
  SectionHeader,
} from "@/components/landing-primitives";
import {
  buyerPainCards,
  doneForYou,
  heroContent,
  offerTiers,
  operatorStory,
  ossStory,
} from "@/lib/positioning";
import { REPO_TREE_BASE } from "@/lib/repo";
import { WaitlistForm } from "@/components/waitlist-form";

export default function Home() {
  const operatorTier = offerTiers.find((tier) => tier.name === "Pro");

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-24 px-4 py-12 md:px-6 md:py-20">
      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
        <AccentCard className="min-h-[620px]">
          <div className="relative flex h-full flex-col justify-between overflow-hidden p-8 md:p-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-80"
              aria-hidden
              style={{
                background:
                  "radial-gradient(ellipse 75% 50% at 10% 0%, rgba(0,255,136,0.18), transparent 60%), radial-gradient(ellipse 60% 35% at 90% 20%, rgba(244,247,242,0.08), transparent 62%)",
              }}
            />
            <div className="relative space-y-7">
              <span className="brand-badge px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]">
                {heroContent.eyebrow}
              </span>
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-balance md:text-7xl md:leading-[0.95]">
                {heroContent.title}
              </h1>
              <p className="max-w-2xl text-lg leading-8 muted md:text-xl">{heroContent.body}</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CtaLink href="#operator-offer">{heroContent.primaryCta}</CtaLink>
                <CtaLink href="#system-map" variant="secondary">
                  {heroContent.secondaryCta}
                </CtaLink>
                <ExternalCta href={REPO_TREE_BASE} target="_blank" rel="noreferrer">
                  GitHub source
                </ExternalCta>
              </div>
            </div>

            <div className="relative mt-12 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {heroContent.railLabels.map((label) => (
                <div key={label} className="surface-soft rounded-2xl px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                    Active rail
                  </p>
                  <p className="mt-2 text-base font-medium text-[var(--foreground)]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </AccentCard>

        <div className="grid gap-6 lg:grid-rows-[1fr_auto]">
          <AccentCard>
            <div className="p-6 md:p-8">
              <p className="brand-kicker text-xs">System proof</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Real operator rails, not generic AI marketing.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 muted md:text-base">
                Keep the OSS runtime visible while the paid offer wraps the handoff,
                routing, and accountability layer around it.
              </p>
              <div className="mt-6">
                <CodeWindow />
              </div>
            </div>
          </AccentCard>
          <HomeAuthCard />
        </div>
      </section>

      <section className="space-y-8">
        <SectionHeader
          eyebrow="Why the handoff breaks"
          title="Most funnels do not fail at lead generation. They fail in the handoff."
          body="The offer is built around the operational gap between lead capture, routing, response time, and human takeover."
          align="split"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {buyerPainCards.map((card) => (
            <article key={card.title} className="card p-6 md:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                Buyer pain
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">{card.title}</h3>
              <p className="mt-4 text-sm leading-6 muted">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="system-map" className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="card p-7 md:p-9">
          <SectionHeader
            eyebrow="Solution rails"
            title="The operating system sits between capture and booked conversation."
            body={operatorStory.body}
          />
          <ul className="mt-7 grid gap-3 text-sm leading-6 muted">
            {heroContent.railLabels.map((label) => (
              <li key={label} className="surface-soft rounded-2xl px-4 py-4">
                {label}
              </li>
            ))}
          </ul>
        </div>

        <AccentCard>
          <div className="flex h-full flex-col gap-7 p-7 md:p-9">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="brand-kicker text-xs">Operator story</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{operatorStory.title}</h2>
              </div>
              <PricingBadge>{operatorTier?.badge ?? "Paid layer"}</PricingBadge>
            </div>
            <p className="max-w-2xl text-lg leading-8 muted">{operatorStory.body}</p>
            <div className="grid gap-4 md:grid-cols-3">
              {operatorStory.bullets.map((item) => (
                <div key={item} className="surface-soft rounded-2xl px-4 py-4 text-sm font-medium leading-6">
                  {item}
                </div>
              ))}
            </div>
            <div className="surface-dashed rounded-3xl px-5 py-5 text-sm leading-6 muted">
              The paid layer is not generic hosting. It is the delivery wrapper around
              response speed, routing rules, and human takeover points.
            </div>
          </div>
        </AccentCard>
      </section>

      <section id="operator-offer" className="space-y-8">
        <SectionHeader
          eyebrow="Offer ladder"
          title="Run the OSS core today. The Revenue Operator layer opens next."
          body="The copy and prices come from shared positioning data so docs, dashboard, and sales surfaces can mirror the same promise. Hosted plans are not open for signup yet — the waitlist is the way in."
          align="split"
        />
        <div className="pricing-grid">
          {offerTiers.map((tier) => (
            <AccentCard key={tier.name} className={tier.badge ? "lg:-translate-y-3" : ""}>
              <div className="flex h-full flex-col gap-7 p-7 md:p-9">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] muted">{tier.name}</p>
                    <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
                      <h3 className="text-5xl font-semibold tracking-tight">{tier.monthlyPrice}</h3>
                      {tier.annualPrice !== tier.monthlyPrice ? <p className="text-sm font-medium text-[var(--primary)]">{tier.annualPrice}</p> : null}
                    </div>
                  </div>
                  {tier.badge ? <PricingBadge>{tier.badge}</PricingBadge> : null}
                </div>
                <p className="text-base leading-7 muted">{tier.audience}</p>
                <ul className="grid gap-3 text-sm leading-6 muted">
                  {tier.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="text-[var(--primary)]">—</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto border-t border-white/10 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Next step</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{tier.cta}</p>
                </div>
              </div>
            </AccentCard>
          ))}
        </div>
      </section>

      <section id="done-for-you" className="space-y-8">
        <SectionHeader
          eyebrow={doneForYou.eyebrow}
          title={doneForYou.title}
          body={doneForYou.body}
          align="split"
        />
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <AccentCard>
            <div className="flex h-full flex-col justify-between gap-8 p-7 md:p-9">
              <div>
                <PricingBadge>Highest leverage</PricingBadge>
                <div className="mt-6 flex items-baseline gap-2">
                  <h3 className="text-6xl font-semibold tracking-tight">{doneForYou.price}</h3>
                  <span className="text-lg muted">{doneForYou.cadence}</span>
                </div>
                <p className="mt-5 text-base leading-7 muted">{doneForYou.note}</p>
              </div>
              <ExternalCta href={doneForYou.ctaHref} target="_blank" rel="noreferrer">
                {doneForYou.cta}
              </ExternalCta>
            </div>
          </AccentCard>
          <div className="card p-7 md:p-9">
            <p className="brand-kicker text-xs">What it includes</p>
            <ul className="mt-6 grid gap-3 text-sm leading-6">
              {doneForYou.includes.map((item) => (
                <li key={item} className="surface-soft flex gap-3 rounded-2xl px-4 py-4">
                  <span className="text-[var(--primary)]">—</span>
                  <span className="text-[var(--foreground)]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-7 md:p-9">
          <p className="brand-kicker text-xs">OSS wedge</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{ossStory.title}</h2>
          <p className="mt-4 text-lg leading-8 muted">{ossStory.body}</p>
          <ul className="mt-7 grid gap-3 text-sm leading-6 muted">
            {ossStory.bullets.map((bullet) => (
              <li key={bullet} className="surface-soft rounded-2xl px-4 py-4">
                {bullet}
              </li>
            ))}
          </ul>
          <div className="mt-7">
            <ExternalCta href={REPO_TREE_BASE} target="_blank" rel="noreferrer">
              Use the OSS core
            </ExternalCta>
          </div>
        </div>

        <AccentCard>
          <div className="flex h-full flex-col gap-7 p-7 md:p-9">
            <div>
              <p className="brand-kicker text-xs">Revenue Operator offer</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Hosted plans that scale from solo builder to multi-brand agency.
              </h2>
            </div>
            <p className="text-lg leading-8 muted">{operatorStory.body}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {(operatorTier?.bullets ?? []).map((bullet) => (
                <div key={bullet} className="surface-soft rounded-2xl px-4 py-4 text-sm font-medium leading-6">
                  {bullet}
                </div>
              ))}
            </div>
            <div className="surface-dashed rounded-3xl px-5 py-5 text-sm leading-6 muted">
              {operatorTier?.name ?? "Pro"}: {operatorTier?.monthlyPrice ?? "—"} · {operatorTier?.annualPrice ?? "—"}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Waitlist is the only conversion CTA while hosted signup is closed. */}
              <CtaLink href="#waitlist">Join the waitlist</CtaLink>
              <CtaLink href="/docs#product" variant="secondary">
                See hosted control plane
              </CtaLink>
            </div>
          </div>
        </AccentCard>
      </section>

      <section id="waitlist" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-4">
          <p className="brand-kicker text-xs">Early access</p>
          <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl md:leading-[1.08]">
            Hosted access opens soon.
          </h2>
          <p className="text-lg leading-8 muted">
            The gateway is running in private validation while we harden it against the new MCP
            revision. Join the list and you get the connection details the day it opens.
          </p>
          <p className="text-sm leading-7 muted">
            Self-hosting instead? The CLI and the MCP server run on your own key today — start from
            the docs.
          </p>
        </div>
        <WaitlistForm />
      </section>
    </div>
  );
}
