export interface Page {
  id: number;
  name: string;
  category: string;
  avatar_link: string;
  username: string;
  about: string;
  description: string;
  is_pro: boolean;
  timezone: string;
}

export interface Subscriber {
  id: string;
  page_id: string;
  first_name: string;
  last_name: string;
  name: string;
  gender: string;
  profile_pic: string;
  locale: string;
  language: string;
  timezone: string;
  live_chat_url: string;
  last_input_text: string;
  optin_phone: boolean;
  phone: string;
  optin_email: boolean;
  email: string;
  subscribed: string;
  last_interaction: string | null;
  last_seen: string;
  is_followup_enabled: boolean;
  ig_username: string;
  ig_id: number;
  whatsapp_phone: string;
  optin_whatsapp: boolean;
  custom_fields: SubscriberCustomField[];
  tags: Tag[];
}

export interface SubscriberCustomField {
  id: number;
  name: string;
  value: unknown;
}

export interface Tag {
  id: number;
  name: string;
}

export interface CustomField {
  id: number;
  name: string;
  type: "text" | "number" | "date" | "datetime" | "boolean";
  description: string;
}

export interface BotField {
  id: number;
  name: string;
  type: string;
  description: string;
  value: unknown;
}

export interface Flow {
  ns: string;
  name: string;
  folder_id: number;
}

export interface Folder {
  id: number;
  name: string;
  parent_id: number;
}

export interface GrowthTool {
  id: number;
  name: string;
  type: string;
}

export interface OtnTopic {
  id: number;
  name: string;
  description: string;
}
