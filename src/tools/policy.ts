import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { isToolAllowed, type ToolRegistrationOptions } from "../hosted/capabilities.js";
import { validateOutboundMessage } from "../policy/messaging-window.js";

/** Built once at module load — see the note in src/tools/tags.ts. */
const SCHEMA = {
  validate_message: z.object({
    channel: z
      .enum(["messenger", "instagram", "whatsapp", "sms", "email", "telegram"])
      .describe("Channel the message will be sent on"),
    hours_since_last_interaction: z
      .number()
      .optional()
      .describe(
        "Hours since the subscriber last interacted. Omit if unknown (treated as outside window).",
      ),
    message_tag: z.string().optional().describe("Intended message tag, if any"),
    promotional: z
      .boolean()
      .optional()
      .describe("True if content is promotional/marketing"),
    has_opt_in: z
      .boolean()
      .optional()
      .describe("Whether the subscriber has a recorded opt-in"),
  }),
};

export function registerPolicyTools(
  server: McpServer,
  options: ToolRegistrationOptions = {},
) {
  if (!isToolAllowed("validate_message", options)) return;
  server.registerTool(
    "validate_message",
    {
      description:
        "Validate an outbound ManyChat message against Meta policy (24h window, message tags, HUMAN_AGENT, opt-in) BEFORE sending. Returns allowed=false when a send would violate policy.",
      inputSchema: SCHEMA.validate_message,
    },
    async ({
      channel,
      hours_since_last_interaction,
      message_tag,
      promotional,
      has_opt_in,
    }) => {
      const verdict = validateOutboundMessage({
        channel,
        hoursSinceLastInteraction: hours_since_last_interaction,
        messageTag: message_tag,
        promotional,
        hasOptIn: has_opt_in,
      });
      return { content: [{ type: "text", text: JSON.stringify(verdict, null, 2) }] };
    },
  );
}
