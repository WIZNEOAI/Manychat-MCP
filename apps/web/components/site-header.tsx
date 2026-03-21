import Link from "next/link";
import { REPO_TREE_BASE } from "@/lib/repo";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Docs" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-black/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="group flex flex-col leading-tight">
          <span className="text-xs font-semibold tracking-[0.22em] text-black dark:text-white">MANYCHAT</span>
          <span className="text-[11px] text-black/50 transition group-hover:text-black/70 dark:text-white/50 dark:group-hover:text-white/70">
            CLI + MCP
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm text-black/70 dark:text-white/70 sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 transition hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={REPO_TREE_BASE}
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-3 py-1.5 font-medium text-emerald-800 transition hover:bg-emerald-500/10 dark:text-emerald-200"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
