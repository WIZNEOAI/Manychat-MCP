import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";
import { resolveCacheHints } from "../src/mcp/cache-hints.js";

/**
 * Conformance with protocol revision 2026-07-28 on the wire.
 *
 * One instance, no balancer: these assert what a single response must contain,
 * not how requests spread across processes (that is
 * tests/stateless-multi-instance.test.ts).
 */

const PORT = 4201;
const MOCK_PORT = 4299;
const PROTOCOL_VERSION = "2026-07-28";

let child: ChildProcess;
let mock: Server;

const NAMED_METHODS = new Set(["tools/call", "resources/read", "prompts/get"]);

type JsonRpcResponse = {
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
};

async function modern(
  method: string,
  params: Record<string, unknown> = {},
  init: { apiKey?: string | null } = {},
): Promise<{ status: number; body: JsonRpcResponse }> {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method,
    params: {
      ...params,
      _meta: {
        "io.modelcontextprotocol/protocolVersion": PROTOCOL_VERSION,
        "io.modelcontextprotocol/clientCapabilities": {},
      },
    },
  };

  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "Mcp-Method": method,
    "MCP-Protocol-Version": PROTOCOL_VERSION,
  };
  if (init.apiKey !== null) headers["x-manychat-api-key"] = init.apiKey ?? "test-key";
  if (NAMED_METHODS.has(method)) {
    const name = (params.name ?? params.uri) as string | undefined;
    if (name) headers["Mcp-Name"] = name;
  }

  const res = await fetch(`http://127.0.0.1:${PORT}/mcp`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();
  const frame = text.includes("\ndata: ")
    ? (text.split("\n").find((l) => l.startsWith("data: "))?.slice(6) ?? text)
    : text;

  return { status: res.status, body: JSON.parse(frame) as JsonRpcResponse };
}

beforeAll(async () => {
  mock = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "success", data: { id: "1", name: "Mock Page" } }));
  });
  await new Promise<void>((resolve) => mock.listen(MOCK_PORT, resolve));

  child = spawn("npx", ["tsx", "src/mcp/http-entry.ts"], {
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: "production",
      MCP_REMOTE_AUTH: "manychat_header",
      MANYCHAT_API_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
      MCP_BASE_URL: `http://localhost:${PORT}`,
      // Deliberately no MANYCHAT_API_KEY: the credential must come per request,
      // which is what lets the missing-credential case be exercised.
      MANYCHAT_API_KEY: "",
    },
    stdio: "ignore",
  });

  const deadline = Date.now() + 20_000;
  for (;;) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/health`);
      if (res.ok) break;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) throw new Error(`instance on :${PORT} never became healthy`);
    await new Promise((r) => setTimeout(r, 250));
  }
}, 60_000);

afterAll(async () => {
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => mock.close(() => resolve()));
});

describe("cacheable results (SEP-2549)", () => {
  const listMethods = [
    "tools/list",
    "prompts/list",
    "resources/list",
    "resources/templates/list",
    "server/discover",
  ];

  it.each(listMethods)("%s carries ttlMs and cacheScope", async (method) => {
    const { body } = await modern(method);
    expect(body.error).toBeUndefined();
    expect(typeof body.result?.ttlMs).toBe("number");
    expect(body.result?.ttlMs as number).toBeGreaterThanOrEqual(0);
    expect(["public", "private"]).toContain(body.result?.cacheScope);
  });

  it("resources/read carries ttlMs and cacheScope, and is always private", async () => {
    const { body } = await modern("resources/read", { uri: "manychat://meta/limits" });
    expect(body.error).toBeUndefined();
    expect(typeof body.result?.ttlMs).toBe("number");
    expect(body.result?.cacheScope).toBe("private");
  });

  it("every cacheable method is private under the multi-tenant profile", () => {
    // The visible tool surface varies with capabilityBundle, so a shared cache
    // keyed on anything but the authorization context would leak across tenants.
    const hints = resolveCacheHints("multi_tenant");
    expect(Object.keys(hints)).toHaveLength(6);
    for (const hint of Object.values(hints)) {
      expect(hint?.cacheScope).toBe("private");
    }
  });
});

describe("result shape (SEP-2322, SEP-2575)", () => {
  it("results carry resultType", async () => {
    const { body } = await modern("tools/list");
    expect(body.result?.resultType).toBe("complete");
  });

  it("serverInfo travels in the result _meta, not in the DiscoverResult body", async () => {
    const { body } = await modern("server/discover");
    const meta = body.result?._meta as Record<string, unknown> | undefined;
    expect(meta?.["io.modelcontextprotocol/serverInfo"]).toMatchObject({
      name: "manychat-mcp",
    });
    expect(body.result).not.toHaveProperty("serverInfo");
  });

  it("server/discover advertises its supported versions and capabilities", async () => {
    const { body } = await modern("server/discover");
    expect(body.result?.supportedVersions).toContain(PROTOCOL_VERSION);
    expect(body.result?.capabilities).toMatchObject({ tools: {}, resources: {}, prompts: {} });
    expect(typeof body.result?.instructions).toBe("string");
  });

  it("tools/list returns a deterministic order", async () => {
    const names = async () => {
      const { body } = await modern("tools/list");
      return (body.result?.tools as { name: string }[]).map((t) => t.name);
    };
    const first = await names();
    expect(first.length).toBeGreaterThan(0);
    expect(await names()).toEqual(first);
  });
});

describe("error codes", () => {
  /** MCP 2026-07-28 marks -32000..-32019 legacy; new servers must not emit them. */
  const inLegacySubRange = (code: number) => code <= -32000 && code >= -32019;

  it("a missing credential is not answered with a legacy -32000", async () => {
    const { status, body } = await modern("tools/list", {}, { apiKey: null });
    expect(status).toBe(401);
    expect(body.error).toBeDefined();
    expect(inLegacySubRange(body.error!.code)).toBe(false);
    // Gateway-specific codes live outside JSON-RPC's reserved -32768..-32000 band.
    expect(body.error!.code).toBeGreaterThan(-32000);
  });

  it("a header that disagrees with the body is answered -32020", async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "x-manychat-api-key": "test-key",
        "Mcp-Method": "prompts/list",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {
          _meta: {
            "io.modelcontextprotocol/protocolVersion": PROTOCOL_VERSION,
            "io.modelcontextprotocol/clientCapabilities": {},
          },
        },
      }),
    });
    const body = (await res.json()) as JsonRpcResponse;
    expect(body.error?.code).toBe(-32020);
  });

  it("an unsupported protocol version is answered -32022", async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "x-manychat-api-key": "test-key",
        "Mcp-Method": "tools/list",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {
          _meta: {
            "io.modelcontextprotocol/protocolVersion": "1900-01-01",
            "io.modelcontextprotocol/clientCapabilities": {},
          },
        },
      }),
    });
    const body = (await res.json()) as JsonRpcResponse;
    expect(body.error?.code).toBe(-32022);
  });

  it("a malformed body is answered with the JSON-RPC parse error", async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "x-manychat-api-key": "test-key",
      },
      body: "{ not json",
    });
    const body = (await res.json()) as JsonRpcResponse;
    expect(res.status).toBe(400);
    expect(body.error?.code).toBe(-32700);
  });
});
