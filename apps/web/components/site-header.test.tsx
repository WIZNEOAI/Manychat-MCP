import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const authState = { isLoaded: true, isSignedIn: false };

vi.mock("@clerk/nextjs", () => ({
  UserButton: () => null,
  useAuth: () => authState,
}));

import { SiteHeader } from "./site-header";

describe("site header", () => {
  // Signed-out visitors get the waitlist, not a signup that dead-ends on a 404
  // dashboard wired to a Convex dev deployment. Restore the auth buttons and the
  // Dashboard nav item when Convex prod exists (not `dusty-lobster-832`) and
  // `/dashboard` returns 200.
  it("offers the waitlist instead of auth CTAs when signed out", () => {
    const html = renderToStaticMarkup(<SiteHeader />);

    expect(html).toContain("Join the waitlist");
    expect(html).toContain("/#waitlist");
    expect(html).not.toContain("/sign-in");
    expect(html).not.toContain("/sign-up");
    expect(html).not.toContain("Sign in");
    expect(html).not.toContain("Create account");
    // Dashboard is unlinked publicly but the route stays live for direct access.
    expect(html).not.toContain('href="/dashboard"');
  });

  it("links a signed-in operator into the workspace", () => {
    authState.isSignedIn = true;
    try {
      const html = renderToStaticMarkup(<SiteHeader />);
      expect(html).toContain('href="/dashboard"');
      expect(html).toContain("Workspace");
    } finally {
      authState.isSignedIn = false;
    }
  });
});
