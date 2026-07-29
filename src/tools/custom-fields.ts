import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import type { ManyChatClient } from "../auth/manychat-client.js";
import type { CustomField } from "../types/manychat.js";
import { isToolAllowed, type ToolRegistrationOptions } from "../hosted/capabilities.js";

/** Built once at module load — see the note in src/tools/tags.ts. */
const SCHEMA = {
  list_custom_fields: z.object({}),
  create_custom_field: z.object({
    caption: z.string().describe("Display name of the field"),
    type: z
      .enum(["text", "number", "date", "datetime", "boolean"])
      .describe("Field data type"),
    description: z.string().optional().describe("Field description"),
  }),
  set_custom_field: z.object({
    subscriber_id: z.number().describe("The subscriber's numeric ID"),
    field_id: z.number().describe("The custom field's numeric ID"),
    field_value: z
      .union([z.string(), z.number(), z.boolean(), z.null()])
      .describe("The value to set (type must match field type)"),
  }),
  set_custom_field_by_name: z.object({
    subscriber_id: z.number().describe("The subscriber's numeric ID"),
    field_name: z.string().describe("The custom field's name"),
    field_value: z
      .union([z.string(), z.number(), z.boolean(), z.null()])
      .describe("The value to set"),
  }),
  set_custom_fields_bulk: z.object({
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
  }),
};

export function registerCustomFieldTools(
  server: McpServer,
  client: ManyChatClient,
  options: ToolRegistrationOptions = {},
) {
  if (isToolAllowed("list_custom_fields", options)) {
    server.registerTool(
      "list_custom_fields",
      {
        description: "List all custom fields defined in the ManyChat account",
        inputSchema: SCHEMA.list_custom_fields,
      },
      async () => {
        const data = await client.get<CustomField[]>("/page/getCustomFields");
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      },
    );
  }

  if (isToolAllowed("create_custom_field", options)) {
    server.registerTool(
      "create_custom_field",
      {
        description: "Create a new custom field in the ManyChat account",
        inputSchema: SCHEMA.create_custom_field,
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
  }

  if (isToolAllowed("set_custom_field", options)) {
    server.registerTool(
      "set_custom_field",
      {
        description: "Set a custom field value for a subscriber by field ID",
        inputSchema: SCHEMA.set_custom_field,
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
  }

  if (isToolAllowed("set_custom_field_by_name", options)) {
    server.registerTool(
      "set_custom_field_by_name",
      {
        description: "Set a custom field value for a subscriber by field name",
        inputSchema: SCHEMA.set_custom_field_by_name,
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
  }

  if (isToolAllowed("set_custom_fields_bulk", options)) {
    server.registerTool(
      "set_custom_fields_bulk",
      {
        description:
          "Set multiple custom field values for a subscriber at once (max 20 fields)",
        inputSchema: SCHEMA.set_custom_fields_bulk,
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
}
