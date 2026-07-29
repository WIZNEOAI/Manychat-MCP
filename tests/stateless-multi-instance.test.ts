import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";

/**
 * Statelessness under horizontal scale.
 *
 * The MCP 2026-07-28 revision removes protocol-level sessions: any request may
 * land on any instance. This suite runs three independent server processes
 * behind a round-robin dispatcher and drives a normal MCP flow across them.
 *
 * Measured on 2026-07-28 against the current code: 2 of 5 steps pass, and the
 * two that do pass only because the round-robin cursor happens to return to the
 * instance that served `initialize`. Root cause is the in-process `sessions`
 * map in src/mcp/serve.ts.
 *
 * The multi-instance cases below are marked `it.fails` on purpose: they assert
 * the behaviour we do NOT have yet, so the suite stays green today and turns red
 * the moment the migration makes them pass. When that happens, flip them to
 * `it` — do not delete them.
 */

const PORTS = [4101, 4102, 4103];
const MOCK_PORT = 4199;

let children: ChildProcess[] = [];
let mock: Server;
let cursor = 0;

/** Next instance, round-robin. No sticky routing, by design. */
function nextTarget(): string {
  const port = PORTS[cursor % PORTS.length];
  cursor += 1;
  return `http://127.0.0.1:${port}`;
}

async function waitForHealth(port: number, timeoutMs = 20_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`instance on :${port} never became healthy`);
}

type RpcResult = { ok: boolean; status: number; body: unknown; servedBy: string };

async function rpc(
  body: unknown,
  sessionId?: string,
  target = nextTarget(),
): Promise<RpcResult> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "x-manychat-api-key": "test-key-not-a-real-secret",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;

  const res = await fetch(`${target}/mcp`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown = text;
  // Streamable HTTP may answer with an SSE stream; pull the data frame out.
  if (text.includes("\ndata: ")) {
    const line = text.split("\n").find((l) => l.startsWith("data: "));
    if (line) {
      try {
        parsed = JSON.parse(line.slice(6));
      } catch {
        /* keep raw */
      }
    }
  } else {
    try {
      parsed = JSON.parse(text);
    } catch {
      /* keep raw */
    }
  }

  const isError =
    res.status >= 400 ||
    (parsed !== null && typeof parsed === "object" && "error" in (parsed as object));

  return { ok: !isError, status: res.status, body: parsed, servedBy: target, };
}

async function initialize(target?: string): Promise<{ sessionId?: string; ok: boolean }> {
  const chosen = target ?? nextTarget();
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "x-manychat-api-key": "test-key-not-a-real-secret",
  };
  const res = await fetch(`${chosen}/mcp`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "stateless-probe", version: "1.0.0" },
      },
    }),
  });
  await res.text();
  return { sessionId: res.headers.get("mcp-session-id") ?? undefined, ok: res.ok };
}

beforeAll(async () => {
  // Local stand-in for the ManyChat API. No request leaves the machine and the
  // real account is never touched.
  mock = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "success", data: { id: "1", name: "Mock Page" } }));
  });
  await new Promise<void>((resolve) => mock.listen(MOCK_PORT, resolve));

  children = PORTS.map((port) =>
    spawn("npx", ["tsx", "src/mcp/http-entry.ts"], {
      env: {
        ...process.env,
        PORT: String(port),
        NODE_ENV: "production",
        MCP_REMOTE_AUTH: "manychat_header",
        MANYCHAT_API_KEY: "test-key-not-a-real-secret",
        MANYCHAT_API_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
        MCP_BASE_URL: `http://localhost:${port}`,
      },
      stdio: "ignore",
    }),
  );

  await Promise.all(PORTS.map((p) => waitForHealth(p)));
}, 60_000);

afterAll(async () => {
  for (const child of children) child.kill("SIGTERM");
  await new Promise<void>((resolve) => mock.close(() => resolve()));
});

describe("statelessness across instances", () => {
  it("every instance answers /health independently", async () => {
    for (const port of PORTS) {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      expect(res.ok).toBe(true);
      await expect(res.json()).resolves.toMatchObject({ status: "ok" });
    }
  });

  it("a single instance serves the whole flow (control)", async () => {
    const target = `http://127.0.0.1:${PORTS[0]}`;
    const { sessionId } = await initialize(target);
    expect(sessionId).toBeTruthy();

    const list = await rpc(
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
      sessionId,
      target,
    );
    expect(list.ok).toBe(true);

    const call = await rpc(
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_page_info", arguments: {} } },
      sessionId,
      target,
    );
    expect(call.ok).toBe(true);
  });

  // Currently fails: the session lives in one process only.
  it.fails("tools/list succeeds on an instance that did not run initialize", async () => {
    const { sessionId } = await initialize(`http://127.0.0.1:${PORTS[0]}`);
    const other = `http://127.0.0.1:${PORTS[1]}`;

    const list = await rpc(
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
      sessionId,
      other,
    );
    expect(list.ok).toBe(true);
  });

  // Currently fails: only the requests that land back on the initialize
  // instance succeed, so the flow scores 2/5 rather than 5/5.
  it.fails("the full flow survives round-robin with no sticky routing", async () => {
    cursor = 0;
    const { sessionId } = await initialize();

    const steps = [
      { jsonrpc: "2.0", method: "notifications/initialized" },
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_page_info", arguments: {} } },
      { jsonrpc: "2.0", id: 4, method: "tools/list", params: {} },
    ];

    const results = [];
    for (const step of steps) results.push(await rpc(step, sessionId));

    expect(results.filter((r) => r.ok)).toHaveLength(steps.length);
  });

  // Currently fails: `server/discover` is MUST in 2026-07-28 and is not implemented.
  it.fails("server/discover answers without a prior handshake", async () => {
    const res = await rpc({
      jsonrpc: "2.0",
      id: 1,
      method: "server/discover",
      params: {
        _meta: {
          "io.modelcontextprotocol/protocolVersion": "2026-07-28",
          "io.modelcontextprotocol/clientCapabilities": {},
        },
      },
    });
    expect(res.ok).toBe(true);
  });

  // Currently fails: a modern client never sends `initialize`.
  it.fails("a 2026-07-28 client reaches tools/list with no session", async () => {
    const res = await rpc({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {
        _meta: {
          "io.modelcontextprotocol/protocolVersion": "2026-07-28",
          "io.modelcontextprotocol/clientCapabilities": {},
        },
      },
    });
    expect(res.ok).toBe(true);
  });

  // Currently fails: the 2025-era session endpoints still answer 400.
  it.fails("GET and DELETE on /mcp answer 405", async () => {
    const base = `http://127.0.0.1:${PORTS[0]}`;
    const get = await fetch(`${base}/mcp`);
    const del = await fetch(`${base}/mcp`, { method: "DELETE" });
    expect(get.status).toBe(405);
    expect(del.status).toBe(405);
  });
});
