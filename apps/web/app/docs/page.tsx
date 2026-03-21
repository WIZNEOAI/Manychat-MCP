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
      className="font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
    >
      View on GitHub →
    </a>
  );
}

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-12">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">Documentation</p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Ship ManyChat automation for agents—CLI-first, MCP when you need it.
        </h1>
        <p className="max-w-3xl text-lg leading-8 muted">
          The canonical guides live in the repository. Use this page as a map: deploy remote MCP,
          connect clients, and read the hosted control-plane specs when you are ready for teams.
        </p>
        <p className="text-sm muted">
          Browse all docs in the tree:{" "}
          <a
            href={REPO_TREE_BASE}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
          >
            github.com/gnosix/manychat-mcp
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
            <div className="mt-5 rounded-2xl border border-black/8 bg-black/[0.02] px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
              <span className="muted">Source file:</span>{" "}
              <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs dark:bg-white/10">{section.path}</code>
            </div>
            {"extraPaths" in section && section.extraPaths ? (
              <ul className="mt-3 space-y-2 text-sm muted">
                {section.extraPaths.map((path) => (
                  <li key={path}>
                    <SourceLink path={path} />{" "}
                    <code className="text-xs text-black/50 dark:text-white/50">({path})</code>
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
