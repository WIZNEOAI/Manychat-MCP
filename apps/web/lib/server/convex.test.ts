import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callControlPlane, getConvexSiteUrl } from "./convex";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.NEXT_PUBLIC_CONVEX_URL = "https://dusty-lobster-832.convex.cloud";
  process.env.MCP_INTERNAL_SHARED_SECRET = "test-control-plane-secret";
  delete process.env.HOSTED_CONTROL_PLANE_SECRET;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("getConvexSiteUrl", () => {
  it("derives the .convex.site host from the .convex.cloud deployment URL", () => {
    expect(getConvexSiteUrl()).toBe("https://dusty-lobster-832.convex.site");
  });

  it("strips a trailing slash", () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://dusty-lobster-832.convex.cloud/";
    expect(getConvexSiteUrl()).toBe("https://dusty-lobster-832.convex.site");
  });

  it("throws when NEXT_PUBLIC_CONVEX_URL is missing", () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    expect(() => getConvexSiteUrl()).toThrow(/NEXT_PUBLIC_CONVEX_URL/);
  });

  it("passes through a host that is already .convex.site", () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://dusty-lobster-832.convex.site";
    expect(getConvexSiteUrl()).toBe("https://dusty-lobster-832.convex.site");
  });

  it("fails closed on an unrecognized host (never sends the secret elsewhere)", () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://evil.example.com";
    expect(() => getConvexSiteUrl()).toThrow(/Cannot derive a Convex \.site host/);
  });
});

describe("callControlPlane", () => {
  it("sends the shared secret in the x-control-plane-secret header, not the body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await callControlPlane("/internal/mcp/authorize", { workspaceId: "ws_1" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://dusty-lobster-832.convex.site/internal/mcp/authorize");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-control-plane-secret"]).toBe("test-control-plane-secret");
    expect(init.body as string).not.toContain("test-control-plane-secret");
  });

  it("returns parsed JSON on success (including null)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("null", { status: 200 })),
    );
    await expect(callControlPlane("/internal/mcp/resolve-token", { prefix: "x" })).resolves.toBeNull();
  });

  it("propagates the upstream error message on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Daily request limit reached for workspace Acme." }), {
          status: 400,
        }),
      ),
    );
    await expect(callControlPlane("/internal/mcp/authorize", {})).rejects.toThrow(/limit reached/);
  });

  it("throws when the shared secret is not configured", async () => {
    delete process.env.MCP_INTERNAL_SHARED_SECRET;
    vi.stubGlobal("fetch", vi.fn());
    await expect(callControlPlane("/internal/mcp/authorize", {})).rejects.toThrow(
      /control plane secret is not configured/i,
    );
  });
});
