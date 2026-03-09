# ManyChat API to MCP Tool Matrix

Last verified: 2026-03-09

Sources:
- https://help.manychat.com/hc/en-us/articles/14281157129116-Dev-API-Overview
- https://help.manychat.com/hc/en-us/articles/14959510331420-How-to-generate-a-token-for-the-Manychat-API-and-where-to-get-parameters

## Subscribers

| MCP tool | ManyChat endpoint | Method | Notes |
|---|---|---|---|
| `get_subscriber` | `/subscriber/getInfo` | GET | Fetch by `subscriber_id` |
| `find_subscriber_by_email` | `/subscriber/findBySystemField` | GET | Uses `email` |
| `find_subscriber_by_phone` | `/subscriber/findBySystemField` | GET | Uses `phone` |
| `find_subscriber_by_name` | `/subscriber/findByName` | GET | Max 100 records |
| `create_subscriber` | `/subscriber/createSubscriber` | POST | At least one contact channel required |
| `update_subscriber` | `/subscriber/updateSubscriber` | POST | Partial updates allowed |
| `add_tag_to_subscriber` | `/subscriber/addTag` | POST | Tag by ID |
| `add_tag_to_subscriber_by_name` | `/subscriber/addTagByName` | POST | Creates tag when missing |
| `remove_tag_from_subscriber` | `/subscriber/removeTag` | POST | Tag by ID |
| `remove_tag_from_subscriber_by_name` | `/subscriber/removeTagByName` | POST | Tag by name |
| `set_custom_field` | `/subscriber/setCustomField` | POST | Field by ID |
| `set_custom_field_by_name` | `/subscriber/setCustomFieldByName` | POST | Field by name |
| `set_custom_fields_bulk` | `/subscriber/setCustomFields` | POST | Max 20 fields per request |

## Page and account

| MCP tool/resource | ManyChat endpoint | Method |
|---|---|---|
| `get_page_info` / `manychat://page/info` | `/page/getInfo` | GET |
| `list_tags` / `manychat://tags/all` | `/page/getTags` | GET |
| `create_tag` | `/page/createTag` | POST |
| `list_custom_fields` / `manychat://fields/custom` | `/page/getCustomFields` | GET |
| `create_custom_field` | `/page/createCustomField` | POST |
| `list_bot_fields` / `manychat://fields/bot` | `/page/getBotFields` | GET |
| `set_bot_field` | `/page/setBotField` | POST |
| `list_growth_tools` | `/page/getGrowthTools` | GET |
| `list_otn_topics` / `manychat://otn/topics` | `/page/getOtnTopics` | GET |
| `list_flows` / `manychat://flows/all` | `/page/getFlows` | GET |
| `send_flow` | `/sending/sendFlow` | POST |
| `send_content` | `/sending/sendContent` | POST |
| `send_text_message` | `/sending/sendContent` | POST |
| `health_check` | `/page/getInfo` | GET |

## Auth and transport contract

This project uses two separate auth layers:

1. ManyChat auth:
   - ManyChat API Key (BYO key per user/account)
2. MCP auth:
   - OAuth 2.0 Authorization Code + PKCE for multi-user client access

HTTP clients can authenticate to `/mcp` with:
- `Authorization: Bearer <mcp_access_token>` (OAuth mode)
- `X-ManyChat-API-Key: <manychat_api_key>` (direct BYO mode)
