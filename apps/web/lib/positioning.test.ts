import { describe, expect, it } from "vitest";
import { heroContent, offerTiers, ossStory } from "./positioning";

describe("Revenue OS positioning", () => {
  it("leads with the builder-first hero promise", () => {
    expect(heroContent.title).toContain("ManyChat superpowers");
    expect(heroContent.railLabels).toContain("Claude");
    expect(heroContent.railLabels).toContain("Codex");
  });

  it("derives the commercial ladder from the canonical SaaS tiers", () => {
    expect(offerTiers.map((tier) => tier.name)).toEqual(["Free", "Supporter", "Pro"]);
    const supporter = offerTiers.find((tier) => tier.name === "Supporter");
    expect(supporter).toMatchObject({
      monthlyPrice: "$20/mo",
      annualPrice: "$209/year",
      badge: "Recommended",
    });
    const pro = offerTiers.find((tier) => tier.name === "Pro");
    expect(pro).toMatchObject({ monthlyPrice: "$79/mo", annualPrice: "$790/year" });
  });

  it("keeps the OSS wedge explicit", () => {
    expect(ossStory.title).toContain("OSS");
    expect(ossStory.bullets).toContain("CLI + MCP");
  });
});
