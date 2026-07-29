import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  HostedControlPlaneClient,
  HostedControlPlaneError,
} from "../src/hosted/control-plane-client.js";

describe("HostedControlPlaneClient", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const TOKEN =
    "mcp_live_abcdabcdabcd_abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd";

  const newClient = () =>
    new HostedControlPlaneClient({
      baseUrl: "https://app.example.com",
      sharedSecret: "secret",
    });

  it("resolveSession posts token and returns JSON on success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        workspaceId: "ws1",
        apiKey: "mc_x",
        tokenId: "t1",
        capabilityBundle: "read_only",
      }),
    }) as unknown as typeof fetch;

    const client = new HostedControlPlaneClient({
      baseUrl: "https://app.example.com",
      sharedSecret: "secret",
    });
    const session = await client.resolveSession("mcp_live_abcdabcdabcd_abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd");
    expect(session.workspaceId).toBe("ws1");
    expect(session.apiKey).toBe("mc_x");

    expect(fetch).toHaveBeenCalledWith(
      "https://app.example.com/api/internal/mcp/resolve",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-manychat-internal-secret": "secret",
        }),
      }),
    );
  });

  it("resolveSession keeps optional fields the gateway does not read", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        workspaceId: "ws1",
        workspaceName: "Acme",
        tokenId: "t1",
        accountId: null,
        accountName: "Default",
        apiKey: "mc_x",
        plan: "supporter",
        capabilityBundle: "operator",
        limits: {
          maxAccounts: 3,
          dailyRequests: 5000,
          monthlyRequests: 100000,
          maxTokens: 10,
        },
      }),
    }) as unknown as typeof fetch;

    const session = await newClient().resolveSession(TOKEN);
    expect(session.plan).toBe("supporter");
    expect(session.limits?.dailyRequests).toBe(5000);
    expect(session.accountId).toBeNull();
  });

  // Forward compatibility: the control plane must be able to add fields without
  // waiting for a gateway release.
  it("resolveSession tolerates unknown fields by stripping them", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        workspaceId: "ws1",
        tokenId: "t1",
        apiKey: "mc_x",
        capabilityBundle: "admin",
        somethingShippedLater: { nested: true },
      }),
    }) as unknown as typeof fetch;

    const session = await newClient().resolveSession(TOKEN);
    expect(session.workspaceId).toBe("ws1");
    expect(session).not.toHaveProperty("somethingShippedLater");
  });

  // The whole point of parsing: a 200 that no longer honours the shape must fail
  // here, not hand `undefined` to code whose type promises a string.
  it.each([
    ["a missing apiKey", { workspaceId: "ws1", tokenId: "t1", capabilityBundle: "admin" }, "apiKey"],
    ["an empty apiKey", { workspaceId: "ws1", tokenId: "t1", apiKey: "", capabilityBundle: "admin" }, "apiKey"],
    ["a missing workspaceId", { tokenId: "t1", apiKey: "mc_x", capabilityBundle: "admin" }, "workspaceId"],
    ["a missing tokenId", { workspaceId: "ws1", apiKey: "mc_x", capabilityBundle: "admin" }, "tokenId"],
    [
      "an unknown capability bundle",
      { workspaceId: "ws1", tokenId: "t1", apiKey: "mc_x", capabilityBundle: "superuser" },
      "capabilityBundle",
    ],
    [
      "a malformed limits object",
      {
        workspaceId: "ws1",
        tokenId: "t1",
        apiKey: "mc_x",
        capabilityBundle: "admin",
        limits: { maxAccounts: "three" },
      },
      "limits",
    ],
  ])("resolveSession rejects %s", async (_label, body, offendingField) => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => body,
    }) as unknown as typeof fetch;

    await expect(newClient().resolveSession(TOKEN)).rejects.toMatchObject({
      name: "HostedControlPlaneError",
      status: 502,
      message: expect.stringContaining(offendingField),
    });
  });

  it("resolveSession rejects a body that is not an object", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => "not json at all",
    }) as unknown as typeof fetch;

    await expect(newClient().resolveSession(TOKEN)).rejects.toThrow(HostedControlPlaneError);
  });

  // The resolve payload carries a decrypted ManyChat key. A contract failure
  // must not put it in the logs.
  it("a contract violation never echoes the resolved credential", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        workspaceId: "ws1",
        tokenId: "t1",
        apiKey: "mc_super_secret_value",
        capabilityBundle: "not_a_bundle",
      }),
    }) as unknown as typeof fetch;

    const error = await newClient()
      .resolveSession(TOKEN)
      .catch((err: unknown) => err as Error);
    expect(error.message).not.toContain("mc_super_secret_value");
  });

  it("resolveSession throws HostedControlPlaneError on failure", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Invalid hosted token." }),
    }) as unknown as typeof fetch;

    const client = new HostedControlPlaneClient({
      baseUrl: "https://app.example.com",
      sharedSecret: "secret",
    });

    await expect(client.resolveSession("mcp_live_abcdabcdabcd_abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd")).rejects.toThrow(
      HostedControlPlaneError,
    );
  });
});
