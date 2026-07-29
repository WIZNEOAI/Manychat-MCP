import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import type { ManyChatClient } from "../auth/manychat-client.js";
import type { Page, BotField, GrowthTool, OtnTopic } from "../types/manychat.js";
import { isToolAllowed, type ToolRegistrationOptions } from "../hosted/capabilities.js";

export function registerPageTools(
  server: McpServer,
  client: ManyChatClient,
  options: ToolRegistrationOptions = {},
) {
  if (isToolAllowed("get_page_info", options)) {
  server.registerTool("get_page_info", { description: "Get information about the connected ManyChat page/bot (name, category, timezone, etc.)", inputSchema: z.object({}) }, async () => {
                const data = await client.get<Page>("/page/getInfo");
                return {
                  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
              });
  }

  if (isToolAllowed("list_bot_fields", options)) {
  server.registerTool("list_bot_fields", { description: "List all bot-level fields (system fields shared across subscribers)", inputSchema: z.object({}) }, async () => {
                const data = await client.get<BotField[]>("/page/getBotFields");
                return {
                  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
              });
  }

  if (isToolAllowed("set_bot_field", options)) {
  server.registerTool("set_bot_field", { description: "Set a bot-level field value by field ID", inputSchema: z.object({
                field_id: z.number().describe("The bot field's numeric ID"),
                field_value: z
                  .union([z.string(), z.number(), z.boolean(), z.null()])
                  .describe("The value to set"),
              }) }, async ({ field_id, field_value }) => {
                await client.post("/page/setBotField", { field_id, field_value });
                return {
                  content: [
                    {
                      type: "text",
                      text: `Bot field ${field_id} set to ${JSON.stringify(field_value)}.`,
                    },
                  ],
                };
              });
  }

  if (isToolAllowed("list_growth_tools", options)) {
  server.registerTool("list_growth_tools", { description: "List all growth tools (widgets) configured in the ManyChat account", inputSchema: z.object({}) }, async () => {
                const data = await client.get<GrowthTool[]>("/page/getGrowthTools");
                return {
                  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
              });
  }

  if (isToolAllowed("list_otn_topics", options)) {
  server.registerTool("list_otn_topics", { description: "List all One-Time Notification topics available", inputSchema: z.object({}) }, async () => {
                const data = await client.get<OtnTopic[]>("/page/getOtnTopics");
                return {
                  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
              });
  }

  if (isToolAllowed("health_check", options)) {
  server.registerTool("health_check", { description: "Verify the ManyChat API connection is working with the current API key", inputSchema: z.object({}) }, async () => {
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
              });
  }
}
