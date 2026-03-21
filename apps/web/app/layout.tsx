import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ManyChat MCP",
  description:
    "CLI-first ManyChat toolkit with remote MCP, self-host deployment docs, and the initial control-plane frontend scaffold.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-black/10 px-6 py-6 text-sm text-black/60 dark:border-white/10 dark:text-white/60">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p>CLI-first ManyChat tooling. MCP is the compatibility and remote access layer.</p>
              <p>Self-host now. Hosted control plane next.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
