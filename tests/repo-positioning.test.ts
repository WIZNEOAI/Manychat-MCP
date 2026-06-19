import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function readRepoFile(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("repo positioning docs", () => {
  it("describes the repo as OSS wedge plus Revenue Ops product", () => {
    const readme = readRepoFile("README.md");

    expect(readme).toContain("Revenue Ops System");
    expect(readme).toContain("keep the OSS runtime broadly usable");
    expect(readme).toContain("Revenue Operator");
    expect(readme).toContain("## OSS vs paid product");
    expect(readme).toContain("- Paid product: operator dashboard, vault, playbooks, routing, handoff, reporting");
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
