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

  it("keeps contribution guidance explicit about the OSS story", () => {
    const contributing = readRepoFile("CONTRIBUTING.md");

    expect(contributing).toContain(
      "We welcome improvements to the OSS runtime, docs, deployment guides, and safe operator workflows.",
    );
    expect(contributing).toContain(
      "Changes to the paid product surfaces should still preserve the self-host story and keep the repo useful for the community.",
    );
  });

  it("frames the roadmap as OSS core plus paid system", () => {
    const roadmap = readRepoFile("ROADMAP.md");

    expect(roadmap).toContain("Revenue Operator");
    expect(roadmap).toContain("OSS self-host runtime");
    expect(roadmap).toContain("operator product framing");
  });
});
