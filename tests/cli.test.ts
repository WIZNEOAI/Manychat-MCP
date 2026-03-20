import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCli } from "../src/cli/app.js";

type MockIo = {
  stdout: string[];
  stderr: string[];
};

function createIo(): MockIo {
  return {
    stdout: [],
    stderr: [],
  };
}

describe("manychat CLI", () => {
  const realFetch = global.fetch;
  const realEnv = process.env;

  beforeEach(() => {
    process.env = { ...realEnv };
    delete process.env.MANYCHAT_API_KEY;
  });

  afterEach(() => {
    global.fetch = realFetch;
    process.env = realEnv;
    vi.restoreAllMocks();
  });

  it("fails doctor with exit code 3 when API key is missing", async () => {
    const io = createIo();

    const exitCode = await runCli(["doctor"], io);

    expect(exitCode).toBe(3);
    expect(io.stdout).toEqual([]);
    expect(io.stderr.join("\n")).toContain("MANYCHAT_API_KEY");
  });

  it("prints stable JSON for doctor", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "success",
          data: {
            id: 1,
            name: "Demo Page",
            timezone: "UTC",
          },
        }),
        { status: 200 },
      ),
    ) as typeof fetch;

    const io = createIo();
    const exitCode = await runCli(["doctor", "--api-key", "test-key"], io);

    expect(exitCode).toBe(0);
    expect(io.stderr).toEqual([]);
    expect(JSON.parse(io.stdout.join(""))).toMatchInlineSnapshot(`
      {
        "command": [
          "doctor",
        ],
        "data": {
          "apiBaseUrl": "https://api.manychat.com/fb",
          "authSource": "flag",
          "page": {
            "id": 1,
            "name": "Demo Page",
            "timezone": "UTC",
          },
        },
        "ok": true,
      }
    `);
  });

  it("supports page info and tags list reads", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "success",
            data: {
              id: 99,
              name: "CLI Page",
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "success",
            data: [
              { id: 1, name: "vip" },
              { id: 2, name: "lead" },
            ],
          }),
          { status: 200 },
        ),
      ) as typeof fetch;

    const pageIo = createIo();
    const tagsIo = createIo();

    await expect(runCli(["page", "info", "--api-key", "test-key"], pageIo)).resolves.toBe(0);
    await expect(runCli(["tags", "list", "--api-key", "test-key"], tagsIo)).resolves.toBe(0);

    expect(JSON.parse(pageIo.stdout.join(""))).toMatchInlineSnapshot(`
      {
        "command": [
          "page",
          "info",
        ],
        "data": {
          "id": 99,
          "name": "CLI Page",
        },
        "ok": true,
      }
    `);
    expect(JSON.parse(tagsIo.stdout.join(""))).toMatchInlineSnapshot(`
      {
        "command": [
          "tags",
          "list",
        ],
        "data": [
          {
            "id": 1,
            "name": "vip",
          },
          {
            "id": 2,
            "name": "lead",
          },
        ],
        "ok": true,
      }
    `);
  });

  it("supports subscribers get and find reads", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "success",
            data: {
              id: "42",
              name: "Ada Lovelace",
              email: "ada@example.com",
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "success",
            data: {
              id: "42",
              name: "Ada Lovelace",
              email: "ada@example.com",
            },
          }),
          { status: 200 },
        ),
      ) as typeof fetch;

    const getIo = createIo();
    const findIo = createIo();

    await expect(
      runCli(["subscribers", "get", "--subscriber-id", "42", "--api-key", "test-key"], getIo),
    ).resolves.toBe(0);
    await expect(
      runCli(["subscribers", "find", "--email", "ada@example.com", "--api-key", "test-key"], findIo),
    ).resolves.toBe(0);

    expect(JSON.parse(getIo.stdout.join(""))).toMatchInlineSnapshot(`
      {
        "command": [
          "subscribers",
          "get",
        ],
        "data": {
          "email": "ada@example.com",
          "id": "42",
          "name": "Ada Lovelace",
        },
        "ok": true,
      }
    `);
    expect(JSON.parse(findIo.stdout.join(""))).toMatchInlineSnapshot(`
      {
        "command": [
          "subscribers",
          "find",
        ],
        "data": {
          "email": "ada@example.com",
          "id": "42",
          "name": "Ada Lovelace",
        },
        "ok": true,
      }
    `);
  });

  it("supports subscriber tag mutation with structured JSON output", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "success",
          data: {},
        }),
        { status: 200 },
      ),
    ) as typeof fetch;

    const io = createIo();
    const exitCode = await runCli(
      [
        "subscribers",
        "tags",
        "add",
        "--subscriber-id",
        "42",
        "--tag-name",
        "vip",
        "--api-key",
        "test-key",
      ],
      io,
    );

    expect(exitCode).toBe(0);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.manychat.com/fb/subscriber/addTagByName",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(JSON.parse(io.stdout.join(""))).toMatchInlineSnapshot(`
      {
        "command": [
          "subscribers",
          "tags",
          "add",
        ],
        "data": {
          "subscriber_id": 42,
          "tag_name": "vip",
        },
        "ok": true,
      }
    `);
  });
});
