import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  UserButton: () => null,
  useAuth: () => ({ isLoaded: true, isSignedIn: false }),
}));

import HomePage from "./page";

describe("home page", () => {
  it("renders the builder hero and canonical SaaS pricing", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain("Give your AI agents ManyChat superpowers.");
    expect(html).toContain("Supporter");
    expect(html).toContain("$20/mo");
    expect(html).toContain("Pro");
    expect(html).toContain("$79/mo");
    // Done-for-you managed service (Revenue Operator) is intentionally on the landing.
    expect(html).toContain("$3,500");
    expect(html).toContain("Done-for-you");
  });

  // Hosted signup is closed: registering today lands on a 404 dashboard backed
  // by a Convex dev deployment. The waitlist is the only public entry until
  // Convex prod exists (not `dusty-lobster-832`) and `/dashboard` returns 200.
  it("keeps the waitlist as the only public conversion entry", () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('id="waitlist"');
    expect(html).toContain("Join the waitlist");

    expect(html).not.toContain("/sign-in");
    expect(html).not.toContain("/sign-up");
    expect(html).not.toContain("Create account");
    expect(html).not.toContain("Sign in");
  });
});
