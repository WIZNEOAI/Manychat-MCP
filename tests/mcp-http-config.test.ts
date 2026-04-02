import { describe, expect, it } from "vitest";
import { resolveHttpRuntimeConfig } from "../src/mcp/serve.js";

describe("resolveHttpRuntimeConfig", () => {
  it("defaults to localhost header auth in local development", () => {
    const config = resolveHttpRuntimeConfig({});

    expect(config).toMatchObject({
      port: 3000,
      authMode: "manychat_header",
      baseUrl: "http://localhost:3000",
      nodeEnv: "development",
    });
  });

  it("allows production HTTP header auth without Redis", () => {
    const config = resolveHttpRuntimeConfig({
      NODE_ENV: "production",
      PORT: "8080",
      MCP_BASE_URL: "https://manychat.example.com",
    });

    expect(config).toMatchObject({
      port: 8080,
      authMode: "manychat_header",
      baseUrl: "https://manychat.example.com",
      nodeEnv: "production",
    });
  });

  it("requires Redis-backed OAuth state in production", () => {
    expect(() =>
      resolveHttpRuntimeConfig({
        NODE_ENV: "production",
        MCP_REMOTE_AUTH: "oauth",
        MCP_BASE_URL: "https://manychat.example.com",
      }),
    ).toThrow("OAUTH_STORE=redis");
  });

  it("accepts Railway public domains for production OAuth", () => {
    const config = resolveHttpRuntimeConfig({
      NODE_ENV: "production",
      MCP_REMOTE_AUTH: "oauth",
      OAUTH_STORE: "redis",
      REDIS_URL: "redis://localhost:6379",
      RAILWAY_PUBLIC_DOMAIN: "manychat-production.up.railway.app",
    });

    expect(config).toMatchObject({
      authMode: "oauth",
      baseUrl: "https://manychat-production.up.railway.app",
      nodeEnv: "production",
    });
  });

  it("requires hosted control plane env in production hosted_token mode", () => {
    expect(() =>
      resolveHttpRuntimeConfig({
        NODE_ENV: "production",
        MCP_REMOTE_AUTH: "hosted_token",
        MCP_BASE_URL: "https://manychat.example.com",
      }),
    ).toThrow("HOSTED_CONTROL_PLANE_URL");
  });

  it("accepts production hosted_token mode with control plane settings", () => {
    const config = resolveHttpRuntimeConfig({
      NODE_ENV: "production",
      MCP_REMOTE_AUTH: "hosted_token",
      MCP_BASE_URL: "https://manychat.example.com",
      HOSTED_CONTROL_PLANE_URL: "https://app.example.com",
      HOSTED_CONTROL_PLANE_SECRET: "shared-secret",
    });

    expect(config).toMatchObject({
      authMode: "hosted_token",
      baseUrl: "https://manychat.example.com",
      nodeEnv: "production",
    });
  });
});
