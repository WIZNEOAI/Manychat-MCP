const DEFAULT_MANYCHAT_API_BASE = "https://api.manychat.com/fb";

type ManyChatApiEnvelope<T> = {
  status: "success" | "error";
  data?: T;
  message?: string;
};

export type ManyChatPageInfo = {
  id?: number;
  name?: string;
  username?: string;
};

export type ValidateManyChatKeyResult =
  | { ok: true; pageName: string | undefined; validatedAt: number }
  | { ok: false; error: string; userFacing: string };

function baseUrl(): string {
  return process.env.MANYCHAT_API_BASE_URL?.trim() || DEFAULT_MANYCHAT_API_BASE;
}

/**
 * Calls ManyChat GET /page/getInfo to verify the API key. Does not log secrets.
 */
export async function validateManyChatApiKey(apiKey: string): Promise<ValidateManyChatKeyResult> {
  const key = apiKey.trim();
  if (!key) {
    return {
      ok: false,
      error: "empty_key",
      userFacing: "API key is required.",
    };
  }

  const url = `${baseUrl()}/page/getInfo`;
  const validatedAt = Date.now();

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    });

    const json = (await res.json()) as ManyChatApiEnvelope<ManyChatPageInfo>;

    if (!res.ok || json.status === "error") {
      const technical = json.message ?? `HTTP ${res.status}`;
      return {
        ok: false,
        error: technical,
        userFacing:
          res.status === 401 || res.status === 403
            ? "ManyChat rejected this API key. Check that the key is correct and active."
            : "Could not validate this API key with ManyChat. Check the key and try again.",
      };
    }

    const page = json.data;
    const pageName =
      page && typeof page.name === "string" && page.name.trim()
        ? page.name.trim()
        : page && typeof page.username === "string" && page.username.trim()
          ? page.username.trim()
          : undefined;

    return { ok: true, pageName, validatedAt };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "TimeoutError";
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      userFacing: isAbort
        ? "ManyChat validation timed out. Try again."
        : "Could not reach ManyChat to validate the key. Check your network and try again.",
    };
  }
}
