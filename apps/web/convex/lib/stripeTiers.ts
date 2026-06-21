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
