import { ConvexHttpClient } from "convex/browser";
import { requireInternalControlPlaneSecret } from "./auth";

export function getServerConvexClient(authToken?: string): ConvexHttpClient {
  const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!deploymentUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is required for server routes.");
  }

  return new ConvexHttpClient(deploymentUrl, authToken ? { auth: authToken } : undefined);
}

/**
 * Convex HTTP actions are served from the `.convex.site` host, while queries/mutations
 * use `.convex.cloud`. Derive the `.site` base from the public deployment URL.
 */
export function getConvexSiteUrl(): string {
  const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!deploymentUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is required for server routes.");
  }
  const url = new URL(deploymentUrl);
  if (url.hostname.endsWith(".convex.site")) {
    // Already a site host — leave as-is.
  } else if (url.hostname.endsWith(".convex.cloud")) {
    url.hostname = url.hostname.replace(/\.convex\.cloud$/, ".convex.site");
  } else {
    // Fail closed: never send the control-plane secret header to an unrecognized host.
    throw new Error(
      `Cannot derive a Convex .site host from NEXT_PUBLIC_CONVEX_URL ("${url.hostname}").`,
    );
  }
  return url.origin;
}

/**
 * Call a control-plane httpAction on the Convex `.site` router. The shared secret travels
 * as the `x-control-plane-secret` header — headers are not recorded as Convex function args,
 * so the secret never lands in query/mutation history (C2).
 *
 * Throws an Error carrying the upstream message on a non-2xx response so callers can preserve
 * their existing status mapping (e.g. "limit reached" → 429, "revoked" → 401).
 */
export async function callControlPlane<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getConvexSiteUrl()}${path}`, {
    method: "POST",
    headers: {
      "x-control-plane-secret": requireInternalControlPlaneSecret(),
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : `Control plane request failed (${res.status}).`;
    throw new Error(message);
  }

  return data as T;
}
