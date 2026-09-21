import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("skills pack", () => {
  const dirs = readdirSync(new URL("../skills", import.meta.url), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("manychat-"))
    .map((entry) => entry.name)
    .sort();

  it("ships manychat-connect with the operator pack", () => {
    expect(dirs).toContain("manychat-connect");
    expect(dirs).toContain("manychat-operator");
    expect(dirs.length).toBe(7);
  });

  it("connect skill wires stdio and never points at the public gateway", () => {
    const skill = read("skills/manychat-connect/SKILL.md");
    const clients = read("skills/manychat-connect/references/clients.md");
    const blob = `${skill}\n${clients}`;

    expect(skill).toMatch(/^---\nname: manychat-connect\n/m);
    expect(blob).toContain("npx -y mcp-manychat mcp serve --transport stdio");
    expect(blob).toContain("validate_message");
    expect(blob).toContain("https://mc-mcp.wizneo.org");
    expect(clients).not.toContain("https://mcp.wizneo.org");
    expect(skill).toMatch(/Do \*\*not\*\* send the user to `https:\/\/mcp\.wizneo\.org`/);
    expect(skill).toMatch(/There is \*\*no\*\* `recover_lead` tool or prompt/);
    expect(clients).not.toContain("recover_lead");
    expect(read("src/prompts/index.ts")).not.toContain("recover_lead");
    for (const client of ["Claude Code", "Cursor", "Codex", "OpenCode", "Claude Desktop", "Hermes"]) {
      expect(clients, client).toContain(client);
    }
  });

  it("lists connect first in the pack map", () => {
    const map = read("skills/README.md");
    expect(map.indexOf("manychat-connect")).toBeGreaterThan(-1);
    expect(map.indexOf("manychat-connect")).toBeLessThan(map.indexOf("manychat-operator"));
  });
});
