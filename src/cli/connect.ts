import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { MANYCHAT_LINKS, hostedSignUpUrl } from "../product.js";

/**
 * `manychat connect` — the first command a new user runs.
 *
 * It must work with **no credentials at all**, which is why the CLI dispatches
 * it before resolving config: someone who has not generated a ManyChat key yet
 * is exactly the person who needs these instructions.
 *
 * Output is JSON on stdout like every other command. Human-facing hints go to
 * stderr, so `manychat connect | jq` still behaves.
 */

export interface ConnectOptions {
  /** Open the hosted sign-up page in a browser. */
  open: boolean;
  /** Absolute path to the built CLI entry, for the config snippets. */
  entryPath: string;
}

export interface ConnectReport {
  apiKey: {
    detected: boolean;
    /** Where it came from. Never the value itself. */
    source: "env" | "profile" | null;
  };
  getKey: {
    where: string;
    docs: string;
    warning: string;
  };
  storeKey: {
    envVar: string;
    shell: string;
    persist: string;
    profilePath: string;
    profileExample: Record<string, unknown>;
    never: string[];
  };
  connect: {
    selfHosted: {
      note: string;
      claudeCodeOrDesktop: Record<string, unknown>;
      cursor: string;
      codex: string;
    };
    hosted: {
      note: string;
      signUp: string;
      mcpUrl: string;
      steps: string[];
    };
  };
  verify: string;
}

const PROFILE_PATH = join(homedir(), ".manychat", "config.json");

/**
 * Mirrors what `resolveConfig` will actually do. A profile only counts when
 * `MANYCHAT_PROFILE` names it *and* it carries a key — the file merely existing
 * resolves nothing, and reporting otherwise would send someone to `doctor`
 * expecting it to work.
 */
function detectResolvableProfile(): boolean {
  const name = process.env.MANYCHAT_PROFILE;
  if (!name || !existsSync(PROFILE_PATH)) return false;
  try {
    const parsed = JSON.parse(readFileSync(PROFILE_PATH, "utf8")) as {
      profiles?: Record<string, { apiKey?: string }>;
    };
    return Boolean(parsed.profiles?.[name]?.apiKey);
  } catch {
    // A malformed config is not a detected key.
    return false;
  }
}

export function buildConnectReport(entryPath: string): ConnectReport {
  const envKey = process.env.MANYCHAT_API_KEY;
  const hasProfile = detectResolvableProfile();

  return {
    apiKey: {
      detected: Boolean(envKey) || hasProfile,
      source: envKey ? "env" : hasProfile ? "profile" : null,
    },

    getKey: {
      where: "ManyChat → Settings → API → Generate your API Key (needs a Pro account)",
      docs: MANYCHAT_LINKS.manychatApiKeyDocs,
      warning:
        "The key is shown once. Copy it before you close that screen — if you lose it you " +
        "have to generate a new one, which invalidates the old. The key grants full access " +
        "to the page it belongs to, so treat it like a password.",
    },

    storeKey: {
      envVar: "MANYCHAT_API_KEY",
      shell: "export MANYCHAT_API_KEY='mc_your_key_here'",
      persist:
        "That only lasts for the current shell. Append the same line to ~/.zshrc (macOS) " +
        "or ~/.bashrc (Linux), then open a new terminal.",
      profilePath: PROFILE_PATH,
      profileExample: {
        profiles: {
          default: { apiKey: "mc_your_key_here" },
          clientA: { apiKey: "mc_a_different_key" },
        },
      },
      never: [
        "Do not paste the key into a file you commit — use the env var or the profile file.",
        "Do not pass --api-key on a shared machine: it lands in your shell history.",
        "Do not send it to an AI chat as plain text; the MCP server reads it from the environment.",
      ],
    },

    connect: {
      selfHosted: {
        note:
          "Runs on your machine over stdio. Your key never leaves it, and you manage the process.",
        claudeCodeOrDesktop: {
          mcpServers: {
            manychat: {
              command: "node",
              args: [entryPath, "mcp", "serve", "--transport", "stdio"],
              env: { MANYCHAT_API_KEY: "mc_your_key_here" },
            },
          },
        },
        cursor: "~/.cursor/mcp.json — same shape as the Claude config above.",
        codex:
          "~/.codex/config.toml →\n" +
          "[mcp_servers.manychat]\n" +
          'command = "node"\n' +
          `args = ["${entryPath}", "mcp", "serve", "--transport", "stdio"]\n` +
          'env = { MANYCHAT_API_KEY = "mc_your_key_here" }',
      },
      hosted: {
        note:
          "No server to run. Paste your ManyChat key once, it is stored encrypted, and you " +
          "connect agents with a revocable token instead of the raw key.",
        signUp: hostedSignUpUrl(),
        mcpUrl: MANYCHAT_LINKS.hostedMcpUrl,
        steps: [
          `Create an account: ${hostedSignUpUrl()}`,
          "Add your ManyChat key in the dashboard — it is encrypted at rest and never shown again.",
          "Issue an MCP token (shown once, revocable at any time).",
          `Point your agent at ${MANYCHAT_LINKS.hostedMcpUrl} with that token as a bearer credential.`,
        ],
      },
    },

    verify: "manychat doctor",
  };
}

/**
 * Opens a URL in the default browser. Never throws and never blocks: failing to
 * open a browser must not fail the command — on a headless box there is no
 * browser to open, and the URL is in the JSON output regardless.
 */
export function openInBrowser(url: string): boolean {
  const command =
    platform() === "darwin" ? "open" : platform() === "win32" ? "cmd" : "xdg-open";
  const args = platform() === "win32" ? ["/c", "start", "", url] : [url];

  try {
    const child = spawn(command, args, { stdio: "ignore", detached: true });
    child.on("error", () => {
      /* no browser here; the URL is already in stdout */
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

/** Short, human-readable next steps. Goes to stderr — stdout stays JSON. */
export function renderConnectHints(report: ConnectReport): string {
  const lines = [
    "",
    "  ManyChat MCP — getting connected",
    "",
  ];

  if (report.apiKey.detected) {
    lines.push(
      `  ✓ A ManyChat API key is already set (source: ${report.apiKey.source}).`,
      "    Check it works:  manychat doctor",
    );
  } else {
    lines.push(
      "  1. Generate a ManyChat API key",
      "       ManyChat → Settings → API → Generate your API Key",
      `       ${report.getKey.docs}`,
      "     It is shown once. Copy it before closing that screen.",
      "",
      "  2. Store it as an environment variable",
      `       ${report.storeKey.shell}`,
      "     Add that line to ~/.zshrc or ~/.bashrc so it survives a new terminal.",
      `     Several accounts? Put them in ${report.storeKey.profilePath} under`,
      '     { "profiles": { "clientA": { "apiKey": "…" } } } and pass --profile clientA.',
      "",
      "  3. Verify",
      "       manychat doctor",
    );
  }

  lines.push(
    "",
    "  Don't want to run a server? The hosted control plane stores your key",
    "  encrypted and gives your agents a revocable token instead:",
    `       ${report.connect.hosted.signUp}`,
    "",
    "  Full details, as JSON, are on stdout.",
    "",
  );

  return lines.join("\n");
}
