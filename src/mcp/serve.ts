import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { randomUUID } from "node:crypto";
import { createServer } from "../server.js";
import { log } from "../lib/logger.js";
import { createOAuthRouter } from "../auth/oauth-routes.js";
import { resolveApiKeyFromToken } from "../auth/oauth.js";
import { assertDurableOAuthStoreConfig } from "../auth/oauth-store.js";
import { MANYCHAT_PRODUCT } from "../product.js";
import {
  HostedControlPlaneClient,
  HostedControlPlaneError,
} from "../hosted/control-plane-client.js";
import type { HostedResolvedSession } from "../hosted/types.js";

export async function startLegacyMcpServer(args: string[] = []) {
  const transportFlag = getFlagValue(args, "--transport");
  const transport = resolveTransport(transportFlag ?? process.env.MCP_TRANSPORT ?? "stdio");

  if (transport === "http") {
    await startHttp(resolveHttpRuntimeConfig(process.env, args));
    return;
  }

  await startStdio();
}

export async function startProductionHttpServer(
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  await startHttp(resolveHttpRuntimeConfig(env));
}

async function startStdio() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("ManyChat MCP compatibility server running on stdio");
}

type HttpMcpAuthMode = "manychat_header" | "oauth" | "hosted_token";
type McpTransport = "stdio" | "http";

interface HttpRuntimeConfig {
  port: number;
  baseUrl: string;
  authMode: HttpMcpAuthMode;
  nodeEnv: string;
}

export function resolveHttpRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
  args: string[] = [],
): HttpRuntimeConfig {
  const port = parsePort(getFlagValue(args, "--port") ?? env.PORT ?? "3000");
  const authMode = resolveAuthMode(env.MCP_REMOTE_AUTH);
  const baseUrl = resolveBaseUrl(env, port);
  const nodeEnv = env.NODE_ENV ?? "development";

  if (authMode === "oauth" && nodeEnv === "production") {
    assertDurableOAuthStoreConfig(env);
    if (!isHttpsUrl(baseUrl)) {
      throw new Error(
        "Production OAuth over HTTP requires an HTTPS public base URL. Set MCP_BASE_URL (preferred), BASE_URL, or Railway's public domain.",
      );
    }
  }

  if (authMode === "hosted_token" && nodeEnv === "production") {
    if (!env.HOSTED_CONTROL_PLANE_URL?.trim()) {
      throw new Error(
        "HOSTED_CONTROL_PLANE_URL is required when MCP_REMOTE_AUTH=hosted_token in production.",
      );
    }
    if (!env.HOSTED_CONTROL_PLANE_SECRET?.trim()) {
      throw new Error(
        "HOSTED_CONTROL_PLANE_SECRET is required when MCP_REMOTE_AUTH=hosted_token in production.",
      );
    }
  }

  return {
    port,
    baseUrl,
    authMode,
    nodeEnv,
  };
}

async function startHttp(config: HttpRuntimeConfig) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());

  app.use((req, _res, next) => {
    const requestId = randomUUID().slice(0, 8);
    log.info("request", {
      requestId,
      method: req.method,
      path: req.path,
    });
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      server: MANYCHAT_PRODUCT.name,
      version: MANYCHAT_PRODUCT.version,
      transport: "http",
      authMode: config.authMode,
      baseUrl: config.baseUrl,
    });
  });

  if (config.authMode === "oauth") {
    app.use(express.urlencoded({ extended: true }));
    app.use(createOAuthRouter(config.baseUrl));
  }

  const sessions: Record<
    string,
    {
      transport: StreamableHTTPServerTransport;
      hostedSession?: HostedResolvedSession;
    }
  > = {};
  const workspaceSessionCounts = new Map<string, number>();
  const hostedControlPlaneClient =
    config.authMode === "hosted_token" && process.env.HOSTED_CONTROL_PLANE_URL && process.env.HOSTED_CONTROL_PLANE_SECRET
      ? new HostedControlPlaneClient({
          baseUrl: normalizeUrl(process.env.HOSTED_CONTROL_PLANE_URL),
          sharedSecret: process.env.HOSTED_CONTROL_PLANE_SECRET,
        })
      : null;

  async function resolveExecutionApiKey(
    req: express.Request,
  ): Promise<{
    apiKey?: string;
    source?: string;
    error?: string;
    statusCode?: number;
    hostedSession?: HostedResolvedSession;
  }> {
    const headerKey = headerValue(req.headers["x-manychat-api-key"]);
    if (headerKey) {
      return { apiKey: headerKey, source: "x-manychat-api-key" };
    }

    const envKey = process.env.MANYCHAT_API_KEY?.trim();
    if (envKey) {
      return { apiKey: envKey, source: "MANYCHAT_API_KEY" };
    }

    if (config.authMode === "oauth") {
      const authHeader = headerValue(req.headers.authorization);
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7).trim();
        const key = token ? await resolveApiKeyFromToken(token) : null;
        if (key) {
          return { apiKey: key, source: "oauth_access_token" };
        }

        return {
          error:
            "Invalid or expired MCP bearer token. Re-authenticate or provide X-ManyChat-API-Key.",
        };
      }

      return {
        error:
          "Missing execution credential. Provide Authorization: Bearer <mcp_token>, X-ManyChat-API-Key, or configure MANYCHAT_API_KEY on the server.",
      };
    }

    if (config.authMode === "hosted_token") {
      const authHeader = headerValue(req.headers.authorization);
      if (!authHeader?.startsWith("Bearer ")) {
        return {
          error:
            "Missing hosted MCP token. Provide Authorization: Bearer <mcp_token>.",
        };
      }

      if (!hostedControlPlaneClient) {
        return {
          error:
            "Hosted control plane is not configured. Set HOSTED_CONTROL_PLANE_URL and HOSTED_CONTROL_PLANE_SECRET.",
        };
      }

      const token = authHeader.slice(7).trim();
      try {
        const hostedSession = await hostedControlPlaneClient.resolveSession(token);
        return {
          apiKey: hostedSession.apiKey,
          source: "hosted_product_token",
          hostedSession,
        };
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : "Invalid hosted MCP bearer token.",
          statusCode:
            error instanceof HostedControlPlaneError ? error.status : 401,
        };
      }
    }

    return {
      error:
        "Missing execution credential. Provide X-ManyChat-API-Key on the initialize request or configure MANYCHAT_API_KEY on the server.",
    };
  }

  app.post("/mcp", async (req, res) => {
    let hostedSession: HostedResolvedSession | undefined;
    let reservedHostedSlot = false;
    try {
      const sessionId = headerValue(req.headers["mcp-session-id"]);
      let transport: StreamableHTTPServerTransport;
      let initializedThisRequest = false;

      if (sessionId && sessions[sessionId]) {
        transport = sessions[sessionId].transport;
        hostedSession = sessions[sessionId].hostedSession;
      } else if (!sessionId && isInitializeRequest(req.body)) {
        const credential = await resolveExecutionApiKey(req);
        if (!credential.apiKey) {
          writeJsonRpcError(
            res,
            credential.statusCode ?? 401,
            requestIdFromBody(req.body),
            credential.error!,
          );
          return;
        }
        hostedSession = credential.hostedSession;
        initializedThisRequest = true;

        if (hostedSession) {
          const active = workspaceSessionCounts.get(hostedSession.workspaceId) ?? 0;
          if (active >= hostedSession.limits.maxConcurrentSessions) {
            writeJsonRpcError(
              res,
              429,
              requestIdFromBody(req.body),
              `Workspace session cap reached (${hostedSession.limits.maxConcurrentSessions}).`,
            );
            return;
          }
          workspaceSessionCounts.set(hostedSession.workspaceId, active + 1);
          reservedHostedSlot = true;
        }

        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid) => {
            sessions[sid] = { transport, hostedSession };
          },
        });

        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid) delete sessions[sid];
          if (hostedSession) {
            releaseWorkspaceSlot(workspaceSessionCounts, hostedSession.workspaceId);
            void hostedControlPlaneClient?.recordEvent({
              type: "session_end",
              tokenId: hostedSession.tokenId,
              workspaceId: hostedSession.workspaceId,
              accountId: hostedSession.accountId,
            });
          }
        };

        const server = createServer(credential.apiKey, {
          capabilityBundle: hostedSession?.capabilityBundle ?? "admin",
        });
        await server.connect(transport);
      } else {
        writeJsonRpcError(
          res,
          400,
          requestIdFromBody(req.body),
          "No valid session. Send an initialize request first.",
        );
        return;
      }

      if (hostedSession && hostedControlPlaneClient) {
        try {
          await hostedControlPlaneClient.authorizeRequest({
            workspaceId: hostedSession.workspaceId,
            tokenId: hostedSession.tokenId,
            accountId: hostedSession.accountId,
          });
        } catch (error) {
          const statusCode =
            error instanceof HostedControlPlaneError ? error.status : 401;
          writeJsonRpcError(
            res,
            statusCode,
            requestIdFromBody(req.body),
            error instanceof Error
              ? error.message
              : "Hosted request authorization failed.",
          );
          return;
        }
      }

      await transport.handleRequest(req, res, req.body);

      if (hostedSession) {
        if (initializedThisRequest) {
          await hostedControlPlaneClient?.recordEvent({
            type: "session_start",
            tokenId: hostedSession.tokenId,
            workspaceId: hostedSession.workspaceId,
            accountId: hostedSession.accountId,
            metadata: {
              capabilityBundle: hostedSession.capabilityBundle,
              accountName: hostedSession.accountName,
            },
          });
        }
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Workspace session cap reached")
      ) {
        log.warn("hosted_session_cap_reached", {
          error: error.message,
        });
      }
      log.error("mcp_http_request_failed", {
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : String(error),
      });
      if (reservedHostedSlot && hostedSession) {
        releaseWorkspaceSlot(workspaceSessionCounts, hostedSession.workspaceId);
      }
      writeJsonRpcError(
        res,
        500,
        requestIdFromBody(req.body),
        "Failed to process MCP HTTP request.",
      );
    }
  });

  app.get("/mcp", async (req, res) => {
    const sessionId = headerValue(req.headers["mcp-session-id"]);
    if (!sessionId || !sessions[sessionId]) {
      res.status(400).json({ error: "Invalid or missing session" });
      return;
    }
    await sessions[sessionId].transport.handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = headerValue(req.headers["mcp-session-id"]);
    if (!sessionId || !sessions[sessionId]) {
      res.status(400).json({ error: "Invalid or missing session" });
      return;
    }
    await sessions[sessionId].transport.handleRequest(req, res);
  });

  if (config.nodeEnv === "production") {
    log.warn("mcp_http_sessions_are_process_local", {
      warning:
        "HTTP MCP sessions live in process memory. Run a single replica and expect clients to reconnect after restarts.",
    });
  }

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(config.port, () => {
      log.info("ManyChat MCP compatibility server running", {
        url: `http://0.0.0.0:${config.port}`,
        baseUrl: config.baseUrl,
        authMode: config.authMode,
        mcpEndpoint: "POST /mcp",
        healthCheck: "GET /health",
      });
      resolve();
    });
    server.on("error", reject);
  });
}

function getFlagValue(args: string[], flagName: string): string | undefined {
  const index = args.indexOf(flagName);
  if (index === -1) return undefined;
  return args[index + 1];
}

function parsePort(rawValue: string): number {
  const port = Number(rawValue);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid MCP HTTP port: ${rawValue}.`);
  }
  return port;
}

function resolveTransport(rawValue: string): McpTransport {
  const normalized = rawValue.trim().toLowerCase();
  if (normalized === "stdio" || normalized === "http") {
    return normalized;
  }

  throw new Error("MCP transport must be 'stdio' or 'http'.");
}

function resolveAuthMode(rawValue: string | undefined): HttpMcpAuthMode {
  const normalized = (rawValue ?? "manychat_header").trim().toLowerCase();

  if (
    normalized === "manychat_header" ||
    normalized === "manychat-header" ||
    normalized === "header"
  ) {
    return "manychat_header";
  }

  if (normalized === "oauth") {
    return "oauth";
  }

  if (normalized === "hosted_token" || normalized === "hosted-token" || normalized === "hosted") {
    return "hosted_token";
  }

  throw new Error("MCP_REMOTE_AUTH must be 'manychat_header', 'oauth', or 'hosted_token'.");
}

function resolveBaseUrl(
  env: NodeJS.ProcessEnv,
  port: number,
): string {
  const configuredRailwayUrl = env.RAILWAY_STATIC_URL
    ? normalizeRailwayPublicUrl(env.RAILWAY_STATIC_URL)
    : undefined;
  const configured =
    env.MCP_BASE_URL ??
    env.BASE_URL ??
    normalizeRailwayPublicUrl(env.RAILWAY_PUBLIC_DOMAIN) ??
    configuredRailwayUrl ??
    `http://localhost:${port}`;

  return normalizeUrl(configured);
}

function normalizeRailwayPublicUrl(domain: string | undefined): string | undefined {
  if (!domain) return undefined;
  return normalizeUrl(`https://${domain}`);
}

function normalizeUrl(rawValue: string | undefined): string {
  if (!rawValue) {
    throw new Error("A valid URL is required.");
  }

  let parsed: URL;
  try {
    parsed = new URL(rawValue);
  } catch {
    throw new Error(`Invalid URL: ${rawValue}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`URL must use http or https: ${rawValue}`);
  }

  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

function isHttpsUrl(url: string): boolean {
  return url.startsWith("https://");
}

function headerValue(rawHeader: string | string[] | undefined): string | undefined {
  if (Array.isArray(rawHeader)) {
    return rawHeader[0];
  }

  if (typeof rawHeader !== "string") {
    return undefined;
  }

  const trimmed = rawHeader.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function releaseWorkspaceSlot(counts: Map<string, number>, workspaceId: string): void {
  const current = counts.get(workspaceId) ?? 0;
  if (current <= 1) {
    counts.delete(workspaceId);
    return;
  }
  counts.set(workspaceId, current - 1);
}

function requestIdFromBody(body: unknown): unknown {
  if (body && typeof body === "object" && "id" in body) {
    return (body as { id?: unknown }).id ?? null;
  }

  return null;
}

function writeJsonRpcError(
  res: express.Response,
  statusCode: number,
  id: unknown,
  message: string,
): void {
  res.status(statusCode).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message,
    },
    id,
  });
}
