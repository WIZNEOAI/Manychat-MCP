import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import type { ManyChatClient } from "../auth/manychat-client.js";
import type { Flow, Folder } from "../types/manychat.js";
import { isToolAllowed, type ToolRegistrationOptions } from "../hosted/capabilities.js";

export function registerFlowTools(
  server: McpServer,
  client: ManyChatClient,
  options: ToolRegistrationOptions = {},
) {
  if (isToolAllowed("list_flows", options)) {
  server.registerTool("list_flows", { description: "List all automation flows in the ManyChat account (includes folder structure)", inputSchema: z.object({}) }, async () => {
                const data = await client.get<{ flows: Flow[]; folders: Folder[] }>(
                  "/page/getFlows",
                );
                return {
                  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
              });
  }

  if (isToolAllowed("send_flow", options)) {
  server.registerTool("send_flow", { description: "Send/trigger an automation flow to a specific subscriber", inputSchema: z.object({
                subscriber_id: z.number().describe("The subscriber's numeric ID"),
                flow_ns: z
                  .string()
                  .describe(
                    "The flow namespace identifier (found in the flow's URL in ManyChat)",
                  ),
              }) }, async ({ subscriber_id, flow_ns }) => {
                await client.post("/sending/sendFlow", { subscriber_id, flow_ns });
                return {
                  content: [
                    {
                      type: "text",
                      text: `Flow "${flow_ns}" sent to subscriber ${subscriber_id}.`,
                    },
                  ],
                };
              });
  }
}
