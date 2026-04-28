import { describe, expect, it } from "vitest";
import {
  createHostedTokenSecret,
  hashHostedToken,
  parseHostedTokenPrefix,
  safeEqualHex,
} from "./hosted";

describe("hosted token helpers", () => {
  it("createHostedTokenSecret matches prefix and hash roundtrip", () => {
    const secret = createHostedTokenSecret();
    const prefix = parseHostedTokenPrefix(secret);
    expect(prefix).toBeTruthy();
    const hash = hashHostedToken(secret);
    expect(hash.length).toBe(64);
    expect(safeEqualHex(hash, hashHostedToken(secret))).toBe(true);
    expect(safeEqualHex(hash, hashHostedToken(secret + "x"))).toBe(false);
  });

  it("parseHostedTokenPrefix rejects malformed tokens", () => {
    expect(parseHostedTokenPrefix("not-a-token")).toBeNull();
    expect(parseHostedTokenPrefix("")).toBeNull();
  });
});
