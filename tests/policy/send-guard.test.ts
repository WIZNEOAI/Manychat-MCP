import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMessagingTools } from "../../src/tools/messaging.js";

function getTool(server: McpServer, name: string): any {
  const reg = (server as unknown as { _registeredTools: Record<string, any> })._registeredTools;
  return reg[name];
}

function fakeClient() {
  return { post: vi.fn().mockResolvedValue({}) } as any;
}

describe("send guard", () => {
  it("blocks send_text_message outside window with no tag and does not call the API", async () => {
    const server = new McpServer({ name: "t", version: "0.0.0" });
    const client = fakeClient();
    registerMessagingTools(server, client);
    const tool = getTool(server, "send_text_message");
    const res = await tool.handler({ subscriber_id: 1, text: "hi", within_24h_window: false }, {});
    expect(client.post).not.toHaveBeenCalled();
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("OUTSIDE_WINDOW_NO_TAG");
  });

  it("sends when within the window", async () => {
    const server = new McpServer({ name: "t", version: "0.0.0" });
    const client = fakeClient();
    registerMessagingTools(server, client);
    const tool = getTool(server, "send_text_message");
    const res = await tool.handler({ subscriber_id: 1, text: "hi", within_24h_window: true }, {});
    expect(client.post).toHaveBeenCalledOnce();
    expect(res.isError).toBeUndefined();
  });

  it("sends a blocked message anyway when override_policy is true", async () => {
    const server = new McpServer({ name: "t", version: "0.0.0" });
    const client = fakeClient();
    registerMessagingTools(server, client);
    const tool = getTool(server, "send_text_message");
    await tool.handler({ subscriber_id: 1, text: "hi", within_24h_window: false, override_policy: true }, {});
    expect(client.post).toHaveBeenCalledOnce();
  });
});
