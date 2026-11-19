import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { periodQueryRange } from "@/lib/periods/ranges";

export const dynamic = "force-dynamic";
const reviewJournals = "journals:journal_entries!journal_entries_posting_request_id_fkey(id,entry_number,status,description,rule_code)";
export async function GET(request: Request) {
  const client = await createClient();
  const { data: auth, error: authError } = await client.auth.getClaims();
  if (authError || !auth?.claims?.email)
    return NextResponse.json(
      { error: "Sign in to view periods." },
      { status: 401 },
    );
  const params = new URL(request.url).searchParams;
  let selection: ReturnType<typeof periodQueryRange>;
  try { selection = periodQueryRange(params); }
  catch (error) { return NextResponse.json({error: error instanceof Error ? error.message : "Choose a valid date range."}, {status: 400}); }
  const {selected, overview} = selection;
  const page = Math.max(1, Math.min(10000, Number(params.get("page")) || 1)),
    from = (Math.floor(page) - 1) * 50;
  const tab = params.get("tab") ?? "posted";
  try {
    const requestId = params.get("requestId");
    if (requestId) {
      if (!/^[0-9a-f-]{36}$/i.test(requestId))
        throw new Error("Invalid request");
      const { data: item, error } = await client
        .from("ledger_posting_requests")
        .select(`*,${reviewJournals}`)
        .eq("id", requestId)
        .single();
      if (error) throw error;
      const [accounts, lines] = await Promise.all([
        client.from("accounts").select("code,name,airtable_record_id"),
        item.kind === "reversal" && !item.journals?.length && item.target_journal_ids.length
          ? client
              .from("journal_lines")
              .select("entry_id,line_no,account_code,debit,credit")
              .in("entry_id", item.target_journal_ids)
              .order("line_no")
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (accounts.error || lines.error) throw new Error("Details unavailable");
      return NextResponse.json(
        { item, accounts: accounts.data, lines: lines.data },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }
    let detail =
      tab === "pending"
        ? client
            .from("ledger_posting_requests")
            .select(
              `id,kind,source_table,source_record_id,event_type,accounting_date,approved_entry_date,status,created_at,reviewed_at,reviewed_by,review_reason,last_error,writeback_pending,payload,${reviewJournals}`,
              { count: "exact" },
            )
            .gte("accounting_date", selected.from)
            .lte("accounting_date", selected.to)
            .neq("status", "superseded")
            .order("created_at", { ascending: false })
            .range(from, from + 49)
        : tab === "history"
          ? client
              .from("ledger_period_history")
              .select("*", { count: "exact" })
              .gte("period_month", selected.from)
              .lte("period_month", selected.to)
              .order("created_at", { ascending: false })
              .range(from, from + 49)
          : client
              .from("journal_entries")
              .select(
                "id,entry_number,entry_date,description,rule_code,posted_at,posting_request_id",
                { count: "exact" },
              )
              .gte("period_month", selected.from)
              .lte("period_month", selected.to)
              .eq("status", "posted")
              .order("entry_number", { ascending: false })
              .range(from, from + 49);
    if (tab === "pending" && params.get("status") !== "all")
      detail = detail.or("status.eq.pending,writeback_pending.eq.true");
    const [membership, periods, rows] = await Promise.all([
      client
        .from("app_users")
        .select("can_manage_periods")
        .eq("email", String(auth.claims.email).toLowerCase())
        .single(),
      client
        .from("v_period_overview")
        .select("*")
        .gte("period_month", overview.from)
        .lte("period_month", overview.to)
        .order("period_month"),
      detail,
    ]);
    if (membership.error || periods.error || rows.error)
      throw new Error("Period query failed");
    return NextResponse.json(
      {
        canManage: membership.data.can_manage_periods,
        periods: periods.data,
        rows: rows.data,
        total: rows.count,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Period data could not be loaded. Please retry." },
      { status: 503 },
    );
  }
}
