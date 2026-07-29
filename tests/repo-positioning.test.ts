import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function readRepoFile(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("repo positioning docs", () => {
  // Guards the positioning, not the wording. Assert the claims the README has to
  // keep making; leave the copy free to change. The earlier version pinned exact
  // sentences and went stale the first time the README was rewritten.
  it("describes the repo as OSS runtime plus paid Revenue Operator", () => {
    const readme = readRepoFile("README.md");

    // The paid product exists and is named.
    expect(readme).toContain("Revenue Operator");
    expect(readme).toContain("## Hosted (Revenue Operator)");

    // The OSS runtime stays free and self-hostable — not a gated demo.
    expect(readme).toMatch(/self-host/i);
    expect(readme).toContain("The OSS runtime is never a gated demo.");
    expect(readme).toContain("## Self-host the gateway");

    // The differentiator we actually defend.
    expect(readme).toContain("## The policy wedge");
    expect(readme).toMatch(/validate_message/);
  });

  // Same principle as above: assert the claims, not the sentences. This block used to
  // pin two exact strings, one of which described `apps/web` — a directory that left
  // for its own repository, which made the assertion outlive the thing it guarded.
  it("keeps contribution guidance explicit about the OSS story", () => {
    const contributing = readRepoFile("CONTRIBUTING.md");

    // Contributions to the runtime are wanted.
    expect(contributing).toMatch(/We welcome improvements to the OSS runtime/);

    // The paid half is out of scope here, and readers are told where it went.
    expect(contributing).toMatch(/\*\*Out of scope\*\*/);
    expect(contributing).toMatch(/control plane/i);
    expect(contributing).toMatch(/private repository/i);

    // The line that actually protects the project: this repo stands alone.
    expect(contributing).toContain("This repository must keep working entirely on its own.");
  });

  // The pricing table used to live in the README, guarded by a test that shipped with
  // the control plane. An unenforceable number in a public README is a promise that
  // rots, so the rule is now mechanical: name the tiers, state no figures.
  it("states no hosted prices or quotas it cannot enforce", () => {
    for (const file of ["README.md", "README.es.md"]) {
      const text = readRepoFile(file);

      // No currency amounts.
      expect(text, `${file} must not quote a price`).not.toMatch(/\$\s?\d/);
      // No request quotas, in either locale's thousands separator.
      expect(text, `${file} must not quote a quota`).not.toMatch(
        /\d[\d.,]*\s*(req|requests)\s*\/?\s*(mo|month|día|day|mes)/i,
      );
      // The tiers may still be named — that is positioning, not an enforceable claim.
      expect(text).toMatch(/Supporter/);
      expect(text).toMatch(/Pro\b/);
    }
  });

  it("frames the roadmap as OSS core plus paid system", () => {
    const roadmap = readRepoFile("ROADMAP.md");

    expect(roadmap).toContain("Revenue Operator");
    expect(roadmap).toContain("OSS self-host runtime");
    expect(roadmap).toContain("operator product framing");
  });
});
