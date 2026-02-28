import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ManyChatClient } from "../auth/manychat-client.js";
import type { CustomField } from "../types/manychat.js";

export function registerCustomFieldTools(
  server: McpServer,
  client: ManyChatClient,
) {
  server.tool(
    "list_custom_fields",
    "List all custom fields defined in the ManyChat account",
    {},
    async () => {
      const data = await client.get<CustomField[]>("/page/getCustomFields");
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.tool(
    "create_custom_field",
    "Create a new custom field in the ManyChat account",
    {
      caption: z.string().describe("Display name of the field"),
      type: z
        .enum(["text", "number", "date", "datetime", "boolean"])
        .describe("Field data type"),
      description: z.string().optional().describe("Field description"),
    },
    async ({ caption, type, description }) => {
      const body: Record<string, unknown> = { caption, type };
      if (description) body.description = description;
      const data = await client.post<{ field: CustomField }>(
        "/page/createCustomField",
        body,
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.tool(
    "set_custom_field",
    "Set a custom field value for a subscriber by field ID",
    {
      subscriber_id: z.number().describe("The subscriber's numeric ID"),
      field_id: z.number().describe("The custom field's numeric ID"),
      field_value: z
        .union([z.string(), z.number(), z.boolean(), z.null()])
        .describe("The value to set (type must match field type)"),
    },
    async ({ subscriber_id, field_id, field_value }) => {
      await client.post("/subscriber/setCustomField", {
        subscriber_id,
        field_id,
        field_value,
      });
      return {
        content: [
          {
            type: "text",
            text: `Custom field ${field_id} set to ${JSON.stringify(field_value)} for subscriber ${subscriber_id}.`,
          },
        ],
      };
    },
  );

  server.tool(
    "set_custom_field_by_name",
    "Set a custom field value for a subscriber by field name",
    {
      subscriber_id: z.number().describe("The subscriber's numeric ID"),
      field_name: z.string().describe("The custom field's name"),
      field_value: z
        .union([z.string(), z.number(), z.boolean(), z.null()])
        .describe("The value to set"),
    },
    async ({ subscriber_id, field_name, field_value }) => {
      await client.post("/subscriber/setCustomFieldByName", {
        subscriber_id,
        field_name,
        field_value,
      });
      return {
        content: [
          {
            type: "text",
            text: `Custom field "${field_name}" set to ${JSON.stringify(field_value)} for subscriber ${subscriber_id}.`,
          },
        ],
      };
    },
  );

  server.tool(
    "set_custom_fields_bulk",
    "Set multiple custom field values for a subscriber at once (max 20 fields)",
    {
      subscriber_id: z.number().describe("The subscriber's numeric ID"),
      fields: z
        .array(
          z.object({
            field_id: z.number().optional().describe("Field ID"),
            field_name: z.string().optional().describe("Field name (alternative to field_id)"),
            field_value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
          }),
        )
        .max(20)
        .describe("Array of field ID/name + value pairs (max 20)"),
    },
    async ({ subscriber_id, fields }) => {
      await client.post("/subscriber/setCustomFields", {
        subscriber_id,
        fields,
      });
      return {
        content: [
          {
            type: "text",
            text: `${fields.length} custom field(s) updated for subscriber ${subscriber_id}.`,
          },
        ],
      };
    },
  );
}
