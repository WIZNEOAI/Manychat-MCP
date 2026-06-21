import { clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { test as setup, expect } from "@playwright/test";
import path from "path";

// Setup must run serially: configure the testing token, then authenticate.
setup.describe.configure({ mode: "serial" });

setup("configure clerk testing tokens", async ({}) => {
  await clerkSetup();
});

const authFile = path.join(process.cwd(), "playwright/.clerk/user.json");

setup("authenticate via sign-in ticket and save state", async ({ page }) => {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const userId = process.env.TEST_USER_ID;
  if (!secretKey || !userId) {
    throw new Error("CLERK_SECRET_KEY and TEST_USER_ID must be set (see apps/web/.env.local)");
  }

  // Mint a single-use sign-in ticket via the Clerk Backend API. This bypasses
  // whichever first-factor strategies (password / email-code / OAuth) the
  // instance has enabled, so the E2E does not depend on instance auth config.
  const res = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) {
    throw new Error(`sign_in_tokens failed: ${res.status} ${await res.text()}`);
  }
  const { token } = (await res.json()) as { token: string };

  // Inject the testing token to bypass bot protection, then consume the ticket.
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await page.waitForFunction(
    () => Boolean((window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded),
    { timeout: 20_000 },
  );
  await page.evaluate(async (ticket) => {
    const clerk = (window as unknown as {
      Clerk: {
        client: { signIn: { create: (p: unknown) => Promise<{ createdSessionId: string }> } };
        setActive: (p: { session: string }) => Promise<void>;
      };
    }).Clerk;
    const signIn = await clerk.client.signIn.create({ strategy: "ticket", ticket });
    await clerk.setActive({ session: signIn.createdSessionId });
  }, token);

  // Confirm the client session is established.
  await page.waitForFunction(
    () => Boolean((window as unknown as { Clerk?: { user?: unknown } }).Clerk?.user),
    { timeout: 15_000 },
  );

  // Confirm the Clerk JWT -> Convex auth path works (workspace sync needs ctx.auth).
  await page.goto("/dashboard");
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  await page.context().storageState({ path: authFile });
});
