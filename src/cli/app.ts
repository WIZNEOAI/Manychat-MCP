import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import {
  DEFAULT_MANYCHAT_API_BASE_URL,
  ManyChatClient,
  ManyChatError,
} from "../core/manychat-client.js";
import { buildConnectReport, openInBrowser, renderConnectHints } from "./connect.js";

export interface CliIo {
  stdout: string[];
  stderr: string[];
}

type ParsedArgs = {
  positionals: string[];
  flags: Map<string, string | boolean>;
};

type ProfileConfig = {
  apiKey?: string;
  baseUrl?: string;
};

type ProfilesFile = {
  profiles?: Record<string, ProfileConfig>;
};

type ResolvedConfig = {
  apiKey: string;
  baseUrl: string;
  authSource: "flag" | "env" | "profile";
  pretty: boolean;
  verbose: boolean;
  quiet: boolean;
  profile?: string;
};

type CliSuccess = {
  ok: true;
  command: string[];
  data: unknown;
};

type CliFailure = {
  ok: false;
  command: string[];
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export async function runCli(argv: string[], io: CliIo): Promise<number> {
  const parsed = parseArgs(argv);
  const command = parsed.positionals;

  try {
    if (command.length === 0 || hasBooleanFlag(parsed.flags, "help")) {
      io.stdout.push(`${renderHelp()}\n`);
      return 0;
    }

    // Dispatched before resolveConfig on purpose: someone who has not generated
    // a ManyChat key yet is exactly the person who needs `connect`, and
    // resolveConfig throws without one.
    if (command[0] === "connect") {
      const report = buildConnectReport(resolveEntryPath());
      if (hasBooleanFlag(parsed.flags, "open")) {
        openInBrowser(report.connect.hosted.signUp);
      }
      if (!hasBooleanFlag(parsed.flags, "quiet")) {
        io.stderr.push(renderConnectHints(report));
      }
      writeJson(io.stdout, success(command, report), hasBooleanFlag(parsed.flags, "pretty"));
      return 0;
    }

    const config = resolveConfig(parsed.flags);
    const client = new ManyChatClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
    });

    const result = await dispatchCommand(command, parsed.flags, client, config);
    writeJson(io.stdout, result, config.pretty);
    return 0;
  } catch (error) {
    const exitCode = toExitCode(error);
    const pretty = hasBooleanFlag(parsed.flags, "pretty");
    writeJson(
      io.stderr,
      {
        ok: false,
        command,
        error: formatError(error),
      } satisfies CliFailure,
      pretty,
    );
    return exitCode;
  }
}

async function dispatchCommand(
  command: string[],
  flags: Map<string, string | boolean>,
  client: ManyChatClient,
  config: ResolvedConfig,
): Promise<CliSuccess> {
  if (command[0] === "doctor") {
    const page = await client.get("/page/getInfo");
    return success(command, {
      apiBaseUrl: config.baseUrl,
      authSource: config.authSource,
      page,
    });
  }

  if (command[0] === "page" && command[1] === "info") {
    return success(command, await client.get("/page/getInfo"));
  }

  if (command[0] === "page" && command[1] === "bot-fields" && command[2] === "list") {
    return success(command, await client.get("/page/getBotFields"));
  }

  if (command[0] === "page" && command[1] === "bot-fields" && command[2] === "set") {
    const fieldId = getNumberFlag(flags, "field-id");
    await client.post("/page/setBotField", {
      field_id: fieldId,
      field_value: getTypedValue(flags),
    });
    return success(command, { field_id: fieldId });
  }

  if (command[0] === "page" && command[1] === "growth-tools" && command[2] === "list") {
    return success(command, await client.get("/page/getGrowthTools"));
  }

  if (command[0] === "page" && command[1] === "otn-topics" && command[2] === "list") {
    return success(command, await client.get("/page/getOtnTopics"));
  }

  if (command[0] === "tags" && command[1] === "list") {
    return success(command, await client.get("/page/getTags"));
  }

  if (command[0] === "tags" && command[1] === "create") {
    const name = getStringFlag(flags, "name");
    return success(command, await client.post("/page/createTag", { name }));
  }

  if (command[0] === "fields" && command[1] === "list") {
    return success(command, await client.get("/page/getCustomFields"));
  }

  if (command[0] === "fields" && command[1] === "create") {
    const body: Record<string, unknown> = {
      caption: getStringFlag(flags, "caption"),
      type: getStringFlag(flags, "type"),
    };
    const description = getOptionalStringFlag(flags, "description");
    if (description) body.description = description;
    return success(command, await client.post("/page/createCustomField", body));
  }

  if (command[0] === "fields" && command[1] === "set") {
    const subscriberId = getNumberFlag(flags, "subscriber-id");
    const fieldValue = getTypedValue(flags);
    const fieldId = getOptionalNumberFlag(flags, "field-id");
    const fieldName = getOptionalStringFlag(flags, "field-name");

    if (fieldId === undefined && !fieldName) {
      throw usageError("Provide --field-id or --field-name for fields set.");
    }

    if (fieldId !== undefined) {
      await client.post("/subscriber/setCustomField", {
        subscriber_id: subscriberId,
        field_id: fieldId,
        field_value: fieldValue,
      });
      return success(command, {
        subscriber_id: subscriberId,
        field_id: fieldId,
        field_value: fieldValue,
      });
    }

    await client.post("/subscriber/setCustomFieldByName", {
      subscriber_id: subscriberId,
      field_name: fieldName,
      field_value: fieldValue,
    });
    return success(command, {
      subscriber_id: subscriberId,
      field_name: fieldName,
      field_value: fieldValue,
    });
  }

  if (command[0] === "fields" && command[1] === "set-bulk") {
    const subscriberId = getNumberFlag(flags, "subscriber-id");
    const fields = parseJsonFlag(flags, "fields-json");
    await client.post("/subscriber/setCustomFields", {
      subscriber_id: subscriberId,
      fields,
    });
    return success(command, {
      subscriber_id: subscriberId,
      fields,
    });
  }

  if (command[0] === "flows" && command[1] === "list") {
    return success(command, await client.get("/page/getFlows"));
  }

  if (command[0] === "flows" && command[1] === "send") {
    const subscriberId = getNumberFlag(flags, "subscriber-id");
    const flowNs = getStringFlag(flags, "flow-ns");
    await client.post("/sending/sendFlow", {
      subscriber_id: subscriberId,
      flow_ns: flowNs,
    });
    return success(command, {
      subscriber_id: subscriberId,
      flow_ns: flowNs,
    });
  }

  if (command[0] === "subscribers" && command[1] === "get") {
    const subscriberId = getNumberFlag(flags, "subscriber-id");
    return success(
      command,
      await client.get("/subscriber/getInfo", {
        subscriber_id: String(subscriberId),
      }),
    );
  }

  if (command[0] === "subscribers" && command[1] === "find") {
    const email = getOptionalStringFlag(flags, "email");
    const phone = getOptionalStringFlag(flags, "phone");
    const name = getOptionalStringFlag(flags, "name");
    const selectors = [email, phone, name].filter(Boolean);

    if (selectors.length !== 1) {
      throw usageError("Provide exactly one selector: --email, --phone, or --name.");
    }

    if (email) {
      return success(command, await client.get("/subscriber/findBySystemField", { email }));
    }

    if (phone) {
      return success(command, await client.get("/subscriber/findBySystemField", { phone }));
    }

    return success(command, await client.get("/subscriber/findByName", { name: name! }));
  }

  if (command[0] === "subscribers" && command[1] === "create") {
    const payload = buildSubscriberPayload(flags, false);
    return success(command, await client.post("/subscriber/createSubscriber", payload));
  }

  if (command[0] === "subscribers" && command[1] === "update") {
    const payload = buildSubscriberPayload(flags, true);
    await client.post("/subscriber/updateSubscriber", payload);
    return success(command, payload);
  }

  if (command[0] === "subscribers" && command[1] === "tags" && command[2] === "add") {
    const subscriberId = getNumberFlag(flags, "subscriber-id");
    const tagId = getOptionalNumberFlag(flags, "tag-id");
    const tagName = getOptionalStringFlag(flags, "tag-name");

    if (tagId === undefined && !tagName) {
      throw usageError("Provide --tag-id or --tag-name for subscribers tags add.");
    }

    if (tagId !== undefined) {
      await client.post("/subscriber/addTag", {
        subscriber_id: subscriberId,
        tag_id: tagId,
      });
      return success(command, {
        subscriber_id: subscriberId,
        tag_id: tagId,
      });
    }

    await client.post("/subscriber/addTagByName", {
      subscriber_id: subscriberId,
      tag_name: tagName,
    });
    return success(command, {
      subscriber_id: subscriberId,
      tag_name: tagName,
    });
  }

  if (command[0] === "subscribers" && command[1] === "tags" && command[2] === "remove") {
    const subscriberId = getNumberFlag(flags, "subscriber-id");
    const tagId = getOptionalNumberFlag(flags, "tag-id");
    const tagName = getOptionalStringFlag(flags, "tag-name");

    if (tagId === undefined && !tagName) {
      throw usageError("Provide --tag-id or --tag-name for subscribers tags remove.");
    }

    if (tagId !== undefined) {
      await client.post("/subscriber/removeTag", {
        subscriber_id: subscriberId,
        tag_id: tagId,
      });
      return success(command, {
        subscriber_id: subscriberId,
        tag_id: tagId,
      });
    }

    await client.post("/subscriber/removeTagByName", {
      subscriber_id: subscriberId,
      tag_name: tagName,
    });
    return success(command, {
      subscriber_id: subscriberId,
      tag_name: tagName,
    });
  }

  if (command[0] === "send" && command[1] === "text") {
    const subscriberId = getNumberFlag(flags, "subscriber-id");
    const body: Record<string, unknown> = {
      subscriber_id: subscriberId,
      data: {
        version: "v2",
        content: {
          messages: [{ type: "text", text: getStringFlag(flags, "text") }],
        },
      },
    };
    const messageTag = getOptionalStringFlag(flags, "message-tag");
    if (messageTag) body.message_tag = messageTag;
    await client.post("/sending/sendContent", body);
    return success(command, body);
  }

  if (command[0] === "send" && command[1] === "content") {
    const subscriberId = getNumberFlag(flags, "subscriber-id");
    const body: Record<string, unknown> = {
      subscriber_id: subscriberId,
      data: parseJsonFlag(flags, "data-json"),
    };
    const messageTag = getOptionalStringFlag(flags, "message-tag");
    if (messageTag) body.message_tag = messageTag;
    await client.post("/sending/sendContent", body);
    return success(command, body);
  }

  if (command[0] === "raw" && command[1] === "get") {
    const path = getStringFlag(flags, "path");
    const params = (getOptionalJsonFlag(flags, "params-json") ?? {}) as Record<string, string>;
    return success(command, await client.get(path, stringifyRecord(params)));
  }

  if (command[0] === "raw" && command[1] === "post") {
    const path = getStringFlag(flags, "path");
    const body = (getOptionalJsonFlag(flags, "body-json") ?? {}) as Record<string, unknown>;
    return success(command, await client.post(path, body));
  }

  throw usageError(`Unknown command: ${command.join(" ")}`);
}

function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags = new Map<string, string | boolean>();

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const name = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      flags.set(name, true);
      continue;
    }

    flags.set(name, next);
    i++;
  }

  return { positionals, flags };
}

function resolveConfig(flags: Map<string, string | boolean>): ResolvedConfig {
  const profileName = getOptionalStringFlag(flags, "profile") ?? process.env.MANYCHAT_PROFILE;
  const profile = profileName ? loadProfile(profileName) : undefined;

  const flagApiKey = getOptionalStringFlag(flags, "api-key");
  const envApiKey = process.env.MANYCHAT_API_KEY;
  const profileApiKey = profile?.apiKey;
  const apiKey = flagApiKey ?? envApiKey ?? profileApiKey;

  if (!apiKey) {
    throw configError(
      "ManyChat API key is required. Pass --api-key, set MANYCHAT_API_KEY, or configure a profile.",
    );
  }

  const authSource: ResolvedConfig["authSource"] = flagApiKey
    ? "flag"
    : envApiKey
      ? "env"
      : "profile";

  return {
    apiKey,
    baseUrl:
      getOptionalStringFlag(flags, "base-url") ??
      process.env.MANYCHAT_API_BASE_URL ??
      profile?.baseUrl ??
      DEFAULT_MANYCHAT_API_BASE_URL,
    authSource,
    pretty: hasBooleanFlag(flags, "pretty"),
    verbose: hasBooleanFlag(flags, "verbose"),
    quiet: hasBooleanFlag(flags, "quiet"),
    profile: profileName,
  };
}

function loadProfile(name: string): ProfileConfig {
  const profilePath = join(homedir(), ".manychat", "config.json");
  if (!existsSync(profilePath)) {
    throw configError(`Profile "${name}" was requested but ${profilePath} does not exist.`);
  }

  const parsed = JSON.parse(readFileSync(profilePath, "utf8")) as ProfilesFile;
  const profile = parsed.profiles?.[name];
  if (!profile) {
    throw configError(`Profile "${name}" was not found in ${profilePath}.`);
  }

  return profile;
}

function buildSubscriberPayload(
  flags: Map<string, string | boolean>,
  requireSubscriberId: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const mapping: Array<[string, string]> = [
    ["subscriber-id", "subscriber_id"],
    ["first-name", "first_name"],
    ["last-name", "last_name"],
    ["phone", "phone"],
    ["whatsapp-phone", "whatsapp_phone"],
    ["email", "email"],
    ["gender", "gender"],
    ["consent-phrase", "consent_phrase"],
  ];

  for (const [flagName, fieldName] of mapping) {
    const value = getOptionalStringFlag(flags, flagName);
    if (value !== undefined) {
      payload[fieldName] = flagName === "subscriber-id" ? Number(value) : value;
    }
  }

  const smsOptIn = getOptionalBooleanFlag(flags, "has-opt-in-sms");
  const emailOptIn = getOptionalBooleanFlag(flags, "has-opt-in-email");
  if (smsOptIn !== undefined) payload.has_opt_in_sms = smsOptIn;
  if (emailOptIn !== undefined) payload.has_opt_in_email = emailOptIn;

  if (requireSubscriberId && payload.subscriber_id === undefined) {
    throw usageError("subscribers update requires --subscriber-id.");
  }

  return payload;
}

function getTypedValue(flags: Map<string, string | boolean>): unknown {
  const jsonValue = getOptionalStringFlag(flags, "value-json");
  if (jsonValue !== undefined) {
    return parseJsonText(jsonValue, "value-json");
  }

  const stringValue = getOptionalStringFlag(flags, "value");
  if (stringValue !== undefined) {
    return stringValue;
  }

  throw usageError("Provide --value or --value-json.");
}

function getOptionalJsonFlag(
  flags: Map<string, string | boolean>,
  name: string,
): unknown | undefined {
  const value = getOptionalStringFlag(flags, name);
  if (value === undefined) return undefined;
  return parseJsonText(value, name);
}

function parseJsonFlag(flags: Map<string, string | boolean>, name: string): unknown {
  const value = getOptionalStringFlag(flags, name);
  if (value === undefined) {
    throw usageError(`Missing required flag --${name}.`);
  }
  return parseJsonText(value, name);
}

function parseJsonText(value: string, flagName: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw usageError(`Flag --${flagName} must contain valid JSON.`);
  }
}

function stringifyRecord(value: Record<string, string>): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    next[key] = String(item);
  }
  return next;
}

function getStringFlag(flags: Map<string, string | boolean>, name: string): string {
  const value = getOptionalStringFlag(flags, name);
  if (value === undefined) {
    throw usageError(`Missing required flag --${name}.`);
  }
  return value;
}

function getOptionalStringFlag(
  flags: Map<string, string | boolean>,
  name: string,
): string | undefined {
  const value = flags.get(name);
  return typeof value === "string" ? value : undefined;
}

function getNumberFlag(flags: Map<string, string | boolean>, name: string): number {
  const value = getStringFlag(flags, name);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw usageError(`Flag --${name} must be a number.`);
  }
  return parsed;
}

function getOptionalNumberFlag(
  flags: Map<string, string | boolean>,
  name: string,
): number | undefined {
  const value = getOptionalStringFlag(flags, name);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw usageError(`Flag --${name} must be a number.`);
  }
  return parsed;
}

function getOptionalBooleanFlag(
  flags: Map<string, string | boolean>,
  name: string,
): boolean | undefined {
  const value = getOptionalStringFlag(flags, name);
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw usageError(`Flag --${name} must be true or false.`);
}

function hasBooleanFlag(flags: Map<string, string | boolean>, name: string): boolean {
  return flags.get(name) === true;
}

function writeJson(target: string[], value: unknown, pretty: boolean) {
  target.push(JSON.stringify(value, null, pretty ? 2 : 0));
}

function success(command: string[], data: unknown): CliSuccess {
  return {
    ok: true,
    command,
    data,
  };
}

/**
 * Absolute path to the CLI entry, for the MCP config snippets `connect` prints.
 * MCP clients resolve `args` relative to their own working directory, so a
 * relative path here would produce a config that silently fails to start.
 */
function resolveEntryPath(): string {
  const entry = process.argv[1];
  if (!entry) return "/absolute/path/to/Manychat-MCP/dist/index.js";
  return isAbsolute(entry) ? entry : resolve(entry);
}

function renderHelp(): string {
  return [
    "manychat CLI",
    "",
    "Usage:",
    "  manychat connect [--open]        # start here: get a key, store it, connect an agent",
    "  manychat doctor --api-key <key>",
    "  manychat page info --api-key <key>",
    "  manychat tags list --api-key <key>",
    "  manychat subscribers get --subscriber-id <id> --api-key <key>",
    "  manychat subscribers find --email <email> --api-key <key>",
    "  manychat subscribers tags add --subscriber-id <id> --tag-name <name> --api-key <key>",
    "  manychat mcp serve [--transport stdio|http]",
  ].join("\n");
}

function usageError(message: string) {
  const error = new Error(message);
  error.name = "CliUsageError";
  return error;
}

function configError(message: string) {
  const error = new Error(message);
  error.name = "CliConfigError";
  return error;
}

function toExitCode(error: unknown): number {
  if (error instanceof ManyChatError) {
    return error.statusCode === 429 ? 5 : 4;
  }
  if (error instanceof Error && error.name === "CliConfigError") {
    return 3;
  }
  if (error instanceof Error && error.name === "CliUsageError") {
    return 2;
  }
  return 4;
}

function formatError(error: unknown): CliFailure["error"] {
  if (error instanceof ManyChatError) {
    return {
      code: error.statusCode === 429 ? "rate_limit" : "manychat_api_error",
      message: error.message,
      details: error.response,
    };
  }

  if (error instanceof Error) {
    return {
      code:
        error.name === "CliConfigError"
          ? "config_error"
          : error.name === "CliUsageError"
            ? "usage_error"
            : "unknown_error",
      message: error.message,
    };
  }

  return {
    code: "unknown_error",
    message: "Unknown CLI error",
    details: error,
  };
}
