import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ManyChatClient } from "../auth/manychat-client.js";
import type { Tag } from "../types/manychat.js";

export function registerTagTools(server: McpServer, client: ManyChatClient) {
  server.tool(
    "list_tags",
    "List all tags available in the ManyChat account",
    {},
    async () => {
      const data = await client.get<Tag[]>("/page/getTags");
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.tool(
    "create_tag",
    "Create a new tag in the ManyChat account",
    { name: z.string().describe("Name for the new tag") },
    async ({ name }) => {
      const data = await client.post<{ tag: Tag }>("/page/createTag", { name });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.tool(
    "add_tag_to_subscriber",
    "Add a tag to a subscriber by tag ID",
    {
      subscriber_id: z.number().describe("The subscriber's numeric ID"),
      tag_id: z.number().describe("The tag's numeric ID"),
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

  server.tool(
    "add_tag_to_subscriber_by_name",
    "Add a tag to a subscriber by tag name (creates tag if it doesn't exist)",
    {
      subscriber_id: z.number().describe("The subscriber's numeric ID"),
      tag_name: z.string().describe("The tag name"),
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

  server.tool(
    "remove_tag_from_subscriber",
    "Remove a tag from a subscriber by tag ID",
    {
      subscriber_id: z.number().describe("The subscriber's numeric ID"),
      tag_id: z.number().describe("The tag's numeric ID"),
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

  server.tool(
    "remove_tag_from_subscriber_by_name",
    "Remove a tag from a subscriber by tag name",
    {
      subscriber_id: z.number().describe("The subscriber's numeric ID"),
      tag_name: z.string().describe("The tag name to remove"),
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
