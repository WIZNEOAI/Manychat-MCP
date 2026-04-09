import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const resend = new Resend(components.resend, {
  testMode: false,
});

const FROM_EMAIL = "ManyChat MCP <noreply@wizneo.org>";

export const sendWelcomeEmail = internalMutation({
  args: {
    to: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { to, name }) => {
    await resend.sendEmail(ctx, {
      from: FROM_EMAIL,
      to,
      subject: "Welcome to ManyChat MCP",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; font-weight: 600; color: #111;">Welcome to ManyChat MCP${name ? `, ${name}` : ""}</h1>
          <p style="font-size: 16px; color: #444; line-height: 1.6;">
            Your workspace is ready. Connect your ManyChat account and start using the MCP server with any AI agent.
          </p>
          <div style="margin: 32px 0;">
            <a href="https://manychat.wizneo.org/dashboard" style="background: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
              Open Dashboard
            </a>
          </div>
          <p style="font-size: 14px; color: #888; line-height: 1.5;">
            Need help? Check our <a href="https://manychat.wizneo.org/docs" style="color: #111;">docs</a>.
          </p>
        </div>
      `,
    });
  },
});
