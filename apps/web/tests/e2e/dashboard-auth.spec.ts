import { test, expect } from "@playwright/test";

// Validates known-risk #1: Clerk sign-in -> Convex workspace sync via ctx.auth.
// If the "convex" JWT template or issuer domain were misconfigured, the dashboard
// would either redirect to sign-in or render an auth/"User not found" error.
test("authenticated user reaches the dashboard with a synced workspace", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);

  // The operator shell renders only when Convex resolved the user + workspace.
  const shell = page.getByText(/workspace|operator|manychat|token/i).first();
  await expect(shell).toBeVisible({ timeout: 20_000 });

  // No auth error surfaced.
  await expect(page.getByText(/user not found|authentication required/i)).toHaveCount(0);
});
