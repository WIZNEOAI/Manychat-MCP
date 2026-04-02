import { createHash, randomBytes } from "node:crypto";

const HOSTED_TOKEN_PATTERN = /^mcp_live_([a-f0-9]{12})_([a-f0-9]{48})$/;

export function createHostedTokenSecret(): string {
  const prefix = randomBytes(6).toString("hex");
  const secret = randomBytes(24).toString("hex");
  return `mcp_live_${prefix}_${secret}`;
}

export function parseHostedTokenPrefix(token: string): string | null {
  const match = HOSTED_TOKEN_PATTERN.exec(token);
  if (!match) return null;
  return `mcp_live_${match[1]}`;
}

export function hashHostedToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
