import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type AccentCardProps = {
  children: ReactNode;
  className?: string;
};

export function AccentCard({ children, className = "" }: AccentCardProps) {
  return (
    <div className={`premium-shell ${className}`}>
      <div className="premium-core h-full">{children}</div>
    </div>
  );
}

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  body?: string;
  align?: "left" | "split";
};

export function SectionHeader({ eyebrow, title, body, align = "left" }: SectionHeaderProps) {
  return (
    <div
      className={
        align === "split"
          ? "grid gap-4 md:grid-cols-[0.85fr_1.15fr] md:items-end"
          : "max-w-3xl space-y-3"
      }
    >
      <div className="space-y-3">
        <p className="brand-kicker text-xs">{eyebrow}</p>
        <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-5xl md:leading-[1.04]">
          {title}
        </h2>
      </div>
      {body ? <p className="max-w-3xl text-lg leading-8 muted">{body}</p> : null}
    </div>
  );
}

export function PricingBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/64">
      {children}
    </span>
  );
}


type CtaLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function CtaLink({ children, variant = "primary", className = "", ...props }: CtaLinkProps) {
  const variantClass = variant === "primary" ? "wiz-button-primary" : "wiz-button-secondary";
  return (
    <Link {...props} className={`${variantClass} group gap-3 px-5 py-3 text-sm ${className}`}>
      <span>{children}</span>
      <span className="cta-orb" aria-hidden>
        ↗
      </span>
    </Link>
  );
}

type ExternalCtaProps = ComponentPropsWithoutRef<"a"> & {
  children: ReactNode;
};

export function ExternalCta({ children, className = "", ...props }: ExternalCtaProps) {
  return (
    <a {...props} className={`wiz-button-secondary group gap-3 px-5 py-3 text-sm ${className}`}>
      <span>{children}</span>
      <span className="cta-orb" aria-hidden>
        ↗
      </span>
    </a>
  );
}

export function CodeWindow() {
  return (
    <div className="terminal-window">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/38">agent runtime</span>
      </div>
      <div className="space-y-4 p-5 font-mono text-xs leading-6 text-emerald-100/86">
        <p><span className="text-white/35">$</span> manychat doctor --json</p>
        <p className="text-white/45">status: ok · page: gnosixio · pro: true</p>
        <p><span className="text-white/35">$</span> manychat mcp serve --transport http</p>
        <p className="text-white/45">POST /mcp · GET /health · hosted_token ready</p>
        <p><span className="text-white/35">$</span> cursor mcp add manychat</p>
        <p className="text-white/45">bearer token scoped to workspace + bundle</p>
      </div>
    </div>
  );
}
