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
