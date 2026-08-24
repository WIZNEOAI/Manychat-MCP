import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function readRepoFile(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

/**
 * Same file, flattened for phrase matching: markdown hard-wraps sentences, and
 * inside a blockquote the continuation carries a `>` marker — so a phrase can be
 * split by "\n> " and no whitespace-only pattern will find it. Matching prose
 * should be about content, not about where the author's line breaks landed.
 */
function readProse(path: string) {
  return readRepoFile(path)
    .replace(/^\s*>\s?/gm, "")
    .replace(/\s+/g, " ");
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

  // The documented install command and the published package name are the same
  // fact stored in two files. A rename touching only one ships a README whose
  // very first command fails.
  it("documents an install command that matches the package name", () => {
    const pkg = JSON.parse(readRepoFile("package.json")) as {
      name: string;
      bin: Record<string, string>;
    };

    expect(pkg.bin).toHaveProperty(pkg.name);

    for (const file of ["README.md", "README.es.md"]) {
      const text = readRepoFile(file);
      expect(text, `${file} must show npx ${pkg.name}`).toContain(`npx ${pkg.name} connect`);
      expect(text, `${file} agent config must use ${pkg.name}`).toContain(`"${pkg.name}"`);
    }
  });

  // This repo is the product; the hosted plane is the convenience. A reader who
  // wants to run it themselves must reach the one command before they are sold
  // anything — and the hosted link still has to be above the long onboarding,
  // or the people who never wanted a server read the whole key-management
  // section to find out they did not need it.
  //
  // Reversed on 2026-08-24: this test used to assert the opposite order.
  it("puts the run-it-yourself command above the hosted call to action", () => {
    for (const file of ["README.md", "README.es.md"]) {
      const text = readRepoFile(file);
      const runCommand = text.indexOf("npx mcp-manychat connect");
      const hosted = text.indexOf("manychat.wizneo.org");
      const onboarding = text.search(/^### (Step 1|Paso 1)/m);

      expect(runCommand, `${file} must show the run command`).toBeGreaterThan(-1);
      expect(hosted, `${file} must keep linking the hosted plane`).toBeGreaterThan(-1);
      expect(onboarding, `${file} must keep the onboarding steps`).toBeGreaterThan(-1);

      expect(runCommand, `${file} buries the OSS command below the funnel`).toBeLessThan(
        hosted,
      );
      expect(hosted, `${file} buries the hosted CTA below onboarding`).toBeLessThan(
        onboarding,
      );
    }
  });

  // Losing the ManyChat key is the most common way onboarding fails, and "shown
  // once" is the warning that prevents it.
  it("warns in both languages that the ManyChat key is shown once", () => {
    expect(readProse("README.md")).toMatch(/shown once/i);
    expect(readProse("README.es.md")).toMatch(/una sola vez/i);
  });
});

describe("licence notice", () => {
  // AGPL does not forbid commercial use — it forces source disclosure for network
  // use, and on its own reserves nothing about trademarks. Both halves have to be
  // stated, in both languages, or the notice misleads a reader (or us) about what
  // protection actually exists.
  it("states the network clause and the trademark reservation in both languages", () => {
    const notice = readProse("NOTICE.md");

    expect(notice).toMatch(/## English/);
    expect(notice).toMatch(/## Español/);

    // The network clause — the reason AGPL was chosen over MIT.
    expect(notice).toMatch(/network\s+service/i);
    expect(notice).toMatch(/servicio\s+de\s+red/i);

    // Trademarks, reserved separately from copyright.
    expect(notice).toMatch(/trademark/i);
    expect(notice).toMatch(/licencia\s+de\s+marca/i);
    for (const mark of ["Gnosix", "WIZNEO", "Revenue Operator"]) {
      expect(notice, `${mark} must be reserved`).toContain(mark);
    }

    // Never claim the licence bans commercial use. It does not.
    expect(notice).toMatch(/including\s+commercially/i);
    expect(notice).toMatch(/incluso\s+comercialmente/i);

    // Not legal advice, and the licence text wins on conflict.
    expect(notice).toMatch(/not\s+legal\s+advice/i);
    expect(notice).toMatch(/no\s+asesoría\s+legal/i);
  });

  it("disclaims affiliation with ManyChat where a reader will see it", () => {
    for (const file of ["README.md", "README.es.md", "NOTICE.md"]) {
      expect(readProse(file), `${file} must disclaim affiliation`).toMatch(
        /not affiliated|no afiliado/i,
      );
    }
  });
});
