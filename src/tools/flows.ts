import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ManyChatClient } from "../auth/manychat-client.js";
import type { Flow, Folder } from "../types/manychat.js";

export function registerFlowTools(server: McpServer, client: ManyChatClient) {
  server.tool(
    "list_flows",
    "List all automation flows in the ManyChat account (includes folder structure)",
    {},
    async () => {
      const data = await client.get<{ flows: Flow[]; folders: Folder[] }>(
        "/page/getFlows",
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.tool(
    "send_flow",
    "Send/trigger an automation flow to a specific subscriber",
    {
      subscriber_id: z.number().describe("The subscriber's numeric ID"),
      flow_ns: z
        .string()
        .describe(
          "The flow namespace identifier (found in the flow's URL in ManyChat)",
        ),
    },
    async ({ subscriber_id, flow_ns }) => {
      await client.post("/sending/sendFlow", { subscriber_id, flow_ns });
      return {
        content: [
          {
            type: "text",
            text: `Flow "${flow_ns}" sent to subscriber ${subscriber_id}.`,
          },
        ],
      };
    },
  );
}
