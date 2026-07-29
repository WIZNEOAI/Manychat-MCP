"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "created" | "already_on_list" | "error";

const FIELD =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-sm text-[#e8ecea] placeholder:text-white/28 outline-none transition-colors duration-200 focus-visible:border-[#2de2c0]/60 focus-visible:ring-2 focus-visible:ring-[#2de2c0]/25";

export function WaitlistForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const pending = status === "submitting";
  const done = status === "created" || status === "already_on_list";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          name: data.get("name"),
          useCase: data.get("useCase"),
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        outcome?: Status;
        error?: string;
      };

      if (!res.ok) {
        setStatus("error");
        setMessage(payload.error ?? "Something went wrong. Try again.");
        return;
      }

      setStatus(payload.outcome === "already_on_list" ? "already_on_list" : "created");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Network error. Check your connection and try again.");
    }
  }

  return (
    <div className="terminal-window">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/38">
          early access
        </span>
      </div>

      <div className="p-5">
        <p className="mb-5 font-mono text-xs leading-6 text-emerald-100/86">
          <span className="text-white/35">$</span> operator waitlist --join
        </p>

        {done ? (
          <div role="status" aria-live="polite" className="space-y-2">
            <p className="font-mono text-sm text-[#2de2c0]">
              {status === "created" ? "→ you're on the list" : "→ already on the list"}
            </p>
            <p className="text-sm leading-6 muted">
              {status === "created"
                ? "Check your inbox for a confirmation. Reply to it and tell me what you want to automate — I read every one."
                : "That email is already registered. You'll hear from me when access opens."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="waitlist-name" className="block font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
                  Name <span className="normal-case tracking-normal text-white/28">(optional)</span>
                </label>
                <input id="waitlist-name" name="name" type="text" autoComplete="name" className={FIELD} placeholder="Ulises" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="waitlist-email" className="block font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
                  Email
                </label>
                <input
                  id="waitlist-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className={FIELD}
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="waitlist-usecase" className="block font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
                What do you want to automate? <span className="normal-case tracking-normal text-white/28">(optional)</span>
              </label>
              <input
                id="waitlist-usecase"
                name="useCase"
                type="text"
                className={FIELD}
                placeholder="Recover leads that went cold in Instagram DMs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button type="submit" disabled={pending} className="wiz-button-primary gap-3 px-5 py-3 text-sm disabled:opacity-60">
                <span>{pending ? "Joining…" : "Join the waitlist"}</span>
                <span className="cta-orb" aria-hidden>
                  ↗
                </span>
              </button>
              <p className="text-xs muted">No spam. One email when access opens.</p>
            </div>

            {status === "error" ? (
              <p role="alert" className="font-mono text-xs text-[#fb7185]">
                → {message}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
}
