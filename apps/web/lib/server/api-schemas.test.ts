import { describe, expect, it } from "vitest";
import {
  manychatAccountCreateBodySchema,
  manychatRotateKeyBodySchema,
  mcpTokenIssueBodySchema,
  mcpTokenTestBodySchema,
  internalHostedTokenBodySchema,
  internalAuthorizeBodySchema,
  internalRecordBodySchema,
  schemaErrorMessage,
} from "./api-schemas";

describe("manychatAccountCreateBodySchema", () => {
  it("accepts valid input", () => {
    const result = manychatAccountCreateBodySchema.safeParse({
      displayName: "My Page",
      apiKey: "mc_test_key_12345678",
      isDefault: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty displayName", () => {
    const result = manychatAccountCreateBodySchema.safeParse({
      displayName: "",
      apiKey: "mc_test_key_1234",
    });
    expect(result.success).toBe(false);
    expect(schemaErrorMessage(result.error!)).toContain("displayName");
  });

  it("rejects short apiKey (less than 8 chars)", () => {
    const result = manychatAccountCreateBodySchema.safeParse({
      displayName: "Test",
      apiKey: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = manychatAccountCreateBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("manychatRotateKeyBodySchema", () => {
  it("accepts valid apiKey", () => {
    const result = manychatRotateKeyBodySchema.safeParse({
      apiKey: "mc_new_key_12345678",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty apiKey", () => {
    const result = manychatRotateKeyBodySchema.safeParse({ apiKey: "" });
    expect(result.success).toBe(false);
  });
});

describe("mcpTokenIssueBodySchema", () => {
  it("accepts valid bundle values", () => {
    const valid = ["read_only", "operator", "messaging_safe", "admin"];
    for (const bundle of valid) {
      const result = mcpTokenIssueBodySchema.safeParse({ name: "test", bundle });
      expect(result.success).toBe(true);
    }
  });

  it("rejects unknown bundle", () => {
    const result = mcpTokenIssueBodySchema.safeParse({ name: "test", bundle: "superuser" });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = mcpTokenIssueBodySchema.safeParse({ name: "", bundle: "admin" });
    expect(result.success).toBe(false);
  });
});

describe("mcpTokenTestBodySchema", () => {
  it("accepts valid token", () => {
    const result = mcpTokenTestBodySchema.safeParse({
      token: "mcp_live_aabbccddeeff_aabbccddeeff001122334455667788990011223344556677880011223344",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short token", () => {
    const result = mcpTokenTestBodySchema.safeParse({ token: "short" });
    expect(result.success).toBe(false);
  });
});

describe("internalHostedTokenBodySchema", () => {
  it("accepts valid hosted token string", () => {
    const result = internalHostedTokenBodySchema.safeParse({
      token: "mcp_live_aabbccddeeff_aabbccddeeff001122334455667788990011223344556677880011223344",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty token", () => {
    const result = internalHostedTokenBodySchema.safeParse({ token: "" });
    expect(result.success).toBe(false);
  });
});

describe("internalAuthorizeBodySchema", () => {
  it("accepts valid workspaceId and tokenId", () => {
    const result = internalAuthorizeBodySchema.safeParse({
      workspaceId: "k52hz3v40e2a1",
      tokenId: "k52hz3v40e2b2",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional accountId", () => {
    const result = internalAuthorizeBodySchema.safeParse({
      workspaceId: "k52hz3v40e2a1",
      tokenId: "k52hz3v40e2b2",
      accountId: "k52hz3v40e2c3",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing workspaceId", () => {
    const result = internalAuthorizeBodySchema.safeParse({ tokenId: "k52hz3v40e2b2" });
    expect(result.success).toBe(false);
  });
});

describe("internalRecordBodySchema", () => {
  it("accepts valid event", () => {
    const result = internalRecordBodySchema.safeParse({
      workspaceId: "k52hz3v40e2a1",
      tokenId: "k52hz3v40e2b2",
      type: "request",
      requestCount: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown event type", () => {
    const result = internalRecordBodySchema.safeParse({
      workspaceId: "k52hz3v40e2a1",
      tokenId: "k52hz3v40e2b2",
      type: "unknown_event",
    });
    expect(result.success).toBe(false);
  });
});
