import { HomeAuthCard } from "@/components/home-auth-card";
import {
  AccentCard,
  CodeWindow,
  CtaLink,
  ExternalCta,
  PricingBadge,
  SectionHeader,
} from "@/components/landing-primitives";
import {
  buyerPainCards,
  heroContent,
  offerTiers,
  operatorStory,
  ossStory,
} from "@/lib/positioning";
import { REPO_TREE_BASE } from "@/lib/repo";

export default function Home() {
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
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                  {operatorStory.title}
                </h2>
              </div>
              <PricingBadge>Paid layer</PricingBadge>
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
              The paid layer is not generic hosting. It is the delivery wrapper around response speed,
              routing rules, and human takeover points.
            </div>
          </div>
        </AccentCard>
      </section>

      <section id="operator-offer" className="space-y-8">
        <SectionHeader
          eyebrow="Offer ladder"
          title="Choose the OSS core or buy the Revenue Operator layer around it."
          body="The copy and prices come from shared positioning data so docs, dashboard, and sales surfaces can mirror the same promise."
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
                      <h3 className="text-5xl font-semibold tracking-tight">
                        {tier.setupPrice ?? "Free"}
                      </h3>
                      {tier.monthlyPrice ? (
                        <p className="text-sm font-medium text-[var(--primary)]">{tier.monthlyPrice}</p>
                      ) : null}
                    </div>
                  </div>
                  <PricingBadge>{tier.badge ?? tier.cta}</PricingBadge>
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
                Buy the implementation layer, not just access to software.
              </h2>
            </div>
            <p className="text-lg leading-8 muted">
              {heroContent.body}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {offerTiers[1].bullets.map((bullet) => (
                <div key={bullet} className="surface-soft rounded-2xl px-4 py-4 text-sm font-medium leading-6">
                  {bullet}
                </div>
              ))}
            </div>
            <div className="surface-dashed rounded-3xl px-5 py-5 text-sm leading-6 muted">
              Setup: {offerTiers[1].setupPrice} · Retainer: {offerTiers[1].monthlyPrice}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <CtaLink href="#operator-offer">{offerTiers[1].cta}</CtaLink>
              <CtaLink href="/docs#product" variant="secondary">
                See hosted control plane
              </CtaLink>
            </div>
          </div>
        </AccentCard>
      </section>
    </div>
  );
}
