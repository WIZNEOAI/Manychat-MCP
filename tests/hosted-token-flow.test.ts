import { describe, expect, it } from "vitest";
import {
  createHostedTokenSecret,
  hashHostedToken,
  parseHostedTokenPrefix,
} from "../src/hosted/tokens.js";
import { createToolAllowance } from "../src/hosted/capabilities.js";
import { encryptVaultValue, decryptVaultValue, normalizeVaultMasterKey } from "../src/hosted/crypto.js";
import type { CapabilityBundle } from "../src/hosted/types.js";

describe("hosted token generation and format", () => {
  it("generates token matching mcp_live_<12hex>_<48hex> pattern", () => {
    const token = createHostedTokenSecret();
    expect(token).toMatch(/^mcp_live_[a-f0-9]{12}_[a-f0-9]{48}$/);
  });

  it("parseHostedTokenPrefix extracts correct prefix", () => {
    const token = createHostedTokenSecret();
    const prefix = parseHostedTokenPrefix(token);
    expect(prefix).toBeTruthy();
    expect(prefix).toMatch(/^mcp_live_[a-f0-9]{12}$/);
    expect(token.startsWith(prefix!)).toBe(true);
  });

  it("different tokens produce different prefixes and hashes", () => {
    const tokenA = createHostedTokenSecret();
    const tokenB = createHostedTokenSecret();
    const prefixA = parseHostedTokenPrefix(tokenA);
    const prefixB = parseHostedTokenPrefix(tokenB);
    expect(prefixA).not.toBe(prefixB);
    expect(hashHostedToken(tokenA)).not.toBe(hashHostedToken(tokenB));
  });

  it("token hash is deterministic and 64 hex chars", () => {
    const token = createHostedTokenSecret();
    const hash = hashHostedToken(token);
    expect(hash).toBe(hashHostedToken(token));
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("parseHostedTokenPrefix rejects malformed or empty input", () => {
    expect(parseHostedTokenPrefix("not-a-token")).toBeNull();
    expect(parseHostedTokenPrefix("")).toBeNull();
    expect(parseHostedTokenPrefix("mcp_live_tooshort_tooshort")).toBeNull();
  });

  it("token hash mismatch - wrong secret doesn't match stored hash", () => {
    const token = createHostedTokenSecret();
    const hash = hashHostedToken(token);
    // Revoked-like scenario: hash of different token won't match
    const otherToken = createHostedTokenSecret();
    expect(hash).not.toBe(hashHostedToken(otherToken));
  });
});

describe("capability bundle enforcement", () => {
  const bundles: CapabilityBundle[] = ["read_only", "operator", "messaging_safe", "admin"];

  it("read_only cannot call any send/mutating tools", () => {
    const allow = createToolAllowance("read_only");
    expect(allow("get_page_info")).toBe(true);
    expect(allow("get_subscriber")).toBe(true);
    expect(allow("list_tags")).toBe(true);
    expect(allow("send_text_message")).toBe(false);
    expect(allow("send_content")).toBe(false);
    expect(allow("send_flow")).toBe(false);
    expect(allow("create_tag")).toBe(false);
    expect(allow("add_tag_to_subscriber")).toBe(false);
    expect(allow("set_custom_field")).toBe(false);
    expect(allow("create_subscriber")).toBe(false);
    expect(allow("update_subscriber")).toBe(false);
    expect(allow("set_bot_field")).toBe(false);
    expect(allow("create_custom_field")).toBe(false);
  });

  it("operator can manage subscribers and tags but not send messages", () => {
    const allow = createToolAllowance("operator");
    expect(allow("create_subscriber")).toBe(true);
    expect(allow("update_subscriber")).toBe(true);
    expect(allow("create_tag")).toBe(true);
    expect(allow("add_tag_to_subscriber")).toBe(true);
    expect(allow("set_custom_field")).toBe(true);
    expect(allow("set_custom_fields_bulk")).toBe(true);
    expect(allow("send_text_message")).toBe(false);
    expect(allow("send_content")).toBe(false);
    expect(allow("send_flow")).toBe(false);
  });

  it("messaging_safe can send but not administer bot fields", () => {
    const allow = createToolAllowance("messaging_safe");
    expect(allow("send_text_message")).toBe(true);
    expect(allow("send_content")).toBe(true);
    expect(allow("send_flow")).toBe(true);
    expect(allow("set_bot_field")).toBe(false);
    expect(allow("create_custom_field")).toBe(false);
  });

  it("admin has full access", () => {
    const allow = createToolAllowance("admin");
    expect(allow("send_text_message")).toBe(true);
    expect(allow("send_content")).toBe(true);
    expect(allow("send_flow")).toBe(true);
    expect(allow("set_bot_field")).toBe(true);
    expect(allow("create_custom_field")).toBe(true);
    expect(allow("create_subscriber")).toBe(true);
  });

  it("every bundle includes health_check and get_page_info", () => {
    for (const bundle of bundles) {
      const allow = createToolAllowance(bundle);
      expect(allow("health_check")).toBe(true);
      expect(allow("get_page_info")).toBe(true);
    }
  });
});

describe("vault crypto roundtrip", () => {
  const masterKey = normalizeVaultMasterKey("test-vault-master-key-for-unit-tests-only");
  const keyVersion = "v1";

  it("encrypts and decrypts plaintext correctly", () => {
    const plaintext = "mc_test_very_secret_api_key_12345";
    const { ciphertext, keyVersion: kv } = encryptVaultValue({
      plaintext,
      masterKey,
      keyVersion,
    });
    expect(kv).toBe(keyVersion);
    expect(ciphertext).toContain(keyVersion);
    expect(ciphertext.split(".")).toHaveLength(4);

    const decrypted = decryptVaultValue({ ciphertext, masterKey });
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext for same plaintext (random IV)", () => {
    const plaintext = "mc_test_key";
    const result1 = encryptVaultValue({ plaintext, masterKey, keyVersion });
    const result2 = encryptVaultValue({ plaintext, masterKey, keyVersion });
    expect(result1.ciphertext).not.toBe(result2.ciphertext);
    // Both must decrypt to the same value
    expect(decryptVaultValue({ ciphertext: result1.ciphertext, masterKey })).toBe(plaintext);
    expect(decryptVaultValue({ ciphertext: result2.ciphertext, masterKey })).toBe(plaintext);
  });

  it("decrypt fails with wrong master key", () => {
    const plaintext = "mc_test_key_abc";
    const { ciphertext } = encryptVaultValue({ plaintext, masterKey, keyVersion });
    const wrongKey = normalizeVaultMasterKey("completely-different-key");
    expect(() => decryptVaultValue({ ciphertext, masterKey: wrongKey })).toThrow(
      "Invalid vault ciphertext",
    );
  });

  it("decrypt fails with tampered ciphertext", () => {
    const plaintext = "mc_test_key_def";
    const { ciphertext } = encryptVaultValue({ plaintext, masterKey, keyVersion });
    const tampered = ciphertext.replace(".", "X");
    expect(() => decryptVaultValue({ ciphertext: tampered, masterKey })).toThrow(
      "Invalid vault ciphertext",
    );
  });
});
