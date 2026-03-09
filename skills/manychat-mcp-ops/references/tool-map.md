# Tool map

Use this map when selecting tools for operational workflows.

## Read tools

- `get_page_info`
- `list_tags`
- `list_custom_fields`
- `list_bot_fields`
- `list_growth_tools`
- `list_otn_topics`
- `list_flows`
- `get_subscriber`
- `find_subscriber_by_email`
- `find_subscriber_by_phone`
- `find_subscriber_by_name`
- `health_check`

## Mutating tools

- `create_subscriber`
- `update_subscriber`
- `create_tag`
- `add_tag_to_subscriber`
- `add_tag_to_subscriber_by_name`
- `remove_tag_from_subscriber`
- `remove_tag_from_subscriber_by_name`
- `create_custom_field`
- `set_custom_field`
- `set_custom_field_by_name`
- `set_custom_fields_bulk`
- `set_bot_field`
- `send_flow`
- `send_content`
- `send_text_message`

## Operational guardrails

- Always fetch target data before mutation.
- For bulk operations, run a canary batch first.
- Use idempotent tags/fields naming conventions to reduce duplicate writes.
- For campaigns, verify segment criteria before any send.
