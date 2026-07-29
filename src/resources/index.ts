import type { McpServer } from "@modelcontextprotocol/server";
import type { ManyChatClient } from "../auth/manychat-client.js";
import type {
  Page,
  Tag,
  CustomField,
  BotField,
  Flow,
  Folder,
  OtnTopic,
} from "../types/manychat.js";

export function registerResources(server: McpServer, client: ManyChatClient) {
  server.registerResource(
    "page-info",
    "manychat://page/info",
    { description: "ManyChat page/bot information", mimeType: "application/json" },
    async (uri) => {
      const data = await client.get<Page>("/page/getInfo");
      return {
        contents: [{ uri: uri.href, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerResource(
    "tag-catalog",
    "manychat://tags/all",
    { description: "All tags in the ManyChat account", mimeType: "application/json" },
    async (uri) => {
      const data = await client.get<Tag[]>("/page/getTags");
      return {
        contents: [{ uri: uri.href, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerResource(
    "custom-fields-catalog",
    "manychat://fields/custom",
    {
      description: "All custom fields in the ManyChat account",
      mimeType: "application/json",
    },
    async (uri) => {
      const data = await client.get<CustomField[]>("/page/getCustomFields");
      return {
        contents: [{ uri: uri.href, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerResource(
    "bot-fields",
    "manychat://fields/bot",
    { description: "Bot-level system fields", mimeType: "application/json" },
    async (uri) => {
      const data = await client.get<BotField[]>("/page/getBotFields");
      return {
        contents: [{ uri: uri.href, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerResource(
    "flow-catalog",
    "manychat://flows/all",
    {
      description: "All automation flows and folder structure",
      mimeType: "application/json",
    },
    async (uri) => {
      const data = await client.get<{ flows: Flow[]; folders: Folder[] }>(
        "/page/getFlows",
      );
      return {
        contents: [{ uri: uri.href, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerResource(
    "otn-topics",
    "manychat://otn/topics",
    {
      description: "One-Time Notification topics available",
      mimeType: "application/json",
    },
    async (uri) => {
      const data = await client.get<OtnTopic[]>("/page/getOtnTopics");
      return {
        contents: [{ uri: uri.href, text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.registerResource(
    "subscriber-schema",
    "manychat://schema/subscriber",
    {
      description: "Documentation of the ManyChat subscriber data schema",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: SUBSCRIBER_SCHEMA_DOCS,
        },
      ],
    }),
  );

  server.registerResource(
    "api-limits",
    "manychat://meta/limits",
    { description: "ManyChat API rate limits reference", mimeType: "text/markdown" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: RATE_LIMITS_DOCS }],
    }),
  );
}

const SUBSCRIBER_SCHEMA_DOCS = `# ManyChat Subscriber Schema

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique subscriber ID |
| page_id | string | Associated page ID |
| first_name | string | First name |
| last_name | string | Last name |
| name | string | Full name |
| gender | string | Gender |
| profile_pic | string | Profile picture URL |
| locale | string | Locale code |
| language | string | Language |
| timezone | string | Timezone |
| live_chat_url | string | Direct chat URL in ManyChat |
| last_input_text | string | Last message from subscriber |
| optin_phone | boolean | Phone opt-in status |
| phone | string | Phone number |
| optin_email | boolean | Email opt-in status |
| email | string | Email address |
| subscribed | string | Subscription date |
| last_interaction | string/null | Last interaction timestamp |
| last_seen | string | Last seen timestamp |
| is_followup_enabled | boolean | Follow-up enabled |
| ig_username | string | Instagram username |
| whatsapp_phone | string | WhatsApp phone |
| optin_whatsapp | boolean | WhatsApp opt-in |
| custom_fields | array | Custom field values |
| tags | array | Applied tags |
`;

const RATE_LIMITS_DOCS = `# ManyChat API Rate Limits

All limits are per bot account (not per key).

Source: ManyChat Dev API docs and Help Center.
Verified: 2026-03-09.

| Category | Limit |
|----------|-------|
| Page reads (getInfo, getTags, getCustomFields, getBotFields, getGrowthTools, getOtnTopics) | 100 RPS |
| Page flows (getFlows) | 10 RPS |
| Page writes (createTag, removeTag, createCustomField, setBotField) | 10 RPS |
| Sending content (sendContent) | 25 RPS |
| Sending flows (sendFlow) | 20 RPS + 100/subscriber/hour |
| Subscriber reads (getInfo, findByName, findByCustomField) | 10 RPS |
| Subscriber system find (findBySystemField) | 50 RPS |
| Subscriber writes (addTag, removeTag, setCustomField, create, update) | 10 RPS |

Exceeding limits returns HTTP 429. Repeated violations may suspend processing for 24 hours.
`;
