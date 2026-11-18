import { todayChicago } from "@/lib/dates";
import { reportUser } from "@/lib/reports/report-session";
import { supabaseConfig } from "@/lib/supabase/config";

export const maxDuration = 120;
const headers = { "Cache-Control": "private, no-store" };
const startDate = "2026-11-17";
const dashboardKey = /^scheduled:dashboard:(\d{4}-\d{2}-\d{2}):[0-9a-f-]{36}$/;

export async function POST(request: Request) {
  const json = (body: object, status = 200) => Response.json(body, { status, headers });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return json({ error: "Use this site's Update Ledger button." }, 403);
  }
  try { await reportUser(); }
  catch { return json({ error: "Sign in to update the ledger." }, 401); }

  const secret = process.env.LEDGER_WEBHOOK_SECRET;
  const { url } = supabaseConfig();
  if (!secret || new URL(url).hostname !== "inzobaubbikyiekcfarj.supabase.co") {
    return json({ error: "On-demand ledger updates are not configured here." }, 503);
  }
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return json({ error: "Invalid ledger update request." }, 400);
  }

  const today = todayChicago();
  const runKey = input.runKey ?? `scheduled:dashboard:${today}:${crypto.randomUUID()}`;
  const match = typeof runKey === "string" ? dashboardKey.exec(runKey) : null;
  const toDate = match?.[1];
  if (!toDate || toDate < startDate || toDate > today || !Number.isFinite(Date.parse(toDate)) ||
      new Date(toDate).toISOString().slice(0, 10) !== toDate) {
    return json({ error: "Invalid ledger update run." }, 400);
  }

  try {
    // The scheduled prefix lets the production dispatcher resume this run if the dashboard closes.
    const response = await fetch(new URL("/functions/v1/ledger-daily", url), {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "x-ledger-secret": secret, "x-region": "us-west-2" },
      body: JSON.stringify({ runKey, dryRun: false, maxRecords: 50, fromDate: startDate, toDate }),
      signal: AbortSignal.timeout(105_000),
    });
    const result = await response.json();
    if (response.status === 409) {
      if (input.runKey && result.runKey === runKey) return json({ runKey, busy: true }, 202);
      return json({ error: "A ledger update is already running." }, 409);
    }
    if (!response.ok || typeof result.done !== "boolean" || result.runKey !== runKey ||
        !Number.isInteger(result.stats?.posted) || !Number.isInteger(result.stats?.errors)) {
      return json({ error: "The ledger update could not be confirmed. Check Progress before trying again." }, 503);
    }
    return json({ runKey, done: result.done, posted: result.stats.posted, errors: result.stats.errors }, result.done ? 200 : 202);
  } catch {
    return json({ error: "The ledger update could not be confirmed. Check Progress before trying again." }, 503);
  }
}
