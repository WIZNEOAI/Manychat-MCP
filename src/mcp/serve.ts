import { createMcpHandler, type McpHttpHandler } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { toNodeHandler } from "@modelcontextprotocol/node";
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
import type { McpCacheProfile } from "./cache-hints.js";

/**
 * JSON-RPC error codes this gateway emits itself.
 *
 * MCP 2026-07-28 claims `-32020..-32099` for the specification and marks
 * `-32000..-32019` as a legacy sub-range new implementations SHOULD NOT use at
 * all, so gateway-specific failures live outside JSON-RPC's reserved
 * `-32768..-32000` band. The spec-defined protocol codes — `-32020` header
 * mismatch, `-32021` missing client capability, `-32022` unsupported protocol
 * version and `-32602` invalid params — are emitted by the SDK's own
 * validation ladder once the request reaches the handler, never from here.
 */
const JSON_RPC_PARSE_ERROR = -32700;
const JSON_RPC_INTERNAL_ERROR = -32603;
/** Gateway-specific: the request carried no usable ManyChat execution credential. */
const MCP_UNAUTHORIZED = -31001;
/** Gateway-specific: the hosted control plane refused the request (plan limits, revoked token). */
const MCP_REQUEST_NOT_AUTHORIZED = -31002;

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
  // `serveStdio` owns the era decision for the connection: a 2026-07-28 client
  // opens with `server/discover`, a 2025-era one with `initialize`, and both are
  // served from the same factory.
  serveStdio(() => createServer(undefined, { cacheProfile: "single_tenant" }), {
    onerror: (error) => log.error("mcp_stdio_error", { error: error.message }),
  });
  log.info("ManyChat MCP server running on stdio");
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

/** What credential resolution hands to the per-request server factory. */
interface ResolvedExecutionCredential {
  apiKey: string;
  source: string;
  hostedSession?: HostedResolvedSession;
}

/** The per-request credential, carried to the factory on `AuthInfo.extra`. */
interface McpAuthExtra {
  manychatApiKey: string;
  credentialSource: string;
  hostedSession?: HostedResolvedSession;
}

async function startHttp(config: HttpRuntimeConfig) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

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
    app.use(express.urlencoded({ extended: true, limit: "32kb" }));
    app.use(createOAuthRouter(config.baseUrl));
  }

  const cacheProfile: McpCacheProfile =
    config.authMode === "hosted_token" ? "multi_tenant" : "single_tenant";

  const hostedControlPlaneClient =
    config.authMode === "hosted_token" &&
    process.env.HOSTED_CONTROL_PLANE_URL &&
    process.env.HOSTED_CONTROL_PLANE_SECRET
      ? new HostedControlPlaneClient({
          baseUrl: normalizeUrl(process.env.HOSTED_CONTROL_PLANE_URL),
          sharedSecret: process.env.HOSTED_CONTROL_PLANE_SECRET,
        })
      : null;

  async function resolveExecutionApiKey(req: express.Request): Promise<{
    credential?: ResolvedExecutionCredential;
    error?: string;
    statusCode?: number;
  }> {
    const headerKey = headerValue(req.headers["x-manychat-api-key"]);
    if (headerKey) {
      return { credential: { apiKey: headerKey, source: "x-manychat-api-key" } };
    }

    const envKey = process.env.MANYCHAT_API_KEY?.trim();
    if (envKey) {
      return { credential: { apiKey: envKey, source: "MANYCHAT_API_KEY" } };
    }

    if (config.authMode === "oauth") {
      const authHeader = headerValue(req.headers.authorization);
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7).trim();
        const key = token ? await resolveApiKeyFromToken(token) : null;
        if (key) {
          return { credential: { apiKey: key, source: "oauth_access_token" } };
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
          error: "Missing hosted MCP token. Provide Authorization: Bearer <mcp_token>.",
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
          credential: {
            apiKey: hostedSession.apiKey,
            source: "hosted_product_token",
            hostedSession,
          },
        };
      } catch (error) {
        return {
          error:
            error instanceof Error ? error.message : "Invalid hosted MCP bearer token.",
          statusCode: error instanceof HostedControlPlaneError ? error.status : 401,
        };
      }
    }

    return {
      error:
        "Missing execution credential. Provide X-ManyChat-API-Key on the request or configure MANYCHAT_API_KEY on the server.",
    };
  }

  // One handler for the process. `legacy` is deliberately left unset: its
  // default, 'stateless', keeps answering 2025-era clients from the same
  // factory (a fresh instance per request, no session ids) and answers GET and
  // DELETE — the removed 2025 session operations — with 405.
  const handler: McpHttpHandler = createMcpHandler(
    (ctx) => {
      const extra = ctx.authInfo?.extra as McpAuthExtra | undefined;
      return createServer(extra?.manychatApiKey, {
        capabilityBundle: extra?.hostedSession?.capabilityBundle ?? "admin",
        cacheProfile,
      });
    },
    {
      onerror: (error) => log.error("mcp_handler_error", { error: error.message }),
    },
  );

  const nodeHandler = toNodeHandler(handler, {
    onerror: (error) => log.error("mcp_node_adapter_error", { error: error.message }),
  });

  app.all("/mcp", async (req, res) => {
    // GET and DELETE were the 2025 session operations. There is no session to
    // resume or terminate any more, so the handler answers them with 405 and we
    // do not demand a credential first.
    if (req.method !== "POST") {
      await nodeHandler(req, res);
      return;
    }

    try {
      const resolved = await resolveExecutionApiKey(req);
      if (!resolved.credential) {
        writeJsonRpcError(res, {
          statusCode: resolved.statusCode ?? 401,
          code: MCP_UNAUTHORIZED,
          id: requestIdFromBody(req.body),
          message: resolved.error!,
        });
        return;
      }

      const { credential } = resolved;

      if (credential.hostedSession && hostedControlPlaneClient) {
        try {
          await hostedControlPlaneClient.authorizeRequest({
            workspaceId: credential.hostedSession.workspaceId,
            tokenId: credential.hostedSession.tokenId,
            accountId: credential.hostedSession.accountId,
          });
        } catch (error) {
          writeJsonRpcError(res, {
            statusCode: error instanceof HostedControlPlaneError ? error.status : 401,
            code: MCP_REQUEST_NOT_AUTHORIZED,
            id: requestIdFromBody(req.body),
            message:
              error instanceof Error
                ? error.message
                : "Hosted request authorization failed.",
          });
          return;
        }
      }

      // `toNodeHandler` forwards `req.auth` to the factory as pass-through
      // `authInfo` and verifies nothing itself. This is how the credential
      // resolved above reaches `createServer` for this one request.
      const extra: McpAuthExtra = {
        manychatApiKey: credential.apiKey,
        credentialSource: credential.source,
        hostedSession: credential.hostedSession,
      };
      (req as express.Request & { auth?: unknown }).auth = {
        token: "",
        clientId: credential.hostedSession?.tokenId ?? credential.source,
        scopes: [],
        extra,
      };

      await nodeHandler(req, res, req.body);
    } catch (error) {
      log.error("mcp_http_request_failed", {
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : String(error),
      });
      if (!res.headersSent) {
        writeJsonRpcError(res, {
          statusCode: 500,
          code: JSON_RPC_INTERNAL_ERROR,
          id: requestIdFromBody(req.body),
          message: "Failed to process MCP HTTP request.",
        });
      }
    }
  });

  // A body that never parsed cannot carry a JSON-RPC id, so it answers the
  // standard parse error rather than Express's default HTML page.
  app.use(
    (
      error: Error & { status?: number; type?: string },
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (res.headersSent) {
        next(error);
        return;
      }
      const isBodyParserFailure =
        error.type === "entity.parse.failed" || error.type === "entity.too.large";
      writeJsonRpcError(res, {
        statusCode: isBodyParserFailure ? (error.status ?? 400) : 500,
        code: isBodyParserFailure ? JSON_RPC_PARSE_ERROR : JSON_RPC_INTERNAL_ERROR,
        id: null,
        message: isBodyParserFailure ? error.message : "Unhandled server error.",
      });
    },
  );

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(config.port, () => {
      log.info("ManyChat MCP server running", {
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

function resolveBaseUrl(env: NodeJS.ProcessEnv, port: number): string {
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

function requestIdFromBody(body: unknown): unknown {
  if (body && typeof body === "object" && "id" in body) {
    return (body as { id?: unknown }).id ?? null;
  }

  return null;
}

function writeJsonRpcError(
  res: express.Response,
  error: { statusCode: number; code: number; id: unknown; message: string },
): void {
  res.status(error.statusCode).json({
    jsonrpc: "2.0",
    error: {
      code: error.code,
      message: error.message,
    },
    id: error.id,
  });
}
