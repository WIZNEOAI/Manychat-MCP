import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { registerPolicyTools } from "../../src/tools/policy.js";

function getTool(server: McpServer, name: string): any {
  const reg = (server as unknown as { _registeredTools: Record<string, any> })._registeredTools;
  return reg[name];
}

describe("validate_message tool", () => {
  it("registers and blocks an outside-window no-tag send", async () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerPolicyTools(server);
    const tool = getTool(server, "validate_message");
    expect(tool).toBeDefined();
    const res = await tool.handler({ channel: "messenger", hours_since_last_interaction: 48 }, {});
    const payload = JSON.parse(res.content[0].text);
    expect(payload.allowed).toBe(false);
    expect(payload.findings.map((f: any) => f.code)).toContain("OUTSIDE_WINDOW_NO_TAG");
  });

  it("is omitted when the capability bundle disallows it", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerPolicyTools(server, { isToolAllowed: () => false });
    expect(getTool(server, "validate_message")).toBeUndefined();
  });
});
