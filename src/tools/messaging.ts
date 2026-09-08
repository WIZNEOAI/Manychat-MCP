import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import type { ManyChatClient } from "../auth/manychat-client.js";
import { isToolAllowed, type ToolRegistrationOptions } from "../hosted/capabilities.js";
import { validateOutboundMessage } from "../policy/messaging-window.js";
import { log } from "../lib/logger.js";

const overrideFields = {
  override_policy: z
    .boolean()
    .optional()
    .describe(
      "Bypass the policy block. Use only when certain it is compliant. Under a delegated (messaging_safe) token this also requires approval_ref.",
    ),
  approval_ref: z
    .string()
    .min(1)
    .max(200)
    .optional()
    .describe(
      "Reference to a recorded human approval for this override (ticket id, approval id). Required with override_policy under a delegated token.",
    ),
};

/** Built once at module load — see the note in src/tools/tags.ts. */
const SCHEMA = {
  send_content: z.object({
    subscriber_id: z.number().describe("The subscriber's numeric ID"),
    data: z
      .object({
        version: z.literal("v2").default("v2"),
        content: z.object({
          messages: z
            .array(z.record(z.string(), z.unknown()))
            .describe("Array of message objects in ManyChat Dynamic Content format"),
        }),
      })
      .describe("Dynamic Content payload"),
    message_tag: z
      .string()
      .optional()
      .describe(
        "Message tag for sending outside the 24h window (e.g. 'CONFIRMED_EVENT_UPDATE')",
      ),
    within_24h_window: z
      .boolean()
      .optional()
      .describe("True if the subscriber interacted within the last 24h"),
    promotional: z
      .boolean()
      .optional()
      .describe("True if this content is promotional/marketing"),
    ...overrideFields,
  }),
  send_text_message: z.object({
    subscriber_id: z.number().describe("The subscriber's numeric ID"),
    text: z.string().describe("The text message to send"),
    message_tag: z
      .string()
      .optional()
      .describe("Message tag for sending outside the 24h window"),
    within_24h_window: z
      .boolean()
      .optional()
      .describe("True if the subscriber interacted within the last 24h"),
    promotional: z
      .boolean()
      .optional()
      .describe("True if this content is promotional/marketing"),
    ...overrideFields,
  }),
};

/** Machine-readable outcome codes carried in `_meta.code` on refusals. */
export const SEND_GUARD_CODES = {
  blocked: "policy_blocked",
  approvalRequired: "approval_required",
} as const;

type SendMeta = {
  requestId?: string;
  policy: "allowed" | "warned" | "overridden";
  approvalRef?: string;
};

function guardSend(
  tool: string,
  opts: {
    subscriberId: number;
    within24hWindow?: boolean;
    messageTag?: string;
    promotional?: boolean;
    overridePolicy?: boolean;
    approvalRef?: string;
  },
  options: ToolRegistrationOptions,
) {
  const verdict = validateOutboundMessage({
    channel: "messenger",
    hoursSinceLastInteraction: opts.within24hWindow ? 1 : 25,
    messageTag: opts.messageTag,
    promotional: opts.promotional,
  });
  const meta = (extra: Partial<SendMeta>) =>
    ({ requestId: options.requestId, ...extra }) as Record<string, unknown>;

  if (verdict.level !== "block") {
    return {
      blocked: false as const,
      meta: meta({ policy: verdict.level === "warn" ? "warned" : "allowed" }),
    };
  }

  if (!opts.overridePolicy) {
    return {
      blocked: true as const,
      result: {
        isError: true as const,
        _meta: meta({ code: SEND_GUARD_CODES.blocked } as never),
        content: [
          {
            type: "text" as const,
            text: `BLOCKED by policy: ${JSON.stringify(verdict.findings)}. Pass override_policy=true only if you are certain this is compliant.`,
          },
        ],
      },
    };
  }

  if (options.requireApprovalForOverride && !opts.approvalRef) {
    return {
      blocked: true as const,
      result: {
        isError: true as const,
        _meta: meta({ code: SEND_GUARD_CODES.approvalRequired } as never),
        content: [
          {
            type: "text" as const,
            text: `APPROVAL_REQUIRED: override_policy under a delegated token needs approval_ref (a recorded human approval). Findings: ${JSON.stringify(verdict.findings)}.`,
          },
        ],
      },
    };
  }

  // The override is the one place an agent can put the account at risk on
  // purpose. It is never silent: one warn line, joinable by requestId.
  log.warn("policy_override", {
    tool,
    requestId: options.requestId,
    approvalRef: opts.approvalRef,
    subscriberId: opts.subscriberId,
    findings: verdict.findings.map((f) => f.code),
  });
  return {
    blocked: false as const,
    meta: meta({ policy: "overridden", approvalRef: opts.approvalRef }),
  };
}

export function registerMessagingTools(
  server: McpServer,
  client: ManyChatClient,
  options: ToolRegistrationOptions = {},
) {
  if (isToolAllowed("send_content", options)) {
    server.registerTool(
      "send_content",
      {
        description:
          "Send rich content (text, image, cards, etc.) to a subscriber using ManyChat's Dynamic Content format. Requires 24h interaction window or a message_tag.",
        inputSchema: SCHEMA.send_content,
      },
      async ({
        subscriber_id,
        data,
        message_tag,
        within_24h_window,
        promotional,
        override_policy,
        approval_ref,
      }) => {
        const guard = guardSend(
          "send_content",
          {
            subscriberId: subscriber_id,
            within24hWindow: within_24h_window,
            messageTag: message_tag,
            promotional,
            overridePolicy: override_policy,
            approvalRef: approval_ref,
          },
          options,
        );
        if (guard.blocked) return guard.result;
        const body: Record<string, unknown> = { subscriber_id, data };
        if (message_tag) body.message_tag = message_tag;
        await client.post("/sending/sendContent", body);
        return {
          _meta: guard.meta,
          content: [
            {
              type: "text",
              text: `Content sent to subscriber ${subscriber_id}.`,
            },
          ],
        };
      },
    );
  }

  if (isToolAllowed("send_text_message", options)) {
    server.registerTool(
      "send_text_message",
      {
        description:
          "Send a simple text message to a subscriber (convenience wrapper over sendContent)",
        inputSchema: SCHEMA.send_text_message,
      },
      async ({
        subscriber_id,
        text,
        message_tag,
        within_24h_window,
        promotional,
        override_policy,
        approval_ref,
      }) => {
        const guard = guardSend(
          "send_text_message",
          {
            subscriberId: subscriber_id,
            within24hWindow: within_24h_window,
            messageTag: message_tag,
            promotional,
            overridePolicy: override_policy,
            approvalRef: approval_ref,
          },
          options,
        );
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
          _meta: guard.meta,
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
}
