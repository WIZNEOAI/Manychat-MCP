import { describe, expect, it } from "vitest";
import { heroContent, offerTiers, ossStory } from "./positioning";

describe("Revenue OS positioning", () => {
  it("states the operator-first promise instead of generic MCP copy", () => {
    expect(heroContent.title).toContain("Your leads already exist");
    expect(heroContent.body).toContain("do not go cold");
    expect(heroContent.railLabels).toContain("ManyChat");
    expect(heroContent.railLabels).toContain("WhatsApp / Capso");
  });

  it("defines the commercial ladder with Revenue Operator as the primary offer", () => {
    const operator = offerTiers.find((tier) => tier.name === "Revenue Operator");
    expect(operator).toMatchObject({
      setupPrice: "$3,500",
      monthlyPrice: "$750/mo",
      badge: "Recommended",
    });
  });

  it("keeps the OSS wedge explicit", () => {
    expect(ossStory.title).toContain("OSS");
    expect(ossStory.bullets).toContain("CLI + MCP");
  });
});
