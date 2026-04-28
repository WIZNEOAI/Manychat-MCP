import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateManyChatApiKey } from "./manychat-validate";

describe("validateManyChatApiKey", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns ok with page name on success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "success",
        data: { name: "My Page", id: 1 },
      }),
    }) as unknown as typeof fetch;

    const result = await validateManyChatApiKey("mc_test_key_xxxxxxxx");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pageName).toBe("My Page");
      expect(typeof result.validatedAt).toBe("number");
    }
  });

  it("returns failure when ManyChat returns error status", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "error",
        message: "Invalid api key",
      }),
    }) as unknown as typeof fetch;

    const result = await validateManyChatApiKey("mc_bad");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.userFacing.length).toBeGreaterThan(0);
    }
  });
});
