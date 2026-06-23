import { test, expect } from "@playwright/test";

// Public landing surface: the hero, the canonical SaaS pricing, and the
// Revenue Operator done-for-you offer with a working payment CTA. These assert
// content that renders regardless of auth state (storageState is authed here).

test("landing renders hero + SaaS pricing + done-for-you offer", async ({ page }) => {
  await page.goto("/");

  // Builder-first hero.
  await expect(
    page.getByText("Give your AI agents ManyChat superpowers."),
  ).toBeVisible();

  // Canonical SaaS tiers (source: lib/site-data-shared.ts).
  await expect(page.getByText("$20/mo").first()).toBeVisible();
  await expect(page.getByText("$79/mo").first()).toBeVisible();

  // Done-for-you managed service.
  const dfy = page.locator("#done-for-you");
  await expect(dfy).toBeVisible();
  await expect(dfy.getByText("$3,500").first()).toBeVisible();

  // The CTA points at the live Stripe payment link (paying redirects to the
  // kickoff booking). Asserting the href guards against the link going stale.
  const cta = dfy.getByRole("link", { name: /\$3,500\/mo/i });
  await expect(cta).toHaveAttribute("href", /buy\.stripe\.com/);
});

test("key public routes load", async ({ page }) => {
  const docs = await page.goto("/docs");
  expect(docs?.status()).toBeLessThan(400);

  const signIn = await page.goto("/sign-in");
  expect(signIn?.status()).toBeLessThan(400);
});
