export type PolicyLevel = "allow" | "warn" | "block";

export type ManyChatChannel =
  | "messenger"
  | "instagram"
  | "whatsapp"
  | "sms"
  | "email"
  | "telegram";

export interface OutboundMessageContext {
  /** Channel the message is sent on. */
  channel: ManyChatChannel;
  /** Hours since the subscriber last interacted. Undefined = unknown (treated as outside window). */
  hoursSinceLastInteraction?: number;
  /** Message tag the caller intends to use, if any. */
  messageTag?: string;
  /** True if the content is promotional/marketing. */
  promotional?: boolean;
  /** Whether the subscriber has a recorded opt-in. */
  hasOptIn?: boolean;
  /** Clock injection for deterministic tests. Defaults to new Date() at call time. */
  now?: Date;
}

export interface PolicyFinding {
  code: string;
  level: PolicyLevel;
  message: string;
  rule: string;
}

export interface PolicyVerdict {
  level: PolicyLevel;
  allowed: boolean;
  findings: PolicyFinding[];
}
