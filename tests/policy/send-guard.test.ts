import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
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

describe("send guard: override needs an approval under a delegated token", () => {
  it("refuses override_policy without approval_ref when requireApprovalForOverride is set", async () => {
    const server = new McpServer({ name: "t", version: "0.0.0" });
    const client = fakeClient();
    registerMessagingTools(server, client, { requireApprovalForOverride: true, requestId: "req1" });
    const tool = getTool(server, "send_text_message");
    const res = await tool.handler(
      { subscriber_id: 1, text: "hi", within_24h_window: false, override_policy: true },
      {},
    );
    expect(client.post).not.toHaveBeenCalled();
    expect(res.isError).toBe(true);
    expect(res._meta.code).toBe("approval_required");
    expect(res._meta.requestId).toBe("req1");
    expect(res.content[0].text).toContain("APPROVAL_REQUIRED");
  });

  it("sends with override_policy + approval_ref and records both in _meta", async () => {
    const server = new McpServer({ name: "t", version: "0.0.0" });
    const client = fakeClient();
    registerMessagingTools(server, client, { requireApprovalForOverride: true, requestId: "req2" });
    const tool = getTool(server, "send_text_message");
    const res = await tool.handler(
      { subscriber_id: 1, text: "hi", within_24h_window: false, override_policy: true, approval_ref: "APR-42" },
      {},
    );
    expect(client.post).toHaveBeenCalledOnce();
    expect(res.isError).toBeUndefined();
    expect(res._meta).toMatchObject({ policy: "overridden", approvalRef: "APR-42", requestId: "req2" });
  });

  it("without the delegated flag (admin, single tenant) override still works and a plain send carries the request id", async () => {
    const server = new McpServer({ name: "t", version: "0.0.0" });
    const client = fakeClient();
    registerMessagingTools(server, client, { requestId: "req3" });
    const tool = getTool(server, "send_content");
    const ok = await tool.handler(
      { subscriber_id: 1, data: { version: "v2", content: { messages: [] } }, within_24h_window: true },
      {},
    );
    expect(ok._meta).toMatchObject({ policy: "allowed", requestId: "req3" });
    const blocked = await tool.handler(
      { subscriber_id: 1, data: { version: "v2", content: { messages: [] } }, within_24h_window: false },
      {},
    );
    expect(blocked._meta.code).toBe("policy_blocked");
  });
});
