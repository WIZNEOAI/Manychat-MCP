import type { Metadata } from "next";
import { docsSections } from "@/lib/site-data";
import { repoBlobUrl, REPO_TREE_BASE } from "@/lib/repo";

export const metadata: Metadata = {
  title: "Documentation",
};

function SourceLink({ path }: { path: string }) {
  return (
    <a
      href={repoBlobUrl(path)}
      target="_blank"
      rel="noreferrer"
      className="brand-link font-medium underline-offset-4 hover:underline"
    >
      View on GitHub →
    </a>
  );
}

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-12">
      <header className="space-y-4">
        <p className="brand-kicker text-xs">Documentation</p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Self-host the ManyChat runtime. Use the paid system when you need operator outcomes.
        </h1>
        <p className="max-w-3xl text-lg leading-8 muted">
          The repository remains the canonical OSS source for CLI, MCP, self-host, and deployment docs.
          The hosted app builds the Revenue Operator layer on top: vault, handoff, reporting, and playbooks.
        </p>
        <p className="text-sm muted">
          Browse all docs in the tree:{" "}
          <a
            href={REPO_TREE_BASE}
            target="_blank"
            rel="noreferrer"
            className="brand-link font-medium underline-offset-4 hover:underline"
          >
            {REPO_TREE_BASE.replace(/^https:\/\//, "")}
          </a>
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {docsSections.map((section) => (
          <section key={section.id} id={section.id} className="card scroll-mt-28 p-6 md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">{section.title}</h2>
              <SourceLink path={section.path} />
            </div>
            <p className="mt-4 max-w-3xl leading-7 muted">{section.body}</p>
            <div className="wiz-pre mt-5 px-4 py-3 text-sm">
              <span className="muted">Source file:</span>{" "}
              <code className="rounded bg-white/[0.08] px-1.5 py-0.5 text-xs text-white/[0.82]">{section.path}</code>
            </div>
            {"extraPaths" in section && section.extraPaths ? (
              <ul className="mt-3 space-y-2 text-sm muted">
                {section.extraPaths.map((path) => (
                  <li key={path}>
                    <SourceLink path={path} />{" "}
                    <code className="text-xs text-white/[0.45]">({path})</code>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
