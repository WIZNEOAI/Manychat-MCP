#!/usr/bin/env node

const baseUrl = process.env.MCP_BASE_URL;
const manychatApiKey = process.env.MANYCHAT_API_KEY;

if (!baseUrl) {
  console.error("MCP_BASE_URL is required");
  process.exit(1);
}

function joinUrl(path) {
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

async function checkJson(path, label) {
  const res = await fetch(joinUrl(path));
  if (!res.ok) {
    throw new Error(`${label} failed with status ${res.status}`);
  }
  const body = await res.json();
  console.log(`[ok] ${label}`, body);
}

async function checkMcpInitializeWithApiKey() {
  if (!manychatApiKey) {
    console.log("[skip] /mcp initialize probe (MANYCHAT_API_KEY not set)");
    return;
  }

  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "manychat-mcp-ops-smoke", version: "1.0.0" },
    },
  };

  const res = await fetch(joinUrl("/mcp"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-ManyChat-API-Key": manychatApiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`/mcp initialize failed with status ${res.status}`);
  }

  const body = await res.json();
  console.log("[ok] /mcp initialize", body);
}

async function main() {
  await checkJson("/health", "health");
  await checkJson("/.well-known/oauth-protected-resource", "oauth protected resource");
  await checkJson("/.well-known/oauth-authorization-server", "oauth authorization server");
  await checkMcpInitializeWithApiKey();
}

main().catch((err) => {
  console.error("[fail]", err.message);
  process.exit(1);
});
