import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("repo positioning docs", () => {
  it("describes the repo as OSS wedge plus Revenue Ops product", () => {
    const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

    expect(readme).toContain("Revenue Ops System");
    expect(readme).toContain("keep the OSS runtime broadly usable");
    expect(readme).toContain("Revenue Operator");
  });
});
