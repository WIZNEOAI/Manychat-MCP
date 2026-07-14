import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardLoadedView } from "./dashboard-loaded-view";

const currentDir = dirname(fileURLToPath(import.meta.url));
const readSource = (path: string) => readFileSync(path, "utf8");

describe("Dashboard loaded-view split", () => {
  it("owns the responsive loaded dashboard frame without data hooks", () => {
    const html = renderToStaticMarkup(
      <DashboardLoadedView>
        <section>Revenue operator fixture</section>
      </DashboardLoadedView>,
    );
    const source = readSource(join(currentDir, "dashboard-loaded-view.tsx"));

    expect(html).toContain('data-testid="dashboard-loaded-view"');
    expect(html).toContain(
      'class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12"',
    );
    expect(html).toContain("Revenue operator fixture");
    expect(source).not.toMatch(/convex\/react|useQuery|useMutation|useAction|fetch\(/);
  });

  it("keeps controller behavior intact while delegating only the outer frame", () => {
    const client = readSource(join(currentDir, "dashboard-client.tsx"));

    expect(client).toContain("DashboardLoadedView");
    expect(client).toContain('viewer === undefined');
    expect(client).toContain('? "Loading..."');
    expect(client).toContain("useQuery(api.dashboard.viewer)");
    expect(client).toContain("useMutation(api.users.ensureCurrentUser)");
  });
});
