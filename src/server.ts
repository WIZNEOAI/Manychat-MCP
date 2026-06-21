import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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

interface CreateServerOptions {
  capabilityBundle?: CapabilityBundle;
}

export function createServer(apiKey?: string, options: CreateServerOptions = {}): McpServer {
  const client = new ManyChatClient(apiKey);
  const isToolAllowed = createToolAllowance(options.capabilityBundle ?? "admin");

  const server = new McpServer({
    name: MANYCHAT_PRODUCT.name,
    version: MANYCHAT_PRODUCT.version,
  });

  registerSubscriberTools(server, client, { isToolAllowed });
  registerTagTools(server, client, { isToolAllowed });
  registerCustomFieldTools(server, client, { isToolAllowed });
  registerFlowTools(server, client, { isToolAllowed });
  registerMessagingTools(server, client, { isToolAllowed });
  registerPageTools(server, client, { isToolAllowed });
  registerPolicyTools(server, { isToolAllowed });
  registerResources(server, client);
  registerPrompts(server);

  return server;
}
