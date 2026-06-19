import { ConvexHttpClient } from "convex/browser";

export function getServerConvexClient(authToken?: string): ConvexHttpClient {
  const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!deploymentUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is required for server routes.");
  }

  return new ConvexHttpClient(deploymentUrl, authToken ? { auth: authToken } : undefined);
}
