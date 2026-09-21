import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli, type CliIo } from "../src/cli/app.js";
import { buildConnectReport, renderConnectHints } from "../src/cli/connect.js";

/**
 * `connect` is the first command a new user runs, so its contract is narrow and
 * load-bearing: it must work with no credentials, it must not print the key, and
 * stdout must stay parseable JSON like every other command.
 */

function newIo(): CliIo {
  return { stdout: [], stderr: [] };
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  delete process.env.MANYCHAT_API_KEY;
  delete process.env.MANYCHAT_PROFILE;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("manychat connect", () => {
  it("succeeds with no credentials at all", async () => {
    const io = newIo();
    // Without the early dispatch this exits 3 (config error) — the person who
    // most needs onboarding is the one without a key.
    const code = await runCli(["connect"], io);

    expect(code).toBe(0);
    const payload = JSON.parse(io.stdout.join(""));
    expect(payload.ok).toBe(true);
    expect(payload.data.apiKey.detected).toBe(false);
    expect(payload.data.apiKey.source).toBeNull();
  });

  it("keeps stdout parseable JSON and puts guidance on stderr", async () => {
    const io = newIo();
    await runCli(["connect"], io);

    expect(() => JSON.parse(io.stdout.join(""))).not.toThrow();
    expect(io.stderr.join("")).toMatch(/Generate a ManyChat API key/);
    // Nothing human-readable may leak into stdout.
    expect(io.stdout.join("")).not.toMatch(/getting connected/);
  });

  it("--quiet drops the stderr guidance but keeps the JSON", async () => {
    const io = newIo();
    await runCli(["connect", "--quiet"], io);

    expect(io.stderr.join("")).toBe("");
    expect(JSON.parse(io.stdout.join("")).ok).toBe(true);
  });

  it("reports a key from the environment without ever printing it", async () => {
    process.env.MANYCHAT_API_KEY = "mc_this_must_not_appear";
    const io = newIo();
    await runCli(["connect"], io);

    const everything = io.stdout.join("") + io.stderr.join("");
    expect(everything).not.toContain("mc_this_must_not_appear");

    const payload = JSON.parse(io.stdout.join(""));
    expect(payload.data.apiKey).toEqual({ detected: true, source: "env" });
  });

  it("does not send users to a public HTTP gateway as the connect door", async () => {
    const io = newIo();
    await runCli(["connect"], io);
    const blob = io.stdout.join("") + io.stderr.join("");
    const hosted = JSON.parse(io.stdout.join("")).data.connect.hosted;

    expect(blob).not.toContain("https://mcp.wizneo.org");
    expect(hosted.signUp).toMatch(/mc-mcp\.wizneo\.org/);
    expect(hosted.signUp).not.toMatch(/\/sign-up$/);
    expect(hosted.mcpUrl).toContain("mcp.example.com");
    expect(hosted.mcpUrl).not.toContain("mcp.wizneo.org");
    expect(hosted.note).toMatch(/not a public paste-your-key door/i);
    expect(hosted.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("emits an absolute path in the agent config snippets", async () => {
    const io = newIo();
    await runCli(["connect"], io);
    const args = JSON.parse(io.stdout.join("")).data.connect.selfHosted
      .claudeCodeOrDesktop.mcpServers.manychat.args as string[];

    // A relative path here produces a config that silently fails to start,
    // because MCP clients resolve args from their own working directory.
    expect(args[0].startsWith("/") || /^[A-Za-z]:\\/.test(args[0])).toBe(true);
  });

  it("documents the profile file in the shape the CLI actually reads", () => {
    const report = buildConnectReport("/tmp/entry.js");
    // resolveConfig reads `{ profiles: { <name>: { apiKey } } }`. An example in
    // any other shape sends people to a config that will not load.
    expect(report.storeKey.profileExample).toHaveProperty("profiles");
    expect(report.storeKey.never.length).toBeGreaterThan(0);
  });
});

describe("profile detection mirrors resolveConfig", () => {
  it("does not claim a key when no profile is selected", () => {
    // A config file merely existing resolves nothing — resolveConfig only reads
    // it when MANYCHAT_PROFILE (or --profile) names an entry. Reporting a key
    // here would send someone to `doctor` expecting it to work.
    delete process.env.MANYCHAT_PROFILE;
    expect(buildConnectReport("/tmp/entry.js").apiKey.detected).toBe(false);
  });

  it("does not claim a key for a profile name that is not in the file", () => {
    process.env.MANYCHAT_PROFILE = "definitely-not-a-configured-profile-name";
    expect(buildConnectReport("/tmp/entry.js").apiKey.detected).toBe(false);
  });
});

describe("connect hints", () => {
  it("tells a new user to generate, store and verify — in that order", () => {
    const text = renderConnectHints(buildConnectReport("/tmp/entry.js"));
    const generate = text.indexOf("Generate a ManyChat API key");
    const store = text.indexOf("Store it as an environment variable");
    const verify = text.indexOf("manychat doctor");

    expect(generate).toBeGreaterThan(-1);
    expect(generate).toBeLessThan(store);
    expect(store).toBeLessThan(verify);
  });

  it("warns that the key is shown once", () => {
    const text = renderConnectHints(buildConnectReport("/tmp/entry.js"));
    expect(text).toMatch(/shown once/i);
  });
});
