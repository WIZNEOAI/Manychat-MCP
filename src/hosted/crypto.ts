import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

interface EncryptVaultValueArgs {
  plaintext: string;
  masterKey: Buffer;
  keyVersion: string;
}

interface DecryptVaultValueArgs {
  ciphertext: string;
  masterKey: Buffer;
}

export function normalizeVaultMasterKey(rawKey: string): Buffer {
  const trimmed = rawKey.trim();
  if (trimmed.length === 0) {
    throw new Error("VAULT_MASTER_KEY must not be empty.");
  }

  try {
    const decoded = Buffer.from(trimmed, "base64");
    if (decoded.length === 32 && decoded.toString("base64") === trimmed) {
      return decoded;
    }
  } catch {
    // Fall through to hash-based derivation.
  }

  return createHash("sha256").update(trimmed).digest();
}

export function encryptVaultValue(args: EncryptVaultValueArgs): {
  ciphertext: string;
  keyVersion: string;
} {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", args.masterKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(args.plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    keyVersion: args.keyVersion,
    ciphertext: [
      args.keyVersion,
      iv.toString("base64url"),
      encrypted.toString("base64url"),
      tag.toString("base64url"),
    ].join("."),
  };
}

export function decryptVaultValue(args: DecryptVaultValueArgs): string {
  const parts = args.ciphertext.split(".");
  if (parts.length !== 4) {
    throw new Error("Invalid vault ciphertext");
  }

  const [, ivEncoded, encryptedEncoded, tagEncoded] = parts;

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      args.masterKey,
      Buffer.from(ivEncoded, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedEncoded, "base64url")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    throw new Error("Invalid vault ciphertext");
  }
}
