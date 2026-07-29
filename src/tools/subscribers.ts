import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import type { ManyChatClient } from "../auth/manychat-client.js";
import type { Subscriber } from "../types/manychat.js";
import { isToolAllowed, type ToolRegistrationOptions } from "../hosted/capabilities.js";

export function registerSubscriberTools(
  server: McpServer,
  client: ManyChatClient,
  options: ToolRegistrationOptions = {},
) {
  if (isToolAllowed("get_subscriber", options)) {
  server.registerTool("get_subscriber", { description: "Get detailed information about a subscriber by their ID", inputSchema: z.object({ subscriber_id: z.number().describe("The subscriber's numeric ID") }) }, async ({ subscriber_id }) => {
                const data = await client.get<Subscriber>("/subscriber/getInfo", {
                  subscriber_id: String(subscriber_id),
                });
                return {
                  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
              });
  }

  if (isToolAllowed("find_subscriber_by_email", options)) {
  server.registerTool("find_subscriber_by_email", { description: "Find a subscriber by their email address", inputSchema: z.object({ email: z.string().email().describe("Email address to search for") }) }, async ({ email }) => {
                const data = await client.get<Subscriber>("/subscriber/findBySystemField", {
                  email,
                });
                return {
                  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
              });
  }

  if (isToolAllowed("find_subscriber_by_phone", options)) {
  server.registerTool("find_subscriber_by_phone", { description: "Find a subscriber by their phone number", inputSchema: z.object({ phone: z.string().describe("Phone number to search for") }) }, async ({ phone }) => {
                const data = await client.get<Subscriber>("/subscriber/findBySystemField", {
                  phone,
                });
                return {
                  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
              });
  }

  if (isToolAllowed("find_subscriber_by_name", options)) {
  server.registerTool("find_subscriber_by_name", { description: "Find subscribers by name (returns up to 100 matches)", inputSchema: z.object({ name: z.string().describe("Name to search for") }) }, async ({ name }) => {
                const data = await client.get<Subscriber[]>("/subscriber/findByName", {
                  name,
                });
                return {
                  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
              });
  }

  if (isToolAllowed("create_subscriber", options)) {
  server.registerTool("create_subscriber", { description: "Create a new subscriber. Must provide at least one of: phone, whatsapp_phone, or email.", inputSchema: z.object({
                first_name: z.string().optional().describe("First name"),
                last_name: z.string().optional().describe("Last name"),
                phone: z.string().optional().describe("Phone number"),
                whatsapp_phone: z.string().optional().describe("WhatsApp phone number"),
                email: z.string().email().optional().describe("Email address"),
                gender: z.string().optional().describe("Gender"),
                has_opt_in_sms: z.boolean().optional().describe("SMS opt-in consent"),
                has_opt_in_email: z.boolean().optional().describe("Email opt-in consent"),
                consent_phrase: z.string().optional().describe("Consent phrase shown to user"),
              }) }, async (args) => {
                const body: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(args)) {
                  if (v !== undefined) body[k] = v;
                }
                const data = await client.post<Subscriber>("/subscriber/createSubscriber", body);
                return {
                  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
                };
              });
  }

  if (isToolAllowed("update_subscriber", options)) {
  server.registerTool("update_subscriber", { description: "Update an existing subscriber's information", inputSchema: z.object({
                subscriber_id: z.number().describe("The subscriber's numeric ID"),
                first_name: z.string().optional().describe("First name"),
                last_name: z.string().optional().describe("Last name"),
                phone: z.string().optional().describe("Phone number"),
                email: z.string().email().optional().describe("Email address"),
                gender: z.string().optional().describe("Gender"),
                has_opt_in_sms: z.boolean().optional().describe("SMS opt-in"),
                has_opt_in_email: z.boolean().optional().describe("Email opt-in"),
                consent_phrase: z.string().optional().describe("Consent phrase"),
              }) }, async (args) => {
                const body: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(args)) {
                  if (v !== undefined) body[k] = v;
                }
                await client.post("/subscriber/updateSubscriber", body);
                return {
                  content: [{ type: "text", text: `Subscriber ${args.subscriber_id} updated successfully.` }],
                };
              });
  }
}
