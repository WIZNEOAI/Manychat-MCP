import { McpServer } from "@modelcontextprotocol/server";
import { ManyChatClient } from "./auth/manychat-client.js";
import { registerSubscriberTools } from "./tools/subscribers.js";
import { registerTagTools } from "./tools/tags.js";
import { registerCustomFieldTools } from "./tools/custom-fields.js";
import { registerFlowTools } from "./tools/flows.js";
import { registerMessagingTools } from "./tools/messaging.js";
import { registerPageTools } from "./tools/page.js";
import { registerPolicyTools } from "./tools/policy.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts } from "./prompts/index.js";
import { MANYCHAT_PRODUCT } from "./product.js";
import { createToolAllowance } from "./hosted/capabilities.js";
import type { CapabilityBundle } from "./hosted/types.js";
import { resolveCacheHints, type McpCacheProfile } from "./mcp/cache-hints.js";

interface CreateServerOptions {
  capabilityBundle?: CapabilityBundle;
  /** Gateway request id, echoed by tools in `_meta.requestId`. */
  requestId?: string;
  /** Drives `cacheScope` on the 2026-07-28 cacheable results. Defaults to the safe multi-tenant profile. */
  cacheProfile?: McpCacheProfile;
}

/**
 * Natural-language guidance returned by `server/discover` (protocol revision
 * 2026-07-28) and by the 2025-era `initialize` result.
 */
const SERVER_INSTRUCTIONS = `ManyChat account automation over the ManyChat Account Public API.

Read before you write: list tags, custom fields and flows before referencing them, and
verify a subscriber exists before mutating it. Every mutation targets a single subscriber
except set_bot_field, which is page-wide.

Before sending anything, call validate_message. Outbound messages are bound by the
platform's 24-hour window, message tags and opt-in rules; send_content and send_text_message
expose an override_policy flag that bypasses that guard and can put the account at risk.

Rate limits differ per endpoint (see the manychat://meta/limits resource). The server
retries 429 and 5xx responses up to three times with exponential backoff.`;

export function createServer(apiKey?: string, options: CreateServerOptions = {}): McpServer {
  const client = new ManyChatClient(apiKey);
  const bundle = options.capabilityBundle ?? "admin";
  const isToolAllowed = createToolAllowance(bundle);
  const toolOptions = {
    isToolAllowed,
    requestId: options.requestId,
    // Only messaging_safe sends on a tenant's behalf under a delegated token,
    // so only there does a policy override need a human approval handle.
    requireApprovalForOverride: bundle === "messaging_safe",
  };

  const server = new McpServer(
    {
      name: MANYCHAT_PRODUCT.name,
      version: MANYCHAT_PRODUCT.version,
    },
    {
      instructions: SERVER_INSTRUCTIONS,
      cacheHints: resolveCacheHints(options.cacheProfile ?? "multi_tenant"),
    },
  );

  // Registration order is the order `tools/list` reports (the SDK preserves
  // insertion order), which is what keeps the listing deterministic per the
  // 2026-07-28 SHOULD. Never make it depend on request state.
  registerSubscriberTools(server, client, toolOptions);
  registerTagTools(server, client, toolOptions);
  registerCustomFieldTools(server, client, toolOptions);
  registerFlowTools(server, client, toolOptions);
  registerMessagingTools(server, client, toolOptions);
  registerPageTools(server, client, toolOptions);
  registerPolicyTools(server, toolOptions);
  registerResources(server, client);
  registerPrompts(server);

  return server;
}
