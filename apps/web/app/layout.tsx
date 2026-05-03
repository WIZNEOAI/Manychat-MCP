import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "ManyChat CLI + MCP",
    template: "%s · ManyChat CLI + MCP",
  },
  description:
    "CLI-first ManyChat toolkit for operators and agents: JSON automation, local and remote MCP, self-host docs, and a web shell for the future hosted control plane.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
          <footer className="border-t border-black/10 px-6 py-8 text-sm text-black/60 dark:border-white/10 dark:text-white/60">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="max-w-xl leading-6">
                Open-source core: bring your ManyChat API key, run the CLI, or expose MCP. Hosted adds vaulting and
                product tokens—not a replacement runtime.
              </p>
              <p className="text-black/50 dark:text-white/50">AGPL v3 · Self-host ready · Hosted roadmap</p>
            </div>
          </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
