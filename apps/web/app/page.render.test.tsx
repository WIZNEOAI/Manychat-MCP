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
  it("renders the Revenue Operator story and pricing", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain("Your leads already exist. The problem is what happens after.");
    expect(html).toContain("Revenue Operator");
    expect(html).toContain("$3,500");
    expect(html).toContain("$750/mo");
    expect(html).toContain("Builder OSS");
  });
});
