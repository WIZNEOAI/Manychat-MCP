import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ManyChatClient, ManyChatError } from "../src/auth/manychat-client.js";

describe("ManyChatClient", () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    process.env.MANYCHAT_API_KEY = "test-manychat-key";
  });

  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("returns data on successful response", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "success",
          data: { id: 1, ok: true },
        }),
        { status: 200 },
      ),
    ) as typeof fetch;

    const client = new ManyChatClient();
    const data = await client.get<{ id: number; ok: boolean }>("/page/getInfo");
    expect(data.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("retries on transient 429 and succeeds", async () => {
    vi.useFakeTimers();
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "error", message: "rate limit" }), {
          status: 429,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "success",
            data: { id: 2 },
          }),
          { status: 200 },
        ),
      ) as typeof fetch;

    const client = new ManyChatClient();
    const requestPromise = client.get<{ id: number }>("/page/getInfo");
    await vi.runAllTimersAsync();
    const data = await requestPromise;
    expect(data.id).toBe(2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("throws ManyChatError on non-retriable bad request", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "error",
          message: "bad request",
        }),
        { status: 400 },
      ),
    ) as typeof fetch;

    const client = new ManyChatClient();
    await expect(client.get("/page/getInfo")).rejects.toBeInstanceOf(ManyChatError);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
