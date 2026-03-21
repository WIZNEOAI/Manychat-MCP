import type { AuthConfig } from "convex/server";

/**
 * Clerk JWT template named "convex" + issuer domain.
 * Set `CLERK_JWT_ISSUER_DOMAIN` in the Convex dashboard (e.g. `https://your-app.clerk.accounts.dev`).
 * Leave unset locally only until Clerk is wired; providers must be non-empty for production auth.
 * @see https://docs.convex.dev/auth/clerk
 */
const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;

export default {
  providers:
    domain !== undefined && domain.length > 0
      ? [{ domain, applicationID: "convex" as const }]
      : [],
} satisfies AuthConfig;
