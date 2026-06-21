# ManyChat Policy Validation Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure, well-tested Meta/ManyChat messaging-policy validation engine, expose it as a `validate_message` MCP tool, and wire it as a pre-send guard so an agent cannot send a policy-violating message.

**Architecture:** A dependency-free pure module (`src/policy/`) computes a `PolicyVerdict` from a declared message context. A new tool group registers `validate_message`. The existing send tools call the engine before `client.post` and block on a `block`-level verdict unless explicitly overridden. This is the OSS "knowledge + validation" wedge — the differentiator vs every raw-API competitor.

**Tech Stack:** TypeScript (ESM, NodeNext, strict), Zod, `@modelcontextprotocol/sdk`, Vitest.

## Global Constraints

- ESM-only; `.js` extensions in relative imports; `NodeNext` resolution; `strict: true`, target ES2022.
- stdout stays machine-readable JSON; diagnostics on stderr only.
- Read-before-write / verify-after-write posture preserved; send operations are high risk.
- Policy facts (verbatim, from `docs/context/safety-model.md` + ManyChat/Meta official docs): standard Messenger/Instagram messaging window = **24h** since last subscriber interaction; outside it requires a valid **message tag**; **message tags are not a durable Messenger strategy after 2026-02-10**; **HUMAN_AGENT** extends to a **7-day (168h)** human-support window; message tags must **not** carry promotional content.
- No new runtime dependencies. Pure module must have **zero imports** from `auth/`, `mcp/`, or network code.
- All existing tests must stay green: `npm test`.

---

### Task 1: Pure policy engine

**Files:**
- Create: `src/policy/types.ts`
- Create: `src/policy/messaging-window.ts`
- Test: `tests/policy/messaging-window.test.ts`

**Interfaces:**
- Consumes: nothing (pure).
- Produces:
  - `type PolicyLevel = "allow" | "warn" | "block"`
  - `type ManyChatChannel = "messenger" | "instagram" | "whatsapp" | "sms" | "email" | "telegram"`
  - `interface OutboundMessageContext { channel: ManyChatChannel; hoursSinceLastInteraction?: number; messageTag?: string; promotional?: boolean; hasOptIn?: boolean; now?: Date; }`
  - `interface PolicyFinding { code: string; level: PolicyLevel; message: string; rule: string; }`
  - `interface PolicyVerdict { level: PolicyLevel; allowed: boolean; findings: PolicyFinding[]; }`
  - `function validateOutboundMessage(ctx: OutboundMessageContext): PolicyVerdict`
  - `const VALID_MESSAGE_TAGS: readonly string[]`
  - `const TAG_DEPRECATION_DATE: Date` (2026-02-10)

- [ ] **Step 1: Write `src/policy/types.ts`**

```typescript
export type PolicyLevel = "allow" | "warn" | "block";

export type ManyChatChannel =
  | "messenger"
  | "instagram"
  | "whatsapp"
  | "sms"
  | "email"
  | "telegram";

export interface OutboundMessageContext {
  /** Channel the message is sent on. */
  channel: ManyChatChannel;
  /** Hours since the subscriber last interacted. Undefined = unknown (treated as outside window). */
  hoursSinceLastInteraction?: number;
  /** Message tag the caller intends to use, if any. */
  messageTag?: string;
  /** True if the content is promotional/marketing. */
  promotional?: boolean;
  /** Whether the subscriber has a recorded opt-in. */
  hasOptIn?: boolean;
  /** Clock injection for deterministic tests. Defaults to new Date() at call time. */
  now?: Date;
}

export interface PolicyFinding {
  code: string;
  level: PolicyLevel;
  message: string;
  rule: string;
}

export interface PolicyVerdict {
  level: PolicyLevel;
  allowed: boolean;
  findings: PolicyFinding[];
}
```

- [ ] **Step 2: Write the failing test `tests/policy/messaging-window.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { validateOutboundMessage } from "../../src/policy/messaging-window.js";

const BEFORE_DEPRECATION = new Date("2026-01-01T00:00:00Z");
const AFTER_DEPRECATION = new Date("2026-03-01T00:00:00Z");

describe("validateOutboundMessage", () => {
  it("allows a messenger message within the 24h window", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 2 });
    expect(v.level).toBe("allow");
    expect(v.allowed).toBe(true);
    expect(v.findings).toHaveLength(0);
  });

  it("blocks outside the window with no tag", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 48 });
    expect(v.level).toBe("block");
    expect(v.allowed).toBe(false);
    expect(v.findings.map((f) => f.code)).toContain("OUTSIDE_WINDOW_NO_TAG");
  });

  it("treats unknown interaction time as outside the window", () => {
    const v = validateOutboundMessage({ channel: "messenger" });
    expect(v.allowed).toBe(false);
    expect(v.findings.map((f) => f.code)).toContain("OUTSIDE_WINDOW_NO_TAG");
  });

  it("blocks an invalid/unknown message tag", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 48, messageTag: "MADE_UP_TAG", now: BEFORE_DEPRECATION });
    expect(v.level).toBe("block");
    expect(v.findings.map((f) => f.code)).toContain("INVALID_TAG");
  });

  it("blocks promotional content under a non-promotional tag", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 48, messageTag: "ACCOUNT_UPDATE", promotional: true, now: BEFORE_DEPRECATION });
    expect(v.level).toBe("block");
    expect(v.findings.map((f) => f.code)).toContain("PROMO_UNDER_NONPROMO_TAG");
  });

  it("allows a valid non-promo tag outside the window before deprecation", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 48, messageTag: "CONFIRMED_EVENT_UPDATE", now: BEFORE_DEPRECATION });
    expect(v.allowed).toBe(true);
    expect(v.level).toBe("allow");
  });

  it("warns that standard tags are deprecated after 2026-02-10", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 48, messageTag: "CONFIRMED_EVENT_UPDATE", now: AFTER_DEPRECATION });
    expect(v.level).toBe("warn");
    expect(v.allowed).toBe(true);
    expect(v.findings.map((f) => f.code)).toContain("TAG_DEPRECATED");
  });

  it("allows HUMAN_AGENT within the 7-day window even after deprecation", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 100, messageTag: "HUMAN_AGENT", now: AFTER_DEPRECATION });
    expect(v.allowed).toBe(true);
    expect(v.level).toBe("allow");
  });

  it("blocks HUMAN_AGENT past the 7-day window", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 200, messageTag: "HUMAN_AGENT" });
    expect(v.level).toBe("block");
    expect(v.findings.map((f) => f.code)).toContain("HUMAN_AGENT_WINDOW_EXPIRED");
  });

  it("warns when WhatsApp is outside the window (template required, not modeled)", () => {
    const v = validateOutboundMessage({ channel: "whatsapp", hoursSinceLastInteraction: 48 });
    expect(v.findings.map((f) => f.code)).toContain("WA_TEMPLATE_REQUIRED");
  });

  it("warns when opt-in is explicitly missing", () => {
    const v = validateOutboundMessage({ channel: "messenger", hoursSinceLastInteraction: 2, hasOptIn: false });
    expect(v.findings.map((f) => f.code)).toContain("MISSING_OPT_IN");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node -e "require('child_process').execSync('npx vitest run tests/policy/messaging-window.test.ts', {stdio:'inherit'})"`
Expected: FAIL — cannot find module `../../src/policy/messaging-window.js`.

- [ ] **Step 4: Write `src/policy/messaging-window.ts`**

```typescript
import type {
  ManyChatChannel,
  OutboundMessageContext,
  PolicyFinding,
  PolicyLevel,
  PolicyVerdict,
} from "./types.js";

export type { OutboundMessageContext, PolicyVerdict, PolicyFinding, PolicyLevel } from "./types.js";

/** Standard window in hours for Messenger/Instagram. */
const STANDARD_WINDOW_HOURS = 24;
/** HUMAN_AGENT human-support window in hours (7 days). */
const HUMAN_AGENT_WINDOW_HOURS = 168;
/** Meta global Message Tags deprecation cutoff. */
export const TAG_DEPRECATION_DATE = new Date("2026-02-10T00:00:00Z");
/** Tags ManyChat/Meta accept outside the standard window. */
export const VALID_MESSAGE_TAGS = [
  "CONFIRMED_EVENT_UPDATE",
  "POST_PURCHASE_UPDATE",
  "ACCOUNT_UPDATE",
  "HUMAN_AGENT",
] as const;

const WINDOW_CHANNELS: ReadonlySet<ManyChatChannel> = new Set(["messenger", "instagram"]);

function worst(a: PolicyLevel, b: PolicyLevel): PolicyLevel {
  const order: PolicyLevel[] = ["allow", "warn", "block"];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

export function validateOutboundMessage(ctx: OutboundMessageContext): PolicyVerdict {
  const findings: PolicyFinding[] = [];
  const now = ctx.now ?? new Date();
  const hours = ctx.hoursSinceLastInteraction;
  const withinStandard = typeof hours === "number" && hours <= STANDARD_WINDOW_HOURS;
  const tag = ctx.messageTag;

  if (ctx.hasOptIn === false) {
    findings.push({
      code: "MISSING_OPT_IN",
      level: "warn",
      message: "Subscriber has no recorded opt-in; confirm consent before sending.",
      rule: "opt-in",
    });
  }

  if (ctx.channel === "whatsapp" && !withinStandard) {
    findings.push({
      code: "WA_TEMPLATE_REQUIRED",
      level: "warn",
      message: "WhatsApp outside the 24h window requires an approved template, not a message tag.",
      rule: "whatsapp-template",
    });
  }

  if (WINDOW_CHANNELS.has(ctx.channel) && !withinStandard) {
    if (!tag) {
      findings.push({
        code: "OUTSIDE_WINDOW_NO_TAG",
        level: "block",
        message: "Outside the 24h window with no message tag. Re-engage the subscriber or use a valid tag.",
        rule: "24h-window",
      });
    } else if (!VALID_MESSAGE_TAGS.includes(tag as (typeof VALID_MESSAGE_TAGS)[number])) {
      findings.push({
        code: "INVALID_TAG",
        level: "block",
        message: `Unknown message tag "${tag}". Valid tags: ${VALID_MESSAGE_TAGS.join(", ")}.`,
        rule: "message-tags",
      });
    } else if (tag === "HUMAN_AGENT") {
      if (typeof hours === "number" && hours > HUMAN_AGENT_WINDOW_HOURS) {
        findings.push({
          code: "HUMAN_AGENT_WINDOW_EXPIRED",
          level: "block",
          message: "HUMAN_AGENT only covers a 7-day (168h) human-support window, which has passed.",
          rule: "human-agent",
        });
      }
    } else {
      // valid standard tag
      if (ctx.promotional) {
        findings.push({
          code: "PROMO_UNDER_NONPROMO_TAG",
          level: "block",
          message: `Message tag "${tag}" must not carry promotional content. This violates Meta policy.`,
          rule: "tag-promotional",
        });
      }
      if (now >= TAG_DEPRECATION_DATE) {
        findings.push({
          code: "TAG_DEPRECATED",
          level: "warn",
          message: "Standard message tags are deprecated for Messenger after 2026-02-10. Prefer HUMAN_AGENT or re-engagement.",
          rule: "tag-deprecation",
        });
      }
    }
  }

  const level = findings.reduce<PolicyLevel>((acc, f) => worst(acc, f.level), "allow");
  return { level, allowed: level !== "block", findings };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node -e "require('child_process').execSync('npx vitest run tests/policy/messaging-window.test.ts', {stdio:'inherit'})"`
Expected: PASS — all assertions green.

- [ ] **Step 6: Typecheck + full suite**

Run: `node -e "require('child_process').execSync('npx tsc --noEmit && npx vitest run', {stdio:'inherit'})"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/policy/types.ts src/policy/messaging-window.ts tests/policy/messaging-window.test.ts
git commit -m "feat(policy): add Meta messaging-window validation engine (GNO-manychat)"
```

---

### Task 2: `validate_message` MCP tool

**Files:**
- Create: `src/tools/policy.ts`
- Modify: `src/server.ts:7-35` (import + register)
- Test: `tests/policy/validate-tool.test.ts`

**Interfaces:**
- Consumes: `validateOutboundMessage`, `ToolRegistrationOptions`, `isToolAllowed`.
- Produces: `function registerPolicyTools(server: McpServer, options?: ToolRegistrationOptions): void` and a registered tool named `validate_message` returning JSON `{ level, allowed, findings }` as text content.

- [ ] **Step 1: Write the failing test `tests/policy/validate-tool.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPolicyTools } from "../../src/tools/policy.js";

function getTool(server: McpServer, name: string): any {
  // McpServer keeps registered tools on an internal registry; access via the public list.
  const reg = (server as unknown as { _registeredTools: Record<string, any> })._registeredTools;
  return reg[name];
}

describe("validate_message tool", () => {
  it("registers and blocks an outside-window no-tag send", async () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    registerPolicyTools(server);
    const tool = getTool(server, "validate_message");
    expect(tool).toBeDefined();
    const res = await tool.callback({ channel: "messenger", hours_since_last_interaction: 48 });
    const payload = JSON.parse(res.content[0].text);
    expect(payload.allowed).toBe(false);
    expect(payload.findings.map((f: any) => f.code)).toContain("OUTSIDE_WINDOW_NO_TAG");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node -e "require('child_process').execSync('npx vitest run tests/policy/validate-tool.test.ts', {stdio:'inherit'})"`
Expected: FAIL — cannot find module `../../src/tools/policy.js`.

- [ ] **Step 3: Write `src/tools/policy.ts`**

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { isToolAllowed, type ToolRegistrationOptions } from "../hosted/capabilities.js";
import { validateOutboundMessage } from "../policy/messaging-window.js";

export function registerPolicyTools(
  server: McpServer,
  options: ToolRegistrationOptions = {},
) {
  if (!isToolAllowed("validate_message", options)) return;
  server.tool(
    "validate_message",
    "Validate an outbound ManyChat message against Meta policy (24h window, message tags, HUMAN_AGENT, opt-in) BEFORE sending. Returns allowed=false when a send would violate policy.",
    {
      channel: z
        .enum(["messenger", "instagram", "whatsapp", "sms", "email", "telegram"])
        .describe("Channel the message will be sent on"),
      hours_since_last_interaction: z
        .number()
        .optional()
        .describe("Hours since the subscriber last interacted. Omit if unknown (treated as outside window)."),
      message_tag: z.string().optional().describe("Intended message tag, if any"),
      promotional: z.boolean().optional().describe("True if content is promotional/marketing"),
      has_opt_in: z.boolean().optional().describe("Whether the subscriber has a recorded opt-in"),
    },
    async ({ channel, hours_since_last_interaction, message_tag, promotional, has_opt_in }) => {
      const verdict = validateOutboundMessage({
        channel,
        hoursSinceLastInteraction: hours_since_last_interaction,
        messageTag: message_tag,
        promotional,
        hasOptIn: has_opt_in,
      });
      return { content: [{ type: "text", text: JSON.stringify(verdict, null, 2) }] };
    },
  );
}
```

- [ ] **Step 4: Wire into `src/server.ts`**

Add import after line 8 (`registerPageTools`):
```typescript
import { registerPolicyTools } from "./tools/policy.js";
```
Add registration after line 33 (`registerPageTools(server, client, { isToolAllowed });`):
```typescript
  registerPolicyTools(server, { isToolAllowed });
```

- [ ] **Step 5: Allow the tool in capability bundles**

Open `src/hosted/capabilities.ts`. Add `"validate_message"` to every bundle's allowed-tool set (it is read-only and safe). Run: `node -e "require('child_process').execSync('grep -n validate_message src/hosted/capabilities.ts', {stdio:'inherit'})"` and confirm it appears in `read_only`, `operator`, `messaging_safe`, and `admin`. If the bundle model is allow-by-default for admin and an explicit list for others, add it to each explicit list.

- [ ] **Step 6: Run tests + typecheck**

Run: `node -e "require('child_process').execSync('npx tsc --noEmit && npx vitest run', {stdio:'inherit'})"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/tools/policy.ts src/server.ts src/hosted/capabilities.ts tests/policy/validate-tool.test.ts
git commit -m "feat(policy): expose validate_message MCP tool"
```

---

### Task 3: Pre-send guard in messaging tools

**Files:**
- Modify: `src/tools/messaging.ts` (both `send_content` and `send_text_message`)
- Test: `tests/policy/send-guard.test.ts`

**Interfaces:**
- Consumes: `validateOutboundMessage`, `ManyChatClient`.
- Produces: send tools that accept optional `within_24h_window?: boolean`, `promotional?: boolean`, `override_policy?: boolean`; they call the engine, **do not** call `client.post` on a `block` verdict (unless `override_policy` is true), and surface findings.

- [ ] **Step 1: Write the failing test `tests/policy/send-guard.test.ts`**

```typescript
import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMessagingTools } from "../../src/tools/messaging.js";

function getTool(server: McpServer, name: string): any {
  const reg = (server as unknown as { _registeredTools: Record<string, any> })._registeredTools;
  return reg[name];
}

function fakeClient() {
  return { post: vi.fn().mockResolvedValue({}) } as any;
}

describe("send guard", () => {
  it("blocks send_text_message outside window with no tag and does not call the API", async () => {
    const server = new McpServer({ name: "t", version: "0.0.0" });
    const client = fakeClient();
    registerMessagingTools(server, client);
    const tool = getTool(server, "send_text_message");
    const res = await tool.callback({ subscriber_id: 1, text: "hi", within_24h_window: false });
    expect(client.post).not.toHaveBeenCalled();
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("OUTSIDE_WINDOW_NO_TAG");
  });

  it("sends when within the window", async () => {
    const server = new McpServer({ name: "t", version: "0.0.0" });
    const client = fakeClient();
    registerMessagingTools(server, client);
    const tool = getTool(server, "send_text_message");
    const res = await tool.callback({ subscriber_id: 1, text: "hi", within_24h_window: true });
    expect(client.post).toHaveBeenCalledOnce();
    expect(res.isError).toBeUndefined();
  });

  it("sends a blocked message anyway when override_policy is true", async () => {
    const server = new McpServer({ name: "t", version: "0.0.0" });
    const client = fakeClient();
    registerMessagingTools(server, client);
    const tool = getTool(server, "send_text_message");
    await tool.callback({ subscriber_id: 1, text: "hi", within_24h_window: false, override_policy: true });
    expect(client.post).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node -e "require('child_process').execSync('npx vitest run tests/policy/send-guard.test.ts', {stdio:'inherit'})"`
Expected: FAIL — tool ignores new params; `client.post` is called on the block case.

- [ ] **Step 3: Add a shared guard helper at the top of `src/tools/messaging.ts`**

Add imports below the existing imports:
```typescript
import { validateOutboundMessage } from "../policy/messaging-window.js";
```
Add this helper above `registerMessagingTools`:
```typescript
function guardSend(opts: {
  within24hWindow?: boolean;
  messageTag?: string;
  promotional?: boolean;
  overridePolicy?: boolean;
}) {
  const verdict = validateOutboundMessage({
    channel: "messenger",
    hoursSinceLastInteraction: opts.within24hWindow ? 1 : 25,
    messageTag: opts.messageTag,
    promotional: opts.promotional,
  });
  if (verdict.level === "block" && !opts.overridePolicy) {
    return {
      blocked: true as const,
      result: {
        isError: true as const,
        content: [
          {
            type: "text" as const,
            text: `BLOCKED by policy: ${JSON.stringify(verdict.findings)}. Pass override_policy=true only if you are certain this is compliant.`,
          },
        ],
      },
    };
  }
  return { blocked: false as const, verdict };
}
```

- [ ] **Step 4: Add params + guard call to `send_text_message`**

In the `send_text_message` zod shape, add after `message_tag`:
```typescript
      within_24h_window: z.boolean().optional().describe("True if the subscriber interacted within the last 24h"),
      promotional: z.boolean().optional().describe("True if this content is promotional/marketing"),
      override_policy: z.boolean().optional().describe("Bypass the policy block. Use only when certain it is compliant."),
```
Replace the handler body so the first lines are:
```typescript
    async ({ subscriber_id, text, message_tag, within_24h_window, promotional, override_policy }) => {
      const guard = guardSend({ within24hWindow: within_24h_window, messageTag: message_tag, promotional, overridePolicy: override_policy });
      if (guard.blocked) return guard.result;
      const data = {
        version: "v2",
        content: { messages: [{ type: "text", text }] },
      };
      const body: Record<string, unknown> = { subscriber_id, data };
      if (message_tag) body.message_tag = message_tag;
      await client.post("/sending/sendContent", body);
      return { content: [{ type: "text", text: `Text message sent to subscriber ${subscriber_id}.` }] };
    },
```

- [ ] **Step 5: Add the same params + guard to `send_content`**

In the `send_content` zod shape add the same three optional fields (`within_24h_window`, `promotional`, `override_policy`). At the start of its handler add:
```typescript
      const guard = guardSend({ within24hWindow: within_24h_window, messageTag: message_tag, promotional, overridePolicy: override_policy });
      if (guard.blocked) return guard.result;
```
and add `within_24h_window, promotional, override_policy` to the destructured handler args.

- [ ] **Step 6: Run the guard test + full suite + typecheck**

Run: `node -e "require('child_process').execSync('npx tsc --noEmit && npx vitest run', {stdio:'inherit'})"`
Expected: PASS (new guard tests green, all prior tests green).

- [ ] **Step 7: Commit**

```bash
git add src/tools/messaging.ts tests/policy/send-guard.test.ts
git commit -m "feat(policy): guard send tools with pre-send policy validation"
```

---

## Self-Review

**Spec coverage:** Implements spec §5 "knowledge + validation layer" — `validate_message` tool (✓), pre-send guard that blocks policy violations (✓), encoded Meta rules: 24h window, message tags, HUMAN_AGENT 7-day, tag deprecation 2026-02-10, promo-under-tag, opt-in, WhatsApp template note (✓). Deferred to follow-up plans (out of scope here, noted): `validate_flow`, searchable knowledge corpus, closed-loop debug tool, CLI `manychat validate` command, agent system-prompt resource.

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every run step shows the exact command + expected result.

**Type consistency:** `validateOutboundMessage`, `OutboundMessageContext`, `PolicyVerdict`, `PolicyFinding`, `PolicyLevel`, `VALID_MESSAGE_TAGS`, `TAG_DEPRECATION_DATE` used identically across Tasks 1–3. Tool param names (`hours_since_last_interaction`, `within_24h_window`, `override_policy`) consistent between tool defs and tests.

**Note for implementer:** Task 2 Step 1 and Task 3 Step 1 access `_registeredTools` to invoke a tool's callback in-process. If the installed `@modelcontextprotocol/sdk` version exposes a different internal shape, adapt the `getTool` helper to the SDK's registry (check `node_modules/@modelcontextprotocol/sdk/dist/.../mcp.js`); the assertions themselves do not change.
