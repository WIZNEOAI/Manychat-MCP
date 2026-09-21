import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";

/** Built once at module load — see the note in src/tools/tags.ts. */
const SCHEMA = {
  onboard_subscriber: z.object({
    subscriber_id: z.string().describe("The subscriber ID to onboard"),
    context: z
      .string()
      .optional()
      .describe("Additional context about the lead (source, interests, etc.)"),
  }),
  send_campaign: z.object({
    campaign_description: z.string().describe("Description of the campaign and its goal"),
    target_tag: z.string().optional().describe("Tag name to target (if targeting by tag)"),
  }),
  analyze_subscriber: z.object({
    subscriber_id: z.string().describe("The subscriber ID to analyze"),
  }),
  segment_audience: z.object({
    goal: z.string().describe("What you want to achieve with this segmentation"),
  }),
  diagnose_automation: z.object({
    issue_description: z.string().describe("Description of the automation issue"),
    flow_ns: z.string().optional().describe("The flow namespace if known"),
  }),
};

export function registerPrompts(server: McpServer) {
  server.registerPrompt(
    "onboard_subscriber",
    {
      description:
        "Step-by-step onboarding for a new lead. Guides the agent through tagging, setting custom fields, and triggering the right flow.",
      argsSchema: SCHEMA.onboard_subscriber,
    },
    ({ subscriber_id, context }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are a ManyChat automation specialist. Onboard subscriber ${subscriber_id} step by step:

1. First, use get_subscriber to retrieve their current profile
2. Analyze their data: tags, custom fields, subscription date, channels
3. Based on their profile${context ? ` and this context: "${context}"` : ""}, recommend:
   - Which tags to add for segmentation
   - Which custom fields to populate
   - Which onboarding flow to trigger
4. Execute each action and confirm the result
5. Summarize what was done

Be methodical — fetch data before making changes.`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "send_campaign",
    {
      description: "Orchestrate sending a targeted campaign to a segment of subscribers",
      argsSchema: SCHEMA.send_campaign,
    },
    ({ campaign_description, target_tag }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are a ManyChat campaign manager. Plan and execute this campaign:

Campaign: "${campaign_description}"
${target_tag ? `Target: subscribers with tag "${target_tag}"` : "Target: to be determined based on campaign goals"}

Steps:
1. Review available tags (list_tags) and flows (list_flows) to understand options
2. Identify the right flow to use for this campaign, or recommend content to send
3. Verify the targeting criteria make sense for the campaign goal
4. Outline the execution plan before taking action
5. If approved, execute by sending the flow or content to targeted subscribers
6. Report results

Important: Always confirm before bulk-sending. Respect rate limits (20 RPS for flows, 25 RPS for content).`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "analyze_subscriber",
    {
      description: "Deep analysis of a subscriber's profile, behavior, and engagement",
      argsSchema: SCHEMA.analyze_subscriber,
    },
    ({ subscriber_id }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are a subscriber analytics expert. Provide a deep analysis of subscriber ${subscriber_id}:

1. Use get_subscriber to pull their full profile
2. Analyze:
   - **Identity**: name, contact info, opt-in status across channels
   - **Engagement**: last interaction, last seen, subscription date
   - **Segmentation**: current tags and what they indicate
   - **Custom data**: custom field values and what they reveal
3. Provide insights:
   - Engagement level (active/warm/cold/dormant)
   - Channel preferences (Messenger, IG, WhatsApp, Email, SMS)
   - Recommended next actions
   - Potential segmentation improvements
4. Format as a clear, actionable report`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "segment_audience",
    {
      description:
        "Create smart audience segments based on tags, custom fields, and behavior patterns",
      argsSchema: SCHEMA.segment_audience,
    },
    ({ goal }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are an audience segmentation strategist. Create smart segments for this goal:

Goal: "${goal}"

Steps:
1. Review all available tags (list_tags) and custom fields (list_custom_fields)
2. Analyze the current tag and field structure
3. Recommend segment definitions:
   - Which tag combinations define each segment
   - Which custom field values matter
   - How to name new tags if needed
4. For each recommended segment:
   - Define clear criteria
   - Suggest the tag(s) to create
   - Recommend automation flows to assign subscribers
5. Provide an implementation plan with ManyChat actions`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "diagnose_automation",
    {
      description: "Debug and diagnose issues with a ManyChat automation or flow",
      argsSchema: SCHEMA.diagnose_automation,
    },
    ({ issue_description, flow_ns }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are a ManyChat automation debugger. Diagnose this issue:

Issue: "${issue_description}"
${flow_ns ? `Flow: ${flow_ns}` : ""}

Steps:
1. List all flows to understand the automation landscape
2. Check page info for account configuration
3. Review available tags and custom fields that might be involved
4. Analyze the issue:
   - Is it a targeting problem? (wrong tags/segments)
   - Is it a timing problem? (24h window, rate limits)
   - Is it a configuration problem? (missing fields, wrong flow)
   - Is it a channel problem? (opt-in status, delivery)
5. Provide specific, actionable recommendations
6. If fixable via API, offer to make the corrections`,
          },
        },
      ],
    }),
  );
}
