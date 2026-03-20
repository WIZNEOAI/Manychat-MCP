# MCP Migration Map

This table maps existing MCP tools to CLI commands.

## Read operations

| MCP tool/resource | CLI command |
|---|---|
| `health_check` | `manychat doctor` |
| `get_page_info` / `manychat://page/info` | `manychat page info` |
| `list_tags` / `manychat://tags/all` | `manychat tags list` |
| `list_custom_fields` / `manychat://fields/custom` | `manychat fields list` |
| `list_bot_fields` / `manychat://fields/bot` | `manychat page bot-fields list` |
| `list_growth_tools` | `manychat page growth-tools list` |
| `list_otn_topics` / `manychat://otn/topics` | `manychat page otn-topics list` |
| `list_flows` / `manychat://flows/all` | `manychat flows list` |
| `get_subscriber` | `manychat subscribers get --subscriber-id <id>` |
| `find_subscriber_by_email` | `manychat subscribers find --email <email>` |
| `find_subscriber_by_phone` | `manychat subscribers find --phone <phone>` |
| `find_subscriber_by_name` | `manychat subscribers find --name <name>` |

## Mutating operations

| MCP tool | CLI command |
|---|---|
| `create_tag` | `manychat tags create --name <name>` |
| `create_custom_field` | `manychat fields create --caption <name> --type <type>` |
| `set_bot_field` | `manychat page bot-fields set --field-id <id> --value-json <json>` |
| `create_subscriber` | `manychat subscribers create ...` |
| `update_subscriber` | `manychat subscribers update --subscriber-id <id> ...` |
| `add_tag_to_subscriber` | `manychat subscribers tags add --subscriber-id <id> --tag-id <id>` |
| `add_tag_to_subscriber_by_name` | `manychat subscribers tags add --subscriber-id <id> --tag-name <name>` |
| `remove_tag_from_subscriber` | `manychat subscribers tags remove --subscriber-id <id> --tag-id <id>` |
| `remove_tag_from_subscriber_by_name` | `manychat subscribers tags remove --subscriber-id <id> --tag-name <name>` |
| `set_custom_field` | `manychat fields set --subscriber-id <id> --field-id <id> --value-json <json>` |
| `set_custom_field_by_name` | `manychat fields set --subscriber-id <id> --field-name <name> --value-json <json>` |
| `set_custom_fields_bulk` | `manychat fields set-bulk --subscriber-id <id> --fields-json <json>` |
| `send_flow` | `manychat flows send --subscriber-id <id> --flow-ns <ns>` |
| `send_content` | `manychat send content --subscriber-id <id> --data-json <json>` |
| `send_text_message` | `manychat send text --subscriber-id <id> --text <text>` |

## Compatibility gap policy

If a future MCP tool has no CLI equivalent:
- document the gap here
- prefer adding the CLI command before adding more MCP-only behavior
- keep the core ManyChat client as the shared execution layer
