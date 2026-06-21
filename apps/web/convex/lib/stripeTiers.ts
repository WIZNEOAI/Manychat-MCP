/**
 * Single source of truth mapping paid plan tiers <-> Stripe price IDs.
 * Price IDs live in Convex environment variables so they differ per environment
 * (test vs live) without code changes.
 */

export type PaidTier = "supporter" | "pro";
export type BillingInterval = "monthly" | "annual";

const PRICE_ENV: Record<PaidTier, Record<BillingInterval, string>> = {
  supporter: {
    monthly: "STRIPE_SUPPORTER_MONTHLY_PRICE_ID",
    annual: "STRIPE_SUPPORTER_ANNUAL_PRICE_ID",
  },
  pro: {
    monthly: "STRIPE_PRO_MONTHLY_PRICE_ID",
    annual: "STRIPE_PRO_ANNUAL_PRICE_ID",
  },
};

const PAID_TIERS: PaidTier[] = ["supporter", "pro"];
const INTERVALS: BillingInterval[] = ["monthly", "annual"];

/** Resolve the Stripe price id for a tier + interval, or throw if unset. */
export function getPriceId(tier: PaidTier, interval: BillingInterval): string {
  const envName = PRICE_ENV[tier][interval];
  const priceId = process.env[envName];
  if (!priceId) {
    throw new Error(`${envName} is not set in Convex environment variables`);
  }
  return priceId;
}

/** Reverse-map a Stripe price id to its tier, or null if it matches none of ours. */
export function getTierFromPriceId(priceId: string): PaidTier | null {
  for (const tier of PAID_TIERS) {
    for (const interval of INTERVALS) {
      if (process.env[PRICE_ENV[tier][interval]] === priceId) {
        return tier;
      }
    }
  }
  return null;
}

/**
 * Resolve the paid tier for an active subscription. Prefers the price id;
 * falls back to the `tier` stamped into subscription metadata at checkout;
 * defaults to the lower paid tier so an unmapped price never over-grants.
 */
export function resolvePaidTier(opts: {
  priceId?: string | null;
  metadataTier?: string | null;
}): PaidTier {
  const fromPrice = opts.priceId ? getTierFromPriceId(opts.priceId) : null;
  if (fromPrice) return fromPrice;
  if (opts.metadataTier === "supporter" || opts.metadataTier === "pro") {
    return opts.metadataTier;
  }
  return "supporter";
}
