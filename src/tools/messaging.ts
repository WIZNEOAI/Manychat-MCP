import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ManyChatClient } from "../auth/manychat-client.js";

export function registerMessagingTools(
  server: McpServer,
  client: ManyChatClient,
) {
  server.tool(
    "send_content",
    "Send rich content (text, image, cards, etc.) to a subscriber using ManyChat's Dynamic Content format. Requires 24h interaction window or a message_tag.",
    {
      subscriber_id: z.number().describe("The subscriber's numeric ID"),
      data: z
        .object({
          version: z.literal("v2").default("v2"),
          content: z.object({
            messages: z.array(
              z.record(z.unknown()),
            ).describe("Array of message objects in ManyChat Dynamic Content format"),
          }),
        })
        .describe("Dynamic Content payload"),
      message_tag: z
        .string()
        .optional()
        .describe("Message tag for sending outside the 24h window (e.g. 'CONFIRMED_EVENT_UPDATE')"),
    },
    async ({ subscriber_id, data, message_tag }) => {
      const body: Record<string, unknown> = { subscriber_id, data };
      if (message_tag) body.message_tag = message_tag;
      await client.post("/sending/sendContent", body);
      return {
        content: [
          {
            type: "text",
            text: `Content sent to subscriber ${subscriber_id}.`,
          },
        ],
      };
    },
  );

  server.tool(
    "send_text_message",
    "Send a simple text message to a subscriber (convenience wrapper over sendContent)",
    {
      subscriber_id: z.number().describe("The subscriber's numeric ID"),
      text: z.string().describe("The text message to send"),
      message_tag: z
        .string()
        .optional()
        .describe("Message tag for sending outside the 24h window"),
    },
    async ({ subscriber_id, text, message_tag }) => {
      const data = {
        version: "v2",
        content: {
          messages: [{ type: "text", text }],
        },
      };
      const body: Record<string, unknown> = { subscriber_id, data };
      if (message_tag) body.message_tag = message_tag;
      await client.post("/sending/sendContent", body);
      return {
        content: [
          {
            type: "text",
            text: `Text message sent to subscriber ${subscriber_id}.`,
          },
        ],
      };
    },
  );
}
