import { createHash } from "node:crypto";

/**
 * Waitlist leads live in the Gnosix Supabase `public.leads` table with
 * `brand='wizneo'`, alongside the rest of the WIZNEO funnel (reto, newsletter,
 * blog). They are deliberately NOT stored in this product's Convex: `convex/leads.ts`
 * holds the *tenant's* CRM leads, which is a different concept and a different owner.
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IP_HASH_SALT = process.env.WAITLIST_IP_HASH_SALT ?? "";

export const WAITLIST_TAXONOMY = {
  brand: "wizneo",
  lead_source: "revenue_operator_waitlist",
  source: "manychat_mcp_landing",
  channel: "landing",
  program: "revenue_operator",
  offer_interest: "revenue_operator_waitlist",
  status: "new",
} as const;

export type WaitlistInput = {
  email: string;
  name?: string;
  company?: string;
  useCase?: string;
};

export type WaitlistOutcome = "created" | "already_on_list";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length < 5 || email.length > 254) return null;
  if (!EMAIL_RE.test(email)) return null;
  return email;
}

function clean(raw: unknown, max: number): string | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim().slice(0, max);
  return value.length > 0 ? value : undefined;
}

export function parseWaitlistInput(body: unknown): WaitlistInput | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const email = normalizeEmail(record.email);
  if (!email) return null;
  return {
    email,
    name: clean(record.name, 120),
    company: clean(record.company, 120),
    useCase: clean(record.useCase, 500),
  };
}

/** Salted so a leaked row cannot be reversed to a visitor's IP. */
export function hashIp(ip: string | null): string | null {
  if (!ip || !IP_HASH_SALT) return null;
  return createHash("sha256").update(`${IP_HASH_SALT}:${ip}`).digest("hex");
}

function assertConfigured(): { url: string; key: string } {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Waitlist storage is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return { url: SUPABASE_URL.replace(/\/+$/, ""), key: SUPABASE_SERVICE_ROLE_KEY };
}

async function findExisting(email: string): Promise<boolean> {
  const { url, key } = assertConfigured();
  const query = new URLSearchParams({
    select: "id",
    email: `eq.${email}`,
    brand: `eq.${WAITLIST_TAXONOMY.brand}`,
    lead_source: `eq.${WAITLIST_TAXONOMY.lead_source}`,
    limit: "1",
  });
  const res = await fetch(`${url}/rest/v1/leads?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase lookup failed (${res.status})`);
  const rows = (await res.json()) as unknown[];
  return Array.isArray(rows) && rows.length > 0;
}

export async function saveWaitlistLead(
  input: WaitlistInput,
  context: { ipHash: string | null },
): Promise<WaitlistOutcome> {
  const { url, key } = assertConfigured();

  if (await findExisting(input.email)) return "already_on_list";

  const row = {
    ...WAITLIST_TAXONOMY,
    email: input.email,
    name: input.name ?? null,
    company: input.company ?? null,
    notes: input.useCase ?? null,
    metadata: {
      ...(context.ipHash ? { ip_hash: context.ipHash } : {}),
      ...(input.useCase ? { use_case: input.useCase } : {}),
      captured_at: new Date().toISOString(),
    },
  };

  const res = await fetch(`${url}/rest/v1/leads`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    throw new Error(`Supabase insert failed (${res.status}): ${await res.text()}`);
  }
  return "created";
}
