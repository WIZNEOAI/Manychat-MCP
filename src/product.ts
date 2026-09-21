export const MANYCHAT_PRODUCT = {
  name: "manychat-mcp",
  version: "0.1.0",
} as const;

/**
 * Canonical URLs, in one place so the CLI, the MCP server and the docs cannot
 * disagree about where to send someone.
 *
 * Each is overridable by environment variable: someone running their own
 * control plane should be able to point onboarding at it without patching
 * source.
 */
export const MANYCHAT_LINKS = {
  /** Where a ManyChat API key is generated. ManyChat's page, not ours. */
  manychatApiKeyDocs:
    "https://help.manychat.com/hc/en-us/articles/14959510331420-How-to-generate-a-token-for-the-Manychat-API-and-where-to-get-parameters",

  /** Public paste-to-agent landing. No sign-up. */
  hostedBaseUrl: process.env.MANYCHAT_HOSTED_URL ?? "https://mc-mcp.wizneo.org",

  /**
   * Placeholder for a self-hosted (or private) remote MCP origin.
   * There is no public WIZNEO BYOK URL. Override only if you run a gateway.
   */
  hostedMcpUrl: process.env.MANYCHAT_HOSTED_MCP_URL ?? "https://mcp.example.com/mcp",

  repo: "https://github.com/WIZNEOAI/Manychat-MCP",
} as const;
