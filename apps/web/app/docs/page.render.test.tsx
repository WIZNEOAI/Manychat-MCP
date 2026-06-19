import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DocsPage from "./page";

describe("docs page", () => {
  it("explains the OSS repo and the paid operator system together", () => {
    const html = renderToStaticMarkup(<DocsPage />);

    expect(html).toContain("self-host");
    expect(html).toContain("Revenue Operator");
    expect(html).toContain("GitHub");
  });
});
