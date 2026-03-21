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

type HttpMcpAuthMode = "manychat_header" | "oauth";
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

  const sessions: Record<string, StreamableHTTPServerTransport> = {};

  async function resolveExecutionApiKey(
    req: express.Request,
  ): Promise<{ apiKey?: string; source?: string; error?: string }> {
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

    return {
      error:
        "Missing execution credential. Provide X-ManyChat-API-Key on the initialize request or configure MANYCHAT_API_KEY on the server.",
    };
  }

  app.post("/mcp", async (req, res) => {
    try {
      const sessionId = headerValue(req.headers["mcp-session-id"]);
      let transport: StreamableHTTPServerTransport;

      if (sessionId && sessions[sessionId]) {
        transport = sessions[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        const credential = await resolveExecutionApiKey(req);
        if (!credential.apiKey) {
          writeJsonRpcError(res, 401, requestIdFromBody(req.body), credential.error!);
          return;
        }

        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid) => {
            sessions[sid] = transport;
          },
        });

        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid) delete sessions[sid];
        };

        const server = createServer(credential.apiKey);
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

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      log.error("mcp_http_request_failed", {
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : String(error),
      });
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
    await sessions[sessionId].handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = headerValue(req.headers["mcp-session-id"]);
    if (!sessionId || !sessions[sessionId]) {
      res.status(400).json({ error: "Invalid or missing session" });
      return;
    }
    await sessions[sessionId].handleRequest(req, res);
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

  throw new Error("MCP_REMOTE_AUTH must be 'manychat_header' or 'oauth'.");
}

function resolveBaseUrl(
  env: NodeJS.ProcessEnv,
  port: number,
): string {
  const configuredRailwayUrl = env.RAILWAY_STATIC_URL
    ? normalizeUrl(env.RAILWAY_STATIC_URL)
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
