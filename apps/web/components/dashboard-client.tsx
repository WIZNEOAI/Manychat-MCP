"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardLoadedView } from "@/components/dashboard-loaded-view";
import { offerTiers, operatorStory } from "@/lib/positioning";
import { pricingTiers } from "@/lib/site-data";

const dashboardPositioning = {
  eyebrow: "Revenue Operator",
  title: "Turn connected rails into a real response system.",
  body:
    "Hosted mode keeps the OSS runtime intact while adding the operator layer: credential vault, lead routing, handoff, follow-up, and visibility so leads do not go cold. ManyChat is a rail; the paid system is the operating layer around it.",
} as const;

const setupStepCopy = [
  { label: "Workspace synced", detail: "Operator workspace ready for business routing" },
  { label: "ManyChat rail connected", detail: "Primary chat rail validated and encrypted" },
  { label: "Operator token issued", detail: "Agent access scoped without exposing raw credentials" },
  { label: "Handoff layer ready", detail: "Prepare follow-up and operator rules next" },
] as const;

const proTier = offerTiers.find((tier) => tier.name === "Pro");
type Bundle = "read_only" | "operator" | "messaging_safe" | "admin";
type WorkspaceToken = {
  _id: string;
  name: string;
  prefix: string;
  bundle: Bundle;
  revokedAt: number | null;
  createdAt: number;
};
type WorkspaceAccount = {
  _id: string;
  displayName: string;
  isDefault: boolean;
  lastRotatedAt: number;
  manychatPageName?: string;
  keyValidationStatus?: "valid" | "pending" | "invalid";
  keyValidatedAt?: number;
};
type WorkspaceAuditEvent = {
  _id: string;
  action: string;
  metadataJson?: string;
  createdAt: number;
};
type LeadSource = "manual" | "manychat" | "meta_ads" | "google_ads" | "whatsapp" | "other";
type LeadStatus = "new" | "contacted" | "qualified" | "booked" | "won" | "lost";

type OperatorLead = {
  id: string;
  source: LeadSource;
  status: LeadStatus;
  displayName: string;
  contactHandle?: string;
  intent?: string;
  nextAction?: string;
  nextActionAt?: number;
  lastStatusChangedAt: number;
  createdAt: number;
  updatedAt: number;
};

const leadSources: Array<{ value: LeadSource; label: string }> = [
  { value: "manual", label: "Manual" },
  { value: "manychat", label: "ManyChat" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "google_ads", label: "Google Ads" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
];

const leadStatuses: LeadStatus[] = ["new", "contacted", "qualified", "booked", "won", "lost"];
const quickLeadStatuses: Exclude<LeadStatus, "new">[] = ["contacted", "qualified", "booked", "won", "lost"];

const MCP_URL = process.env.NEXT_PUBLIC_MCP_HTTP_URL ?? "https://mcp.example.com/mcp";
const primaryButtonClass = "wiz-button-primary px-4 py-2 text-xs disabled:opacity-50";
const primaryButtonTallClass = "wiz-button-primary px-4 py-3 text-xs disabled:opacity-50";
const secondaryButtonClass = "wiz-button-secondary px-4 py-2 text-xs disabled:opacity-50";
const secondaryButtonSmallClass = "wiz-button-secondary px-3 py-1.5 text-xs disabled:opacity-50";
const dangerButtonSmallClass = "wiz-button-danger px-3 py-1.5 text-xs";
const inputClass = "wiz-input px-4 py-3 text-sm";

function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function snippetBlock(secret: string) {
  return {
    claudeCode: `claude mcp add --transport http manychat "${MCP_URL}" \\\n  --header "Authorization: Bearer ${secret}"`,
    cursor: `{
  "mcpServers": {
    "manychat": {
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer ${secret}"
      }
    }
  }
}`,
    codex: `[mcp_servers.manychat]
url = "${MCP_URL}"
bearer_token = "${secret}"`,
  };
}

async function postJson(url: string, body: Record<string, unknown>, method = "POST") {
  const response = await fetch(url, {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: method === "DELETE" ? undefined : JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string" ? payload.error : `Request failed with ${response.status}.`,
    );
  }

  return payload;
}

export function DashboardClient() {
  const searchParams = useSearchParams();
  const checkoutParam = searchParams.get("checkout");

  const viewer = useQuery(api.dashboard.viewer);
  const ensureUser = useMutation(api.users.ensureCurrentUser);
  const createSupporterCheckout = useAction(api.stripeActions.createProSubscriptionCheckout);
  const openBillingPortal = useAction(api.stripeActions.createBillingPortalSession);

  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [accountBusy, setAccountBusy] = useState(false);
  const [tokenBusy, setTokenBusy] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountApiKey, setAccountApiKey] = useState("");
  const [tokenName, setTokenName] = useState("Primary operator token");
  const [bundle, setBundle] = useState<Bundle>("operator");
  const [issuedSecret, setIssuedSecret] = useState<string | null>(null);
  const [rotatingAccountId, setRotatingAccountId] = useState<string | null>(null);
  const [rotateKeyValue, setRotateKeyValue] = useState<Record<string, string>>({});
  const [testTokenInput, setTestTokenInput] = useState("");
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadStatusBusy, setLeadStatusBusy] = useState<string | null>(null);
  const [leads, setLeads] = useState<OperatorLead[]>([]);
  const [leadCounts, setLeadCounts] = useState<Record<LeadStatus, number>>({
    new: 0,
    contacted: 0,
    qualified: 0,
    booked: 0,
    won: 0,
    lost: 0,
  });
  const [leadForm, setLeadForm] = useState({
    displayName: "",
    contactHandle: "",
    source: "manual" as LeadSource,
    intent: "",
    nextAction: "",
  });

  async function refreshLeads(workspaceId: string, shouldCommit: () => boolean = () => true) {
    const response = await fetch(`/api/v1/workspaces/${workspaceId}/leads`);
    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      leads?: OperatorLead[];
      counts?: Record<LeadStatus, number>;
    };
    if (!response.ok) {
      throw new Error(payload.error ?? `Lead request failed with ${response.status}.`);
    }
    if (!shouldCommit()) return;
    setLeadError(null);
    setLeads(payload.leads ?? []);
    setLeadCounts(
      payload.counts ?? {
        new: 0,
        contacted: 0,
        qualified: 0,
        booked: 0,
        won: 0,
        lost: 0,
      },
    );
  }
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [revokeAllBusy, setRevokeAllBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await ensureUser();
      } catch (error) {
        if (!cancelled) {
          setBootstrapError(error instanceof Error ? error.message : "Failed to sync user");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureUser]);

  const primaryWorkspace = viewer?.workspaces[0];
  useEffect(() => {
    if (!primaryWorkspace?._id) return;
    let cancelled = false;
    void (async () => {
      try {
        await refreshLeads(primaryWorkspace._id, () => !cancelled);
      } catch (error) {
        if (!cancelled) {
          setLeadError(error instanceof Error ? error.message : "Failed to load leads");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [primaryWorkspace?._id]);
  const snippets = issuedSecret ? snippetBlock(issuedSecret) : null;
  const connectedAccountCount = primaryWorkspace?.accounts.length ?? 0;
  const activeTokenCount =
    primaryWorkspace?.tokens.filter((token: WorkspaceToken) => token.revokedAt === null).length ?? 0;
  const setupStatuses = [
    Boolean(viewer),
    Boolean(primaryWorkspace),
    connectedAccountCount > 0,
    activeTokenCount > 0,
  ];
  const setupSteps = setupStepCopy.map((step, index) => ({
    ...step,
    done: setupStatuses[index] ?? false,
  }));

  const sessionLine =
    viewer === undefined
      ? "Loading..."
      : viewer === null
        ? "Not authenticated with Convex. Check Clerk and Convex auth config."
        : viewer.email ?? viewer.name ?? viewer.clerkUserId;

  return (
    <DashboardLoadedView>
      <section className="card p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="brand-kicker text-xs">{dashboardPositioning.eyebrow}</p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{dashboardPositioning.title}</h1>
            <p className="max-w-3xl text-lg leading-8 muted">{dashboardPositioning.body}</p>
            <p className="max-w-3xl text-sm leading-6 muted">
              {operatorStory.title}: {operatorStory.body}
            </p>
            {proTier ? (
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                {proTier.name} · {proTier.monthlyPrice} · {proTier.annualPrice}
              </p>
            ) : null}
            {bootstrapError ? (
              <p className="status-danger text-sm">Convex: {bootstrapError}</p>
            ) : null}
            {checkoutParam === "success" ? (
              <p className="wiz-callout-success rounded-xl px-4 py-3 text-sm">
                Checkout completed. Stripe can take a moment to sync; refresh if your plan still shows Free.
              </p>
            ) : null}
            {checkoutParam === "canceled" ? (
              <p className="wiz-callout-neutral rounded-xl px-4 py-3 text-sm muted">
                Checkout canceled. You can try again anytime.
              </p>
            ) : null}
          </div>
          <div className="surface-panel px-4 py-3 text-sm">
            <p className="font-semibold">Session</p>
            <p className="mt-1 muted">{sessionLine}</p>
            <p className="mt-3 font-semibold">Primary workspace</p>
            <p className="mt-1 muted">
              {primaryWorkspace
                ? `${primaryWorkspace.name} · Plan: ${primaryWorkspace.plan}`
                : viewer && viewer.workspaces.length === 0
                  ? "No workspace yet"
                  : "-"}
            </p>
            {primaryWorkspace ? (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="font-semibold">Limits</p>
                <p className="mt-2 text-xs muted">
                  {primaryWorkspace.accounts.length}/{primaryWorkspace.limits.maxAccounts} accounts ·{" "}
                  {
                    primaryWorkspace.tokens.filter(
                      (token: WorkspaceToken) => token.revokedAt === null,
                    ).length
                  }
                  /
                  {primaryWorkspace.limits.maxTokens} active tokens
                </p>
                <p className="mt-1 text-xs muted">
                  {primaryWorkspace.usage.daily.requestCount}/{primaryWorkspace.limits.dailyRequests} daily requests ·{" "}
                  {primaryWorkspace.usage.monthly.requestCount}/{primaryWorkspace.limits.monthlyRequests} monthly requests
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {setupSteps.map((step, index) => (
          <article key={step.label} className="surface-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-white/40">0{index + 1}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  step.done
                    ? "border-[rgba(16,185,129,0.28)] bg-[rgba(16,185,129,0.1)] text-[var(--primary)]"
                    : "border-white/10 bg-white/[0.03] text-white/42"
                }`}
              >
                {step.done ? "Ready" : "Pending"}
              </span>
            </div>
            <h2 className="mt-4 text-sm font-semibold tracking-tight">{step.label}</h2>
            <p className="mt-2 text-xs leading-5 muted">{step.detail}</p>
          </article>
        ))}
      </section>

      <section className="card p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="brand-kicker text-xs">Lead queue</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Keep Revenue Operator leads moving</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 muted">
              Track whether Revenue Operator leads are new, contacted, qualified, booked, won, or lost. This is the handoff layer that keeps leads from going cold.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs md:grid-cols-6">
            {leadStatuses.map((status) => (
              <div key={status} className="surface-panel px-3 py-2 text-center">
                <p className="font-semibold capitalize">{status}</p>
                <p className="mt-1 text-lg font-semibold text-[var(--primary)]">{leadCounts[status] ?? 0}</p>
              </div>
            ))}
          </div>
        </div>

        {primaryWorkspace ? (
          <>
            <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr_0.75fr]">
              <input
                value={leadForm.displayName}
                onChange={(event) => setLeadForm((current) => ({ ...current, displayName: event.target.value }))}
                placeholder="Lead name"
                className={inputClass}
              />
              <input
                value={leadForm.contactHandle}
                onChange={(event) => setLeadForm((current) => ({ ...current, contactHandle: event.target.value }))}
                placeholder="Handle, email, or phone"
                className={inputClass}
              />
              <select
                value={leadForm.source}
                onChange={(event) => setLeadForm((current) => ({ ...current, source: event.target.value as LeadSource }))}
                className={inputClass}
              >
                {leadSources.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
              <input
                value={leadForm.intent}
                onChange={(event) => setLeadForm((current) => ({ ...current, intent: event.target.value }))}
                placeholder="Intent, e.g. wants pricing"
                className={inputClass}
              />
              <input
                value={leadForm.nextAction}
                onChange={(event) => setLeadForm((current) => ({ ...current, nextAction: event.target.value }))}
                placeholder="Next action"
                className={inputClass}
              />
              <button
                type="button"
                disabled={leadBusy}
                className={primaryButtonTallClass}
                onClick={async () => {
                  setLeadBusy(true);
                  setLeadError(null);
                  try {
                    await postJson(`/api/v1/workspaces/${primaryWorkspace._id}/leads`, {
                      source: leadForm.source,
                      displayName: leadForm.displayName,
                      contactHandle: leadForm.contactHandle || undefined,
                      intent: leadForm.intent || undefined,
                      nextAction: leadForm.nextAction || undefined,
                    });
                    setLeadForm({ displayName: "", contactHandle: "", source: "manual", intent: "", nextAction: "" });
                    await refreshLeads(primaryWorkspace._id);
                  } catch (error) {
                    setLeadError(error instanceof Error ? error.message : "Failed to create lead");
                  } finally {
                    setLeadBusy(false);
                  }
                }}
              >
                {leadBusy ? "Adding..." : "Add lead"}
              </button>
            </div>
            {leadError ? <p className="status-danger mt-3 text-sm">{leadError}</p> : null}

            <div className="mt-6 grid gap-3">
              {leads.length === 0 ? (
                <p className="surface-panel p-4 text-sm muted">
                  Add a lead manually while ManyChat/ads ingestion is being wired.
                </p>
              ) : (
                leads.map((lead) => (
                  <article key={lead.id} className="surface-panel p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{lead.displayName}</h3>
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] muted">
                            {lead.status}
                          </span>
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] muted">
                            {lead.source}
                          </span>
                        </div>
                        <p className="mt-2 text-xs muted">
                          {lead.contactHandle ? `${lead.contactHandle} · ` : ""}
                          {lead.intent ?? "No intent captured yet"}
                        </p>
                        <p className="mt-1 text-xs muted">
                          Next action: {lead.nextAction ?? "Set manually after contact"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {quickLeadStatuses.map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={leadStatusBusy === lead.id || lead.status === status}
                            className={secondaryButtonSmallClass}
                            onClick={async () => {
                              setLeadStatusBusy(lead.id);
                              setLeadError(null);
                              try {
                                await postJson(
                                  `/api/v1/workspaces/${primaryWorkspace._id}/leads/${lead.id}/status`,
                                  { status },
                                  "PATCH",
                                );
                                await refreshLeads(primaryWorkspace._id);
                              } catch (error) {
                                setLeadError(error instanceof Error ? error.message : "Failed to update lead");
                              } finally {
                                setLeadStatusBusy(null);
                              }
                            }}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </>
        ) : (
          <p className="mt-6 text-sm muted">Sign in and create a workspace to start tracking leads.</p>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="card p-6 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="brand-kicker text-xs">Billing</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Free and Pro</h2>
              <p className="mt-2 text-sm leading-6 muted">
                A generous Free tier and Pro at $20/month or $209/year.
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setBillingInterval("monthly")}
              className={billingInterval === "monthly" ? primaryButtonClass : secondaryButtonClass}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("annual")}
              className={billingInterval === "annual" ? primaryButtonClass : secondaryButtonClass}
            >
              Annual · Save $31
            </button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {pricingTiers.map((tier) => (
              <article key={tier.name} className="surface-panel p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] muted">{tier.name}</p>
                <p className="mt-2 text-3xl font-semibold">
                  {billingInterval === "annual" ? tier.annualPrice : tier.monthlyPrice}
                </p>
                {billingInterval === "annual" && tier.annualSavings ? (
                  <p className="mt-1 text-xs font-semibold text-[var(--primary)]">{tier.annualSavings}</p>
                ) : null}
                <p className="mt-2 text-sm leading-6 muted">{tier.tagline}</p>
                <ul className="mt-4 space-y-2 text-sm leading-6 muted">
                  {tier.limits.map((limit) => (
                    <li key={limit}>{limit}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          {primaryWorkspace ? (
            <div className="mt-6 border-t border-white/10 pt-6">
              {billingError ? (
                <p className="status-danger mb-3 text-sm">{billingError}</p>
              ) : null}
              {primaryWorkspace.plan === "free" ? (
                <button
                  type="button"
                  disabled={billingBusy}
                  onClick={async () => {
                    setBillingBusy(true);
                    setBillingError(null);
                    try {
                      const { url } = await createSupporterCheckout({
                        workspaceId: primaryWorkspace._id,
                        interval: billingInterval,
                      });
                      if (!url) throw new Error("Stripe did not return a checkout URL.");
                      window.location.href = url;
                    } catch (error) {
                      setBillingError(error instanceof Error ? error.message : "Checkout failed");
                    } finally {
                      setBillingBusy(false);
                    }
                  }}
                  className={primaryButtonClass}
                >
                  {billingBusy
                    ? "Redirecting..."
                    : billingInterval === "annual"
                      ? "Upgrade to Pro - $209/year"
                      : "Upgrade to Pro - $20/mo"}
                </button>
              ) : null}
              {primaryWorkspace.plan !== "free" && primaryWorkspace.stripeCustomerId ? (
                <button
                  type="button"
                  disabled={billingBusy}
                  onClick={async () => {
                    setBillingBusy(true);
                    setBillingError(null);
                    try {
                      const { url } = await openBillingPortal({ workspaceId: primaryWorkspace._id });
                      window.location.href = url;
                    } catch (error) {
                      setBillingError(error instanceof Error ? error.message : "Portal failed");
                    } finally {
                      setBillingBusy(false);
                    }
                  }}
                  className={secondaryButtonClass}
                >
                  {billingBusy ? "Opening..." : "Manage billing"}
                </button>
              ) : null}
            </div>
          ) : null}
        </article>

        <article className="card p-6 md:p-8">
          <p className="brand-kicker text-xs">Usage</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Current workspace activity</h2>
          {primaryWorkspace ? (
            <div className="mt-6 grid gap-4">
              <div className="surface-panel p-4">
                <p className="text-sm font-semibold">Daily</p>
                <p className="mt-2 text-3xl font-semibold">{primaryWorkspace.usage.daily.requestCount}</p>
                <p className="mt-1 text-xs muted">
                  Requests today · session starts: {primaryWorkspace.usage.daily.sessionStarts} · auth failures:{" "}
                  {primaryWorkspace.usage.daily.authFailures}
                </p>
              </div>
              <div className="surface-panel p-4">
                <p className="text-sm font-semibold">Monthly</p>
                <p className="mt-2 text-3xl font-semibold">{primaryWorkspace.usage.monthly.requestCount}</p>
                <p className="mt-1 text-xs muted">
                  Requests this month · session starts: {primaryWorkspace.usage.monthly.sessionStarts} · auth failures:{" "}
                  {primaryWorkspace.usage.monthly.authFailures}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm muted">Sign in and create a workspace to inspect hosted usage.</p>
          )}
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="card p-6 md:p-8">
          <p className="brand-kicker text-xs">ManyChat vault</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Connect or rotate a ManyChat API key</h2>
          <p className="mt-2 text-sm leading-6 muted">
            Keys are validated against ManyChat before save, encrypted at rest, and never shown again. The hosted MCP gateway
            only decrypts them in memory.
          </p>
          {primaryWorkspace ? (
            <>
              <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                  placeholder="Account display name"
                  className={inputClass}
                />
                <input
                  value={accountApiKey}
                  onChange={(event) => setAccountApiKey(event.target.value)}
                  placeholder="mc_..."
                  className={inputClass}
                />
                <button
                  type="button"
                  disabled={accountBusy}
                  onClick={async () => {
                    setAccountBusy(true);
                    setAccountError(null);
                    try {
                      await postJson(`/api/v1/workspaces/${primaryWorkspace._id}/manychat-accounts`, {
                        displayName: accountName,
                        apiKey: accountApiKey,
                        isDefault: primaryWorkspace.accounts.length === 0,
                      });
                      setAccountName("");
                      setAccountApiKey("");
                    } catch (error) {
                      setAccountError(error instanceof Error ? error.message : "Failed to save account");
                    } finally {
                      setAccountBusy(false);
                    }
                  }}
                  className={primaryButtonTallClass}
                >
                  {accountBusy ? "Saving..." : "Save key"}
                </button>
              </div>
              {accountError ? (
                <p className="status-danger mt-3 text-sm">{accountError}</p>
              ) : null}
              <div className="mt-6 grid gap-3">
                {primaryWorkspace.accounts.length === 0 ? (
                  <p className="surface-dashed rounded-2xl px-4 py-4 text-sm muted">
                    Connect your ManyChat API key to start. You will need a key from ManyChat Settings → API.
                  </p>
                ) : (
                  primaryWorkspace.accounts.map((account: WorkspaceAccount) => (
                    <div key={account._id} className="surface-panel p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{account.displayName}</p>
                          <p className="text-xs muted">
                            {account.isDefault ? "Default account" : "Secondary account"} · rotated{" "}
                            {formatTimestamp(account.lastRotatedAt)}
                          </p>
                          {account.keyValidationStatus === "valid" && account.keyValidatedAt ? (
                            <p className="status-success mt-1 text-xs">
                              Validated · ManyChat: {account.manychatPageName ?? "connected"}{" "}
                              · {formatTimestamp(account.keyValidatedAt)}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setRotatingAccountId((current) => (current === account._id ? null : account._id))
                            }
                            className={secondaryButtonSmallClass}
                          >
                            Rotate key
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  "Disconnect this ManyChat account? All active MCP tokens for this workspace will be revoked.",
                                )
                              ) {
                                return;
                              }
                              setAccountBusy(true);
                              setAccountError(null);
                              try {
                                await postJson(
                                  `/api/v1/workspaces/${primaryWorkspace._id}/manychat-accounts/${account._id}`,
                                  {},
                                  "DELETE",
                                );
                                setRotatingAccountId(null);
                                setIssuedSecret(null);
                              } catch (error) {
                                setAccountError(
                                  error instanceof Error ? error.message : "Failed to disconnect account",
                                );
                              } finally {
                                setAccountBusy(false);
                              }
                            }}
                            className={dangerButtonSmallClass}
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                      {rotatingAccountId === account._id ? (
                        <div className="mt-4 flex flex-col gap-3 md:flex-row">
                          <input
                            value={rotateKeyValue[account._id] ?? ""}
                            onChange={(event) =>
                              setRotateKeyValue((current) => ({
                                ...current,
                                [account._id]: event.target.value,
                              }))
                            }
                            placeholder="Paste replacement API key"
                            className={`flex-1 ${inputClass}`}
                          />
                          <button
                            type="button"
                            disabled={accountBusy}
                            onClick={async () => {
                              setAccountBusy(true);
                              setAccountError(null);
                              try {
                                await postJson(
                                  `/api/v1/workspaces/${primaryWorkspace._id}/manychat-accounts/${account._id}/rotate-key`,
                                  { apiKey: rotateKeyValue[account._id] },
                                );
                                setRotateKeyValue((current) => ({ ...current, [account._id]: "" }));
                                setRotatingAccountId(null);
                              } catch (error) {
                                setAccountError(error instanceof Error ? error.message : "Failed to rotate key");
                              } finally {
                                setAccountBusy(false);
                              }
                            }}
                            className={primaryButtonTallClass}
                          >
                            Replace key
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="mt-6 text-sm muted">Sign in to add your first ManyChat account.</p>
          )}
        </article>

        <article className="card p-6 md:p-8">
          <p className="brand-kicker text-xs">Hosted MCP token</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Issue a workspace token</h2>
          <p className="mt-2 text-sm leading-6 muted">
            Tokens are one-time reveal secrets. Revoke and re-issue if they ever leak.
          </p>
          {primaryWorkspace ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={
                    revokeAllBusy ||
                    !primaryWorkspace.tokens.some((t: WorkspaceToken) => t.revokedAt === null)
                  }
                  onClick={async () => {
                    if (
                      !window.confirm(
                        "Revoke every active MCP token for this workspace? Clients using old tokens will stop working.",
                      )
                    ) {
                      return;
                    }
                    setRevokeAllBusy(true);
                    setTokenError(null);
                    try {
                      await postJson(`/api/v1/workspaces/${primaryWorkspace._id}/mcp-tokens/revoke-all`, {});
                      setIssuedSecret(null);
                    } catch (error) {
                      setTokenError(error instanceof Error ? error.message : "Failed to revoke tokens");
                    } finally {
                      setRevokeAllBusy(false);
                    }
                  }}
                  className={secondaryButtonSmallClass}
                >
                  {revokeAllBusy ? "Revoking…" : "Revoke all tokens"}
                </button>
              </div>
              <div className="mt-6 grid gap-3">
                <input
                  value={tokenName}
                  onChange={(event) => setTokenName(event.target.value)}
                  placeholder="Token name"
                  className={inputClass}
                />
                <select
                  value={bundle}
                  onChange={(event) => setBundle(event.target.value as Bundle)}
                  className={inputClass}
                >
                  <option value="read_only">read_only</option>
                  <option value="operator">operator</option>
                  <option value="messaging_safe">messaging_safe</option>
                  <option value="admin">admin</option>
                </select>
                <button
                  type="button"
                  disabled={tokenBusy}
                  onClick={async () => {
                    setTokenBusy(true);
                    setTokenError(null);
                    try {
                      const payload = await postJson(`/api/v1/workspaces/${primaryWorkspace._id}/mcp-tokens`, {
                        name: tokenName,
                        bundle,
                        accountId: primaryWorkspace.accounts[0]?._id ?? null,
                      });
                      setIssuedSecret(typeof payload.secret === "string" ? payload.secret : null);
                    } catch (error) {
                      setTokenError(error instanceof Error ? error.message : "Failed to issue token");
                    } finally {
                      setTokenBusy(false);
                    }
                  }}
                  className={primaryButtonTallClass}
                >
                  {tokenBusy ? "Issuing..." : "Issue token"}
                </button>
              </div>
              {tokenError ? (
                <p className="status-danger mt-3 text-sm">{tokenError}</p>
              ) : null}
              {issuedSecret && snippets ? (
                <div className="wiz-callout-success mt-6 rounded-2xl p-4">
                  <p className="text-sm font-semibold">
                    Copy this token now. It will not be shown again.
                  </p>
                  <code className="wiz-code-block mt-3 block overflow-x-auto px-4 py-3 text-xs">
                    {issuedSecret}
                  </code>
                  <div className="mt-4 grid gap-3">
                    <pre className="wiz-pre overflow-x-auto px-4 py-3 text-xs">
                      {snippets.claudeCode}
                    </pre>
                    <pre className="wiz-pre overflow-x-auto px-4 py-3 text-xs">
                      {snippets.cursor}
                    </pre>
                    <pre className="wiz-pre overflow-x-auto px-4 py-3 text-xs">
                      {snippets.codex}
                    </pre>
                  </div>
                </div>
              ) : null}
              <div className="surface-panel mt-8 p-4">
                <p className="text-sm font-semibold">Test hosted MCP connection</p>
                <p className="mt-1 text-xs leading-5 muted">
                  Paste a token you issued (or the one shown above). We verify it matches your workspace, decrypts the vault,
                  and calls ManyChat page info — without exposing your API key.
                </p>
                <input
                  value={testTokenInput}
                  onChange={(event) => {
                    setTestTokenInput(event.target.value);
                    setTestResult(null);
                  }}
                  placeholder="mcp_live_…"
                  className={`mt-3 w-full ${inputClass}`}
                />
                <button
                  type="button"
                  disabled={testBusy || !testTokenInput.trim()}
                  onClick={async () => {
                    setTestBusy(true);
                    setTestResult(null);
                    setTokenError(null);
                    try {
                      const res = await postJson(`/api/v1/workspaces/${primaryWorkspace._id}/mcp-tokens/test`, {
                        token: testTokenInput.trim(),
                      });
                      const pageName =
                        typeof res.pageName === "string" && res.pageName
                          ? res.pageName
                          : "ManyChat responded OK";
                      setTestResult(`Success: ${pageName}`);
                    } catch (error) {
                      setTestResult(
                        error instanceof Error ? error.message : "Connection test failed",
                      );
                    } finally {
                      setTestBusy(false);
                    }
                  }}
                  className={`mt-3 ${primaryButtonClass}`}
                >
                  {testBusy ? "Testing…" : "Run test"}
                </button>
                {testResult ? (
                  <p
                    className={`mt-3 text-sm ${testResult.startsWith("Success") ? "status-success" : "status-danger"}`}
                  >
                    {testResult}
                  </p>
                ) : null}
              </div>
              <div className="mt-6 grid gap-3">
                {primaryWorkspace.tokens.length === 0 ? (
                  <p className="surface-dashed rounded-2xl px-4 py-4 text-sm muted">
                    No MCP tokens issued yet.
                  </p>
                ) : (
                  primaryWorkspace.tokens.map((token: WorkspaceToken) => (
                    <div key={token._id} className="surface-panel p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{token.name}</p>
                          <p className="text-xs muted">
                            {token.prefix} · {token.bundle} · created {formatTimestamp(token.createdAt)}
                          </p>
                        </div>
                        {token.revokedAt === null ? (
                          <button
                            type="button"
                            onClick={async () => {
                              setTokenError(null);
                              try {
                                await postJson(
                                  `/api/v1/workspaces/${primaryWorkspace._id}/mcp-tokens/${token._id}`,
                                  {},
                                  "DELETE",
                                );
                              } catch (error) {
                                setTokenError(error instanceof Error ? error.message : "Failed to revoke token");
                              }
                            }}
                            className={dangerButtonSmallClass}
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="status-danger text-xs font-semibold uppercase tracking-[0.16em]">
                            Revoked
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="mt-6 text-sm muted">Sign in to issue hosted MCP tokens.</p>
          )}
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="card p-6 md:p-8">
          <p className="brand-kicker text-xs">Audit trail</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Recent hosted activity</h2>
          {primaryWorkspace ? (
            <div className="mt-6 grid gap-3">
              {primaryWorkspace.audit.length === 0 ? (
                <p className="surface-dashed rounded-2xl px-4 py-4 text-sm muted">
                  No audit events yet.
                </p>
              ) : (
                primaryWorkspace.audit.map((event: WorkspaceAuditEvent) => (
                  <div key={event._id} className="surface-panel p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{event.action}</p>
                        <p className="mt-1 text-xs muted">{formatTimestamp(event.createdAt)}</p>
                      </div>
                    </div>
                    {event.metadataJson ? (
                      <pre className="wiz-pre mt-3 overflow-x-auto px-3 py-2 text-xs">
                        {event.metadataJson}
                      </pre>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          ) : (
            <p className="mt-6 text-sm muted">Sign in to inspect workspace audit history.</p>
          )}
        </article>

        <article className="card p-6 md:p-8">
          <p className="brand-kicker text-xs">Bundle policy</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Capability bundles</h2>
          <div className="mt-6 grid gap-3">
            <div className="surface-panel p-4">
              <p className="font-semibold">read_only</p>
              <p className="mt-1 text-sm muted">Inspection only: page info, lists, subscriber lookup, and health checks.</p>
            </div>
            <div className="surface-panel p-4">
              <p className="font-semibold">operator</p>
              <p className="mt-1 text-sm muted">Subscriber, tags, and custom field operations without direct messaging.</p>
            </div>
            <div className="surface-panel p-4">
              <p className="font-semibold">messaging_safe</p>
              <p className="mt-1 text-sm muted">Operator bundle plus flow and message tools for controlled send workflows.</p>
            </div>
            <div className="surface-panel p-4">
              <p className="font-semibold">admin</p>
              <p className="mt-1 text-sm muted">Full hosted access, including bot field and custom field administration.</p>
            </div>
          </div>
        </article>
      </section>
    </DashboardLoadedView>
  );
}
