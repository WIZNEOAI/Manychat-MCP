import type { CapabilityBundle } from "./types.js";

export interface ToolRegistrationOptions {
  isToolAllowed?: (toolName: string) => boolean;
}

const TOOL_MATRIX: Record<CapabilityBundle, Set<string>> = {
  read_only: new Set([
    "health_check",
    "get_page_info",
    "list_bot_fields",
    "list_growth_tools",
    "list_otn_topics",
    "list_tags",
    "list_custom_fields",
    "list_flows",
    "get_subscriber",
    "find_subscriber_by_email",
    "find_subscriber_by_phone",
    "find_subscriber_by_name",
  ]),
  operator: new Set([
    "health_check",
    "get_page_info",
    "list_bot_fields",
    "list_growth_tools",
    "list_otn_topics",
    "list_tags",
    "create_tag",
    "add_tag_to_subscriber",
    "add_tag_to_subscriber_by_name",
    "remove_tag_from_subscriber",
    "remove_tag_from_subscriber_by_name",
    "list_custom_fields",
    "set_custom_field",
    "set_custom_field_by_name",
    "set_custom_fields_bulk",
    "list_flows",
    "get_subscriber",
    "find_subscriber_by_email",
    "find_subscriber_by_phone",
    "find_subscriber_by_name",
    "create_subscriber",
    "update_subscriber",
  ]),
  messaging_safe: new Set([
    "health_check",
    "get_page_info",
    "list_bot_fields",
    "list_growth_tools",
    "list_otn_topics",
    "list_tags",
    "create_tag",
    "add_tag_to_subscriber",
    "add_tag_to_subscriber_by_name",
    "remove_tag_from_subscriber",
    "remove_tag_from_subscriber_by_name",
    "list_custom_fields",
    "set_custom_field",
    "set_custom_field_by_name",
    "set_custom_fields_bulk",
    "list_flows",
    "send_flow",
    "send_content",
    "send_text_message",
    "get_subscriber",
    "find_subscriber_by_email",
    "find_subscriber_by_phone",
    "find_subscriber_by_name",
    "create_subscriber",
    "update_subscriber",
  ]),
  admin: new Set([
    "health_check",
    "get_page_info",
    "list_bot_fields",
    "set_bot_field",
    "list_growth_tools",
    "list_otn_topics",
    "list_tags",
    "create_tag",
    "add_tag_to_subscriber",
    "add_tag_to_subscriber_by_name",
    "remove_tag_from_subscriber",
    "remove_tag_from_subscriber_by_name",
    "list_custom_fields",
    "create_custom_field",
    "set_custom_field",
    "set_custom_field_by_name",
    "set_custom_fields_bulk",
    "list_flows",
    "send_flow",
    "send_content",
    "send_text_message",
    "get_subscriber",
    "find_subscriber_by_email",
    "find_subscriber_by_phone",
    "find_subscriber_by_name",
    "create_subscriber",
    "update_subscriber",
  ]),
};

export function createToolAllowance(bundle: CapabilityBundle): (toolName: string) => boolean {
  const allowed = TOOL_MATRIX[bundle];
  return (toolName: string) => allowed.has(toolName);
}

export function isToolAllowed(
  toolName: string,
  options: ToolRegistrationOptions = {},
): boolean {
  return options.isToolAllowed ? options.isToolAllowed(toolName) : true;
}
