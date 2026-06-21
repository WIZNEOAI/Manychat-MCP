import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import path from "path";

// Setup must run serially: obtain testing token, then authenticate.
setup.describe.configure({ mode: "serial" });

setup("configure clerk testing tokens", async ({}) => {
  await clerkSetup();
});

// Playwright runs with cwd = apps/web (the config dir).
const authFile = path.join(process.cwd(), "playwright/.clerk/user.json");

setup("authenticate and save state", async ({ page }) => {
  // Load Clerk on the embedded sign-in route, then sign in programmatically.
  await page.goto("/sign-in");
  await clerk.loaded({ page });
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.TEST_USER_EMAIL!,
      password: process.env.TEST_USER_PASSWORD!,
    },
  });

  // Confirm the Clerk JWT -> Convex auth path works (workspace sync needs ctx.auth).
  await page.goto("/dashboard");
  await page.waitForURL("**/dashboard", { timeout: 30_000 });

  await page.context().storageState({ path: authFile });
});
