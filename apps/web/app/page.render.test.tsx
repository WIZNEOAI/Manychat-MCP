import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  SignInButton: ({ children }: { children: ReactNode }) => children,
  SignUpButton: ({ children }: { children: ReactNode }) => children,
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
    expect(html).not.toContain("$3,500");
  });
});
