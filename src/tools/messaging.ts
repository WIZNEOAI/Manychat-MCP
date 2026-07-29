import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import type { ManyChatClient } from "../auth/manychat-client.js";
import { isToolAllowed, type ToolRegistrationOptions } from "../hosted/capabilities.js";
import { validateOutboundMessage } from "../policy/messaging-window.js";

function guardSend(opts: {
  within24hWindow?: boolean;
  messageTag?: string;
  promotional?: boolean;
  overridePolicy?: boolean;
}) {
  const verdict = validateOutboundMessage({
    channel: "messenger",
    hoursSinceLastInteraction: opts.within24hWindow ? 1 : 25,
    messageTag: opts.messageTag,
    promotional: opts.promotional,
  });
  if (verdict.level === "block" && !opts.overridePolicy) {
    return {
      blocked: true as const,
      result: {
        isError: true as const,
        content: [
          {
            type: "text" as const,
            text: `BLOCKED by policy: ${JSON.stringify(verdict.findings)}. Pass override_policy=true only if you are certain this is compliant.`,
          },
        ],
      },
    };
  }
  return { blocked: false as const, verdict };
}

export function registerMessagingTools(
  server: McpServer,
  client: ManyChatClient,
  options: ToolRegistrationOptions = {},
) {
  if (isToolAllowed("send_content", options)) {
  server.registerTool("send_content", { description: "Send rich content (text, image, cards, etc.) to a subscriber using ManyChat's Dynamic Content format. Requires 24h interaction window or a message_tag.", inputSchema: z.object({
                subscriber_id: z.number().describe("The subscriber's numeric ID"),
                data: z
                  .object({
                    version: z.literal("v2").default("v2"),
                    content: z.object({
                      messages: z.array(
                        z.record(z.string(), z.unknown()),
                      ).describe("Array of message objects in ManyChat Dynamic Content format"),
                    }),
                  })
                  .describe("Dynamic Content payload"),
                message_tag: z
                  .string()
                  .optional()
                  .describe("Message tag for sending outside the 24h window (e.g. 'CONFIRMED_EVENT_UPDATE')"),
                within_24h_window: z.boolean().optional().describe("True if the subscriber interacted within the last 24h"),
                promotional: z.boolean().optional().describe("True if this content is promotional/marketing"),
                override_policy: z.boolean().optional().describe("Bypass the policy block. Use only when certain it is compliant."),
              }) }, async ({ subscriber_id, data, message_tag, within_24h_window, promotional, override_policy }) => {
                const guard = guardSend({ within24hWindow: within_24h_window, messageTag: message_tag, promotional, overridePolicy: override_policy });
                if (guard.blocked) return guard.result;
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
              });
  }

  if (isToolAllowed("send_text_message", options)) {
  server.registerTool("send_text_message", { description: "Send a simple text message to a subscriber (convenience wrapper over sendContent)", inputSchema: z.object({
                subscriber_id: z.number().describe("The subscriber's numeric ID"),
                text: z.string().describe("The text message to send"),
                message_tag: z
                  .string()
                  .optional()
                  .describe("Message tag for sending outside the 24h window"),
                within_24h_window: z.boolean().optional().describe("True if the subscriber interacted within the last 24h"),
                promotional: z.boolean().optional().describe("True if this content is promotional/marketing"),
                override_policy: z.boolean().optional().describe("Bypass the policy block. Use only when certain it is compliant."),
              }) }, async ({ subscriber_id, text, message_tag, within_24h_window, promotional, override_policy }) => {
                const guard = guardSend({ within24hWindow: within_24h_window, messageTag: message_tag, promotional, overridePolicy: override_policy });
                if (guard.blocked) return guard.result;
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
              });
  }
}
