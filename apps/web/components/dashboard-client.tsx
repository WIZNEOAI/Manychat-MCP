"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { pricingTiers } from "@/lib/site-data";

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
  const snippets = issuedSecret ? snippetBlock(issuedSecret) : null;

  const sessionLine =
    viewer === undefined
      ? "Loading..."
      : viewer === null
        ? "Not authenticated with Convex. Check Clerk and Convex auth config."
        : viewer.email ?? viewer.name ?? viewer.clerkUserId;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <section className="card p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="brand-kicker text-xs">Hosted control plane</p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Workspace dashboard</h1>
            <p className="max-w-3xl text-lg leading-8 muted">
              Hosted mode keeps the CLI and MCP runtime intact while adding an encrypted ManyChat vault,
              workspace-scoped MCP tokens, plan enforcement, and client snippets for AI agents.
            </p>
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
    </div>
  );
}
