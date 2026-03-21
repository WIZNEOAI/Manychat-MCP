const sections = [
  {
    id: "railway",
    title: "Railway",
    body:
      "Use the explicit production command `npm run start:mcp:http`, honor `PORT`, and keep the service single-replica in Phase 0.",
    path: "docs/deploy/railway.md",
  },
  {
    id: "vps-docker",
    title: "VPS + Docker",
    body:
      "Ship the same HTTP MCP entrypoint in Docker, put it behind HTTPS, and use Redis only when production OAuth is enabled.",
    path: "docs/deploy/vps-docker.md",
  },
  {
    id: "clients",
    title: "MCP client setup",
    body:
      "Connect Claude, Cursor, Codex, and similar clients through header auth or OAuth, while keeping ManyChat API keys as the execution credential.",
    path: "docs/connect/mcp-clients.md",
  },
] as const;

export default function DocsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">
          Docs shell
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          The web docs should reduce setup friction to nearly zero.
        </h1>
        <p className="max-w-3xl text-lg leading-8 muted">
          Phase 0 keeps the full documentation in the repository. This page is the
          initial frontend shell that will later render those guides directly.
        </p>
      </section>

      <div className="grid gap-5">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="card p-6">
            <h2 className="text-2xl font-semibold">{section.title}</h2>
            <p className="mt-3 max-w-3xl leading-7 muted">{section.body}</p>
            <div className="mt-5 rounded-2xl border border-dashed border-black/10 px-4 py-3 text-sm dark:border-white/10">
              <span className="muted">Current source of truth in the repo:</span>{" "}
              <code>{section.path}</code>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
