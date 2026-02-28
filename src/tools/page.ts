import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ManyChatClient } from "../auth/manychat-client.js";
import type { Page, BotField, GrowthTool, OtnTopic } from "../types/manychat.js";

export function registerPageTools(server: McpServer, client: ManyChatClient) {
  server.tool(
    "get_page_info",
    "Get information about the connected ManyChat page/bot (name, category, timezone, etc.)",
    {},
    async () => {
      const data = await client.get<Page>("/page/getInfo");
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.tool(
    "list_bot_fields",
    "List all bot-level fields (system fields shared across subscribers)",
    {},
    async () => {
      const data = await client.get<BotField[]>("/page/getBotFields");
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.tool(
    "set_bot_field",
    "Set a bot-level field value by field ID",
    {
      field_id: z.number().describe("The bot field's numeric ID"),
      field_value: z
        .union([z.string(), z.number(), z.boolean(), z.null()])
        .describe("The value to set"),
    },
    async ({ field_id, field_value }) => {
      await client.post("/page/setBotField", { field_id, field_value });
      return {
        content: [
          {
            type: "text",
            text: `Bot field ${field_id} set to ${JSON.stringify(field_value)}.`,
          },
        ],
      };
    },
  );

  server.tool(
    "list_growth_tools",
    "List all growth tools (widgets) configured in the ManyChat account",
    {},
    async () => {
      const data = await client.get<GrowthTool[]>("/page/getGrowthTools");
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.tool(
    "list_otn_topics",
    "List all One-Time Notification topics available",
    {},
    async () => {
      const data = await client.get<OtnTopic[]>("/page/getOtnTopics");
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.tool(
    "health_check",
    "Verify the ManyChat API connection is working with the current API key",
    {},
    async () => {
      const ok = await client.healthCheck();
      return {
        content: [
          {
            type: "text",
            text: ok
              ? "ManyChat API connection is healthy."
              : "ManyChat API connection failed. Check your API key.",
          },
        ],
      };
    },
  );
}
