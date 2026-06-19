import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <section className="card p-6">
        <p className="brand-kicker text-xs">OSS runtime + Revenue Operator</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">OSS runtime + Revenue Operator</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 muted">
          The CLI and MCP remain self-hostable. This hosted app adds the operator layer businesses pay for:
          vault, routing, handoff, follow-up, and reporting.
        </p>
      </section>
      <Suspense
        fallback={<div className="text-sm muted">Loading dashboard…</div>}
      >
        <DashboardClient />
      </Suspense>
    </div>
  );
}
