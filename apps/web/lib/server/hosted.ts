import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export function normalizeVaultMasterKey(rawKey: string): Buffer {
  const trimmed = rawKey.trim();
  if (trimmed.length === 0) {
    throw new Error("VAULT_MASTER_KEY must not be empty.");
  }

  return createHash("sha256").update(trimmed).digest();
}

export function encryptVaultValue(plaintext: string): { ciphertext: string; keyVersion: string } {
  const keyVersion = process.env.VAULT_KEY_VERSION ?? "v1";
  const rawMasterKey = process.env.VAULT_MASTER_KEY;
  if (!rawMasterKey) {
    throw new Error("VAULT_MASTER_KEY is not configured.");
  }

  const masterKey = normalizeVaultMasterKey(rawMasterKey);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    keyVersion,
    ciphertext: [
      keyVersion,
      iv.toString("base64url"),
      encrypted.toString("base64url"),
      tag.toString("base64url"),
    ].join("."),
  };
}

export function decryptVaultValue(ciphertext: string): string {
  const rawMasterKey = process.env.VAULT_MASTER_KEY;
  if (!rawMasterKey) {
    throw new Error("VAULT_MASTER_KEY is not configured.");
  }
  const parts = ciphertext.split(".");
  if (parts.length !== 4) {
    throw new Error("Invalid vault ciphertext");
  }

  const [, ivEncoded, encryptedEncoded, tagEncoded] = parts;
  const masterKey = normalizeVaultMasterKey(rawMasterKey);
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      masterKey,
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

export function createHostedTokenSecret(): string {
  const prefix = randomBytes(6).toString("hex");
  const secret = randomBytes(24).toString("hex");
  return `mcp_live_${prefix}_${secret}`;
}

export function parseHostedTokenPrefix(token: string): string | null {
  const match = /^mcp_live_([a-f0-9]{12})_([a-f0-9]{48})$/.exec(token);
  if (!match) return null;
  return `mcp_live_${match[1]}`;
}

export function hashHostedToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Shape returned by the control-plane `resolve-token` endpoint. Convex `Id` values are
 * serialized as plain strings over HTTP, so ids are typed as `string` here.
 */
export type GatewayTokenRecord = {
  tokenId: string;
  tokenHash: string;
  bundle: "read_only" | "operator" | "messaging_safe" | "admin";
  workspaceId: string;
  workspaceName: string;
  plan: "free" | "supporter" | "pro";
  accountId: string | null;
  accountName: string;
  ciphertext: string;
  keyVersion: string;
  limits: {
    maxAccounts: number;
    dailyRequests: number;
    monthlyRequests: number;
    maxTokens: number;
  };
  usage: {
    dailyRequestCount: number;
    monthlyRequestCount: number;
  };
};

export function safeEqualHex(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}
