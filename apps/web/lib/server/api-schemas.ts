import { z } from "zod";

const convexId = z.string().min(1).max(128);

export const manychatAccountCreateBodySchema = z.object({
  displayName: z.string().min(1).max(200),
  apiKey: z.string().min(8).max(512),
  isDefault: z.boolean().optional(),
});

export const manychatRotateKeyBodySchema = z.object({
  apiKey: z.string().min(8).max(512),
});

export const mcpTokenIssueBodySchema = z.object({
  name: z.string().min(1).max(120),
  bundle: z.enum(["read_only", "operator", "messaging_safe", "admin"]),
  accountId: z.union([convexId, z.null()]).optional(),
});

export const mcpTokenTestBodySchema = z.object({
  token: z.string().min(16).max(512),
});

export const internalHostedTokenBodySchema = z.object({
  token: z.string().min(16).max(512),
});

export const internalAuthorizeBodySchema = z.object({
  workspaceId: convexId,
  tokenId: convexId,
  accountId: z.union([convexId, z.null()]).optional(),
});

export const internalRecordBodySchema = z.object({
  workspaceId: convexId,
  tokenId: convexId,
  type: z.enum(["session_start", "session_end", "request", "auth_failure"]),
  requestCount: z.number().int().min(1).max(10_000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});


export const leadSourceSchema = z.enum([
  "manual",
  "manychat",
  "meta_ads",
  "google_ads",
  "whatsapp",
  "other",
]);

export const leadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "booked",
  "won",
  "lost",
]);

export const leadCreateBodySchema = z.object({
  source: leadSourceSchema,
  displayName: z.string().min(1).max(200),
  contactHandle: z.string().min(1).max(200).optional(),
  intent: z.string().min(1).max(500).optional(),
  nextAction: z.string().min(1).max(500).optional(),
  nextActionAt: z.number().int().positive().optional(),
});

export const leadStatusUpdateBodySchema = z.object({
  status: leadStatusSchema.exclude(["new"]),
  nextAction: z.string().min(1).max(500).optional(),
  nextActionAt: z.number().int().positive().optional(),
});
export function schemaErrorMessage(error: z.ZodError): string {
  const first = error.issues[0];
  return first ? `${first.path.join(".")}: ${first.message}` : "Invalid request body.";
}
