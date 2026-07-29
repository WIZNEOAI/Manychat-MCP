export type HostedPlan = "free" | "supporter" | "pro";

export type CapabilityBundle = "read_only" | "operator" | "messaging_safe" | "admin";

export interface HostedPlanLimits {
  maxAccounts: number;
  dailyRequests: number;
  monthlyRequests: number;
  maxTokens: number;
}

export interface HostedResolvedSession {
  workspaceId: string;
  workspaceName: string;
  tokenId: string;
  accountId: string | null;
  accountName: string;
  apiKey: string;
  plan: HostedPlan;
  capabilityBundle: CapabilityBundle;
  limits: HostedPlanLimits;
}

export interface HostedGatewayEvent {
  tokenId: string;
  workspaceId: string;
  accountId?: string | null;
  type: "session_start" | "session_end" | "request" | "auth_failure";
  requestCount?: number;
  metadata?: Record<string, unknown>;
}
