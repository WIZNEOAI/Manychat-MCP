import { docsSections } from "@/lib/site-data";

export function DocsSidebar() {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">On this page</p>
      <nav className="mt-4 flex flex-col gap-1 text-sm">
        {docsSections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-lg px-3 py-2 transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            {section.title}
          </a>
        ))}
      </nav>
      <p className="mt-6 text-xs leading-5 muted">
        Full markdown lives in the repo. Links open on GitHub so the site stays lightweight.
      </p>
    </aside>
  );
}
