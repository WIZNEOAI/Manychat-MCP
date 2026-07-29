import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import type { ManyChatClient } from "../auth/manychat-client.js";
import type { Tag } from "../types/manychat.js";
import { isToolAllowed, type ToolRegistrationOptions } from "../hosted/capabilities.js";

/**
 * Input schemas are built once at module load, not per registration. Under the
 * 2026-07-28 stateless model the whole server is rebuilt on every request, and
 * allocating these inline dominated that cost (see docs/mcp-2026-migration.md).
 */
const SCHEMA = {
  list_tags: z.object({}),
  create_tag: z.object({ name: z.string().describe("Name for the new tag") }),
  add_tag_to_subscriber: z.object({
    subscriber_id: z.number().describe("The subscriber's numeric ID"),
    tag_id: z.number().describe("The tag's numeric ID"),
  }),
  add_tag_to_subscriber_by_name: z.object({
    subscriber_id: z.number().describe("The subscriber's numeric ID"),
    tag_name: z.string().describe("The tag name"),
  }),
  remove_tag_from_subscriber: z.object({
    subscriber_id: z.number().describe("The subscriber's numeric ID"),
    tag_id: z.number().describe("The tag's numeric ID"),
  }),
  remove_tag_from_subscriber_by_name: z.object({
    subscriber_id: z.number().describe("The subscriber's numeric ID"),
    tag_name: z.string().describe("The tag name to remove"),
  }),
};

export function registerTagTools(
  server: McpServer,
  client: ManyChatClient,
  options: ToolRegistrationOptions = {},
) {
  if (isToolAllowed("list_tags", options)) {
    server.registerTool(
      "list_tags",
      {
        description: "List all tags available in the ManyChat account",
        inputSchema: SCHEMA.list_tags,
      },
      async () => {
        const data = await client.get<Tag[]>("/page/getTags");
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      },
    );
  }

  if (isToolAllowed("create_tag", options)) {
    server.registerTool(
      "create_tag",
      {
        description: "Create a new tag in the ManyChat account",
        inputSchema: SCHEMA.create_tag,
      },
      async ({ name }) => {
        const data = await client.post<{ tag: Tag }>("/page/createTag", { name });
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      },
    );
  }

  if (isToolAllowed("add_tag_to_subscriber", options)) {
    server.registerTool(
      "add_tag_to_subscriber",
      {
        description: "Add a tag to a subscriber by tag ID",
        inputSchema: SCHEMA.add_tag_to_subscriber,
      },
      async ({ subscriber_id, tag_id }) => {
        await client.post("/subscriber/addTag", { subscriber_id, tag_id });
        return {
          content: [
            { type: "text", text: `Tag ${tag_id} added to subscriber ${subscriber_id}.` },
          ],
        };
      },
    );
  }

  if (isToolAllowed("add_tag_to_subscriber_by_name", options)) {
    server.registerTool(
      "add_tag_to_subscriber_by_name",
      {
        description: "Add a tag to a subscriber by tag name (creates tag if it doesn't exist)",
        inputSchema: SCHEMA.add_tag_to_subscriber_by_name,
      },
      async ({ subscriber_id, tag_name }) => {
        await client.post("/subscriber/addTagByName", {
          subscriber_id,
          tag_name,
        });
        return {
          content: [
            {
              type: "text",
              text: `Tag "${tag_name}" added to subscriber ${subscriber_id}.`,
            },
          ],
        };
      },
    );
  }

  if (isToolAllowed("remove_tag_from_subscriber", options)) {
    server.registerTool(
      "remove_tag_from_subscriber",
      {
        description: "Remove a tag from a subscriber by tag ID",
        inputSchema: SCHEMA.remove_tag_from_subscriber,
      },
      async ({ subscriber_id, tag_id }) => {
        await client.post("/subscriber/removeTag", { subscriber_id, tag_id });
        return {
          content: [
            {
              type: "text",
              text: `Tag ${tag_id} removed from subscriber ${subscriber_id}.`,
            },
          ],
        };
      },
    );
  }

  if (isToolAllowed("remove_tag_from_subscriber_by_name", options)) {
    server.registerTool(
      "remove_tag_from_subscriber_by_name",
      {
        description: "Remove a tag from a subscriber by tag name",
        inputSchema: SCHEMA.remove_tag_from_subscriber_by_name,
      },
      async ({ subscriber_id, tag_name }) => {
        await client.post("/subscriber/removeTagByName", {
          subscriber_id,
          tag_name,
        });
        return {
          content: [
            {
              type: "text",
              text: `Tag "${tag_name}" removed from subscriber ${subscriber_id}.`,
            },
          ],
        };
      },
    );
  }
}
