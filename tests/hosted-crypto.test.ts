import { describe, expect, it } from "vitest";
import {
  decryptVaultValue,
  encryptVaultValue,
  normalizeVaultMasterKey,
} from "../src/hosted/crypto.js";
import {
  createHostedTokenSecret,
  hashHostedToken,
  parseHostedTokenPrefix,
} from "../src/hosted/tokens.js";

describe("hosted vault crypto", () => {
  it("round-trips encrypted ManyChat API keys", () => {
    const masterKey = normalizeVaultMasterKey("vault-master-key-for-tests");
    const encrypted = encryptVaultValue({
      plaintext: "mc_test_secret_123",
      masterKey,
      keyVersion: "v1",
    });

    expect(encrypted.keyVersion).toBe("v1");
    expect(encrypted.ciphertext).not.toContain("mc_test_secret_123");

    const decrypted = decryptVaultValue({
      ciphertext: encrypted.ciphertext,
      masterKey,
    });

    expect(decrypted).toBe("mc_test_secret_123");
  });

  it("rejects tampered ciphertext", () => {
    const masterKey = normalizeVaultMasterKey("vault-master-key-for-tests");
    const encrypted = encryptVaultValue({
      plaintext: "mc_test_secret_123",
      masterKey,
      keyVersion: "v1",
    });

    const tampered = `${encrypted.ciphertext.slice(0, -2)}aa`;

    expect(() =>
      decryptVaultValue({
        ciphertext: tampered,
        masterKey,
      }),
    ).toThrow("Invalid vault ciphertext");
  });
});

describe("hosted token primitives", () => {
  it("creates product tokens with a stable prefix lookup", () => {
    const token = createHostedTokenSecret();
    const prefix = parseHostedTokenPrefix(token);

    expect(token.startsWith("mcp_live_")).toBe(true);
    expect(prefix).toMatch(/^mcp_live_[a-f0-9]{12}$/);
    expect(hashHostedToken(token)).toHaveLength(64);
  });

  it("rejects malformed hosted tokens", () => {
    expect(parseHostedTokenPrefix("invalid-token")).toBeNull();
    expect(parseHostedTokenPrefix("mcp_live_short")).toBeNull();
  });
});
