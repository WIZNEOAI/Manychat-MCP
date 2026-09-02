import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";

/**
 * A server-wide MANYCHAT_API_KEY is the single-tenant convenience of
 * `manychat_header` mode. In the two multi-tenant modes it must not be a
 * credential at all: if it is, an unauthenticated caller executes against the
 * operator's own ManyChat account with no token, no quota and no audit trail.
 *
 * This is not hypothetical. On 2026-08-24 https://mcp.wizneo.org served
 * get_page_info for the live Gnosix page to an anonymous caller for exactly
 * this reason.
 */

const MOCK_PORT = 4399;
const BYPASS_PORT_HOSTED = 4301;
const BYPASS_PORT_OAUTH = 4302;

let mock: Server;
const children: ChildProcess[] = [];

async function startInstance(
  port: number,
  authMode: string,
  nodeEnv: string,
): Promise<void> {
  const child = spawn("npx", ["tsx", "src/mcp/http-entry.ts"], {
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: nodeEnv,
      MCP_REMOTE_AUTH: authMode,
      MANYCHAT_API_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
      MCP_BASE_URL: `http://localhost:${port}`,
      // The whole point: an operator key is present on the server.
      MANYCHAT_API_KEY: "operator-key-not-a-real-secret",
      HOSTED_CONTROL_PLANE_URL: "http://127.0.0.1:9/unused",
      HOSTED_CONTROL_PLANE_SECRET: "shared-secret-not-a-real-secret",
    },
    stdio: "ignore",
  });
  children.push(child);

  const deadline = Date.now() + 20_000;
  for (;;) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) throw new Error(`instance on :${port} never became healthy`);
    await new Promise((r) => setTimeout(r, 250));
  }
}

async function initializeAnonymously(port: number): Promise<{ status: number; body: string }> {
  const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    // No x-manychat-api-key, no Authorization: a stranger off the internet.
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "anonymous", version: "0" },
      },
    }),
  });

  return { status: res.status, body: await res.text() };
}

beforeAll(async () => {
  mock = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "success", data: { id: "1", name: "Mock Page" } }));
  });
  await new Promise<void>((resolve) => mock.listen(MOCK_PORT, resolve));

  await Promise.all([
    startInstance(BYPASS_PORT_HOSTED, "hosted_token", "production"),
    // OAuth refuses to boot in production without OAUTH_STORE=redis, which is
    // a separate guardrail and already covered. Credential precedence does not
    // branch on NODE_ENV, so the in-memory store exercises the same code path.
    startInstance(BYPASS_PORT_OAUTH, "oauth", "development"),
  ]);
}, 90_000);

afterAll(async () => {
  for (const child of children) child.kill("SIGTERM");
  await new Promise<void>((resolve) => mock.close(() => resolve()));
});

describe("a server-wide MANYCHAT_API_KEY never satisfies a token auth mode", () => {
  it("hosted_token rejects an anonymous caller even with an operator key present", async () => {
    const { status, body } = await initializeAnonymously(BYPASS_PORT_HOSTED);
    expect(status).toBe(401);
    expect(body).toContain("hosted MCP token");
  });

  it("oauth rejects an anonymous caller even with an operator key present", async () => {
    const { status, body } = await initializeAnonymously(BYPASS_PORT_OAUTH);
    expect(status).toBe(401);
    expect(body).toContain("Bearer");
  });
});
