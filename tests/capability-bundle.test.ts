import { describe, expect, it } from "vitest";
import { createToolAllowance } from "../src/hosted/capabilities.js";

describe("capability bundles", () => {
  it("read_only cannot call messaging tools", () => {
    const allow = createToolAllowance("read_only");
    expect(allow("get_page_info")).toBe(true);
    expect(allow("send_text_message")).toBe(false);
    expect(allow("send_content")).toBe(false);
  });

  it("messaging_safe can call send tools", () => {
    const allow = createToolAllowance("messaging_safe");
    expect(allow("send_text_message")).toBe(true);
    expect(allow("send_content")).toBe(true);
  });
});
