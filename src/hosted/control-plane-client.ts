import { log } from "../lib/logger.js";
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

    return (await res.json()) as HostedResolvedSession;
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

async function safeErrorText(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as { error?: string };
    return typeof data.error === "string" ? data.error : null;
  } catch {
    return null;
  }
}
