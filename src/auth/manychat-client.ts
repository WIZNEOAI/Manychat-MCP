import { log } from "../lib/logger.js";

const BASE_URL = "https://api.manychat.com/fb";

const RETRY_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export interface ManyChatResponse<T = unknown> {
  status: "success" | "error";
  data?: T;
  message?: string;
  details?: { messages: Array<{ message: string }> };
}

export class ManyChatError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: ManyChatResponse,
  ) {
    super(message);
    this.name = "ManyChatError";
  }
}

export class ManyChatClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.MANYCHAT_API_KEY;
    if (!key) {
      throw new Error(
        "ManyChat API key is required. Set MANYCHAT_API_KEY env var or pass it to the constructor.",
      );
    }
    this.apiKey = key;
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: Record<string, unknown>,
    params?: Record<string, string>,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const jitter = Math.random() * 200;
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1) + jitter;
        await new Promise((r) => setTimeout(r, delay));
      }

      const url = new URL(`${BASE_URL}${path}`);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          url.searchParams.set(k, v);
        }
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      };
      if (method === "POST") {
        headers["Content-Type"] = "application/json";
      }

      try {
        const start = Date.now();
        const res = await fetch(url.toString(), {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(30_000),
        });
        const durationMs = Date.now() - start;

        log.debug("manychat_api_call", {
          method,
          path,
          status: res.status,
          durationMs,
          attempt,
        });

        if (RETRY_CODES.has(res.status) && attempt < MAX_RETRIES) {
          log.warn("manychat_api_retry", { path, status: res.status, attempt });
          lastError = new ManyChatError(
            `ManyChat API returned ${res.status}`,
            res.status,
          );
          continue;
        }

        const json = (await res.json()) as ManyChatResponse<T>;

        if (!res.ok || json.status === "error") {
          log.error("manychat_api_error", {
            path,
            status: res.status,
            message: json.message,
          });
          throw new ManyChatError(
            json.message ?? `ManyChat API error (${res.status})`,
            res.status,
            json as ManyChatResponse,
          );
        }

        return json.data as T;
      } catch (err) {
        if (err instanceof ManyChatError) throw err;
        lastError = err as Error;
        if (attempt >= MAX_RETRIES) break;
      }
    }

    throw lastError ?? new Error("ManyChat API request failed");
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>("GET", path, undefined, params);
  }

  async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.get("/page/getInfo");
      return true;
    } catch {
      return false;
    }
  }
}
