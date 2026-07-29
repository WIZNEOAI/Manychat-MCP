import type { z } from "zod";
import { log } from "../lib/logger.js";
import { hostedResolvedSessionSchema } from "./types.js";
import type { HostedGatewayEvent, HostedResolvedSession } from "./types.js";

interface HostedControlPlaneClientOptions {
  baseUrl: string;
  sharedSecret: string;
}

export class HostedControlPlaneError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "HostedControlPlaneError";
  }
}

export class HostedControlPlaneClient {
  constructor(private readonly options: HostedControlPlaneClientOptions) {}

  async resolveSession(token: string): Promise<HostedResolvedSession> {
    const res = await fetch(`${this.options.baseUrl}/api/internal/mcp/resolve`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-manychat-internal-secret": this.options.sharedSecret,
      },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      const errorText = await safeErrorText(res);
      throw new HostedControlPlaneError(
        errorText || `Hosted control plane rejected MCP token (HTTP ${res.status}).`,
        res.status,
      );
    }

    const payload = await res.json().catch(() => undefined);
    const parsed = hostedResolvedSessionSchema.safeParse(payload);
    if (!parsed.success) {
      // The gateway and the control plane version independently, so a shape it
      // no longer honours has to fail loudly here. Casting instead would hand
      // `undefined` to code whose type says otherwise, several frames away.
      const detail = describeContractViolation(parsed.error);
      log.error("hosted_control_plane_contract_violation", { detail });
      throw new HostedControlPlaneError(
        `Hosted control plane returned an unusable session (${detail}). ` +
          `Gateway and control plane are out of contract.`,
        502,
      );
    }

    return parsed.data;
  }

  async recordEvent(event: HostedGatewayEvent): Promise<void> {
    const res = await fetch(`${this.options.baseUrl}/api/internal/mcp/record`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-manychat-internal-secret": this.options.sharedSecret,
      },
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      log.warn("hosted_control_plane_record_failed", {
        status: res.status,
        tokenId: event.tokenId,
        workspaceId: event.workspaceId,
      });
    }
  }

  async authorizeRequest(event: {
    workspaceId: string;
    tokenId: string;
    accountId?: string | null;
  }): Promise<void> {
    const res = await fetch(`${this.options.baseUrl}/api/internal/mcp/authorize`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-manychat-internal-secret": this.options.sharedSecret,
      },
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      const errorText = await safeErrorText(res);
      throw new HostedControlPlaneError(
        errorText || `Hosted request authorization failed (HTTP ${res.status}).`,
        res.status,
      );
    }
  }
}

/**
 * Renders a Zod failure as a short, greppable summary.
 *
 * Deliberately built from field paths and validation messages only — never from
 * received values. The resolve payload carries a decrypted ManyChat API key, and
 * this string reaches the logs.
 */
function describeContractViolation(error: z.ZodError): string {
  const issues = error.issues.slice(0, 3).map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";
    return `${path}: ${issue.message}`;
  });
  const extra = error.issues.length - issues.length;
  return extra > 0 ? `${issues.join("; ")} (+${extra} more)` : issues.join("; ");
}

async function safeErrorText(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as { error?: string };
    return typeof data.error === "string" ? data.error : null;
  } catch {
    return null;
  }
}
