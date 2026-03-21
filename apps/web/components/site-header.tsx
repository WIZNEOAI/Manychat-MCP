import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Docs" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-black/10 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-black/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-[0.18em] text-black dark:text-white">
          MANYCHAT MCP
        </Link>
        <nav className="flex items-center gap-4 text-sm text-black/70 dark:text-white/70">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 transition hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
