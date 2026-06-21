import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("convex/react", () => ({
  useAction: () => vi.fn(async () => ({ url: "https://example.com" })),
  useMutation: () => vi.fn(async () => null),
  useQuery: () => ({
    clerkUserId: "user_test",
    email: "ops@example.com",
    name: "Operator",
    workspaces: [
      {
        id: "workspace_test",
        name: "Operator workspace",
        plan: "Free",
        limits: {
          maxAccounts: 1,
          maxTokens: 2,
          dailyRequests: 250,
          monthlyRequests: 3000,
        },
        usage: {
          daily: { requestCount: 0 },
          monthly: { requestCount: 0 },
        },
        accounts: [],
        tokens: [],
        audit: [],
      },
    ],
  }),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    dashboard: { viewer: "dashboard.viewer" },
    users: { ensureCurrentUser: "users.ensureCurrentUser" },
    stripeActions: {
      createProSubscriptionCheckout: "stripeActions.createProSubscriptionCheckout",
      createBillingPortalSession: "stripeActions.createBillingPortalSession",
    },
  },
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

import { DashboardClient } from "./dashboard-client";

describe("dashboard positioning", () => {
  it("describes hosted mode as Revenue Operator onboarding", () => {
    const html = renderToStaticMarkup(<DashboardClient />);

    expect(html).toContain("Revenue Operator");
    expect(html).toContain("Lead queue");
    expect(html).toContain("leads from going cold");
    expect(html).toContain("new");
    expect(html).toContain("contacted");
    expect(html).toContain("booked");
    expect(html).toContain("leads do not go cold");
    expect(html).toContain("ManyChat is a rail");
  });
});
