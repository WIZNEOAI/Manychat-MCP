import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ManyChatClient } from "./auth/manychat-client.js";
import { registerSubscriberTools } from "./tools/subscribers.js";
import { registerTagTools } from "./tools/tags.js";
import { registerCustomFieldTools } from "./tools/custom-fields.js";
import { registerFlowTools } from "./tools/flows.js";
import { registerMessagingTools } from "./tools/messaging.js";
import { registerPageTools } from "./tools/page.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts } from "./prompts/index.js";

export function createServer(apiKey?: string): McpServer {
  const client = new ManyChatClient(apiKey);

  const server = new McpServer({
    name: "manychat-mcp",
    version: "0.1.0",
  });

  registerSubscriberTools(server, client);
  registerTagTools(server, client);
  registerCustomFieldTools(server, client);
  registerFlowTools(server, client);
  registerMessagingTools(server, client);
  registerPageTools(server, client);
  registerResources(server, client);
  registerPrompts(server);

  return server;
}
