import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { randomUUID } from "node:crypto";
import { createServer } from "../server.js";
import { log } from "../lib/logger.js";
import { createOAuthRouter } from "../auth/oauth-routes.js";
import { resolveApiKeyFromToken } from "../auth/oauth.js";

export async function startLegacyMcpServer(args: string[] = []) {
  const transportFlag = getFlagValue(args, "--transport");
  const transport = transportFlag ?? process.env.MCP_TRANSPORT ?? "stdio";
  const port = Number(getFlagValue(args, "--port") ?? process.env.PORT) || 3000;

  if (transport === "http") {
    await startHttp(port);
    return;
  }

  await startStdio();
}

async function startStdio() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("ManyChat MCP compatibility server running on stdio");
}

async function startHttp(port: number) {
  const app = express();
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
    res.json({ status: "ok", server: "manychat-mcp", version: "0.1.0" });
  });

  const baseUrl = process.env.BASE_URL ?? `http://localhost:${port}`;
  app.use(express.urlencoded({ extended: true }));
  app.use(createOAuthRouter(baseUrl));

  const sessions: Record<string, StreamableHTTPServerTransport> = {};

  async function resolveApiKey(req: express.Request): Promise<string | undefined> {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const key = await resolveApiKeyFromToken(token);
      if (key) return key;
    }

    const headerKey = req.headers["x-manychat-api-key"] as string | undefined;
    if (headerKey) return headerKey;

    return undefined;
  }

  app.post("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && sessions[sessionId]) {
      transport = sessions[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      const apiKey = await resolveApiKey(req);

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

      const server = createServer(apiKey);
      await server.connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "No valid session. Send an initialize request first." },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  });

  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !sessions[sessionId]) {
      res.status(400).json({ error: "Invalid or missing session" });
      return;
    }
    await sessions[sessionId].handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !sessions[sessionId]) {
      res.status(400).json({ error: "Invalid or missing session" });
      return;
    }
    await sessions[sessionId].handleRequest(req, res);
  });

  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      log.info("ManyChat MCP compatibility server running", {
        url: `http://0.0.0.0:${port}`,
        mcpEndpoint: "POST /mcp",
        healthCheck: "GET /health",
      });
      resolve();
    });
  });
}

function getFlagValue(args: string[], flagName: string): string | undefined {
  const index = args.indexOf(flagName);
  if (index === -1) return undefined;
  return args[index + 1];
}
