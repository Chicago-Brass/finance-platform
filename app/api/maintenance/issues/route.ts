import { expenseMaintenanceEnabled, ISSUE_NOTE_LIMIT } from "@/lib/progress/expense-issues";
import { ledgerRead, reportUser } from "@/lib/reports/report-session";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const error = (message: string, status: number) => Response.json({ error: message }, { status, headers });

export async function GET() {
  if (!expenseMaintenanceEnabled()) return error("Expense issues are unavailable.", 404);
  try { await reportUser(); }
  catch { return error("Sign in to view expense issues.", 401); }
  try {
    const data = await ledgerRead(async client => {
      const [issues, catalog] = await Promise.all([
        client.from("expense_maintenance_issues")
          .select("id,rule_codes,title,context,finding,recommendation,examples,notes,resolved").order("sort_order"),
        client.from("ledger_rules").select("display_code,trigger_name,source_label")
          .eq("category", "expense").is("retired_at", null),
      ]);
      if (issues.error || catalog.error) throw new Error("Expense review lookup failed.");
      const rules = new Map(catalog.data.map(rule => [rule.display_code, rule]));
      return issues.data.map(({ rule_codes, ...issue }) => ({
        ...issue,
        rules: rule_codes.map((code: string) => {
          const rule = rules.get(code);
          return { code, trigger: rule?.trigger_name ?? null, source: rule?.source_label ?? null };
        }),
      }));
    });
    return Response.json(data, { headers });
  } catch {
    return error("Expense issues could not be loaded.", 503);
  }
}

async function issueWrite(request: Request) {
  if (!expenseMaintenanceEnabled()) return error("Expense issues are unavailable.", 404);
  if (request.headers.get("origin") !== new URL(request.url).origin) return error("Save changes from the Maintenance page.", 403);
  try { await reportUser(); }
  catch { return error("Sign in to update this issue.", 401); }
  const input = await request.json().catch(() => null);
  if (!input || typeof input.id !== "string" || !/^[a-z0-9-]{1,80}$/.test(input.id)) {
    return error("Provide a valid issue.", 400);
  }
  return input as { id: string; note?: unknown; resolved?: unknown };
}

export async function POST(request: Request) {
  const input = await issueWrite(request);
  if (input instanceof Response) return input;
  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (!note || note.length > ISSUE_NOTE_LIMIT) return error("Provide a valid note.", 400);
  try {
    const { data: notes, error: queryError } = await ledgerRead(async client => client.rpc(
      "append_expense_issue_note", { issue_id: input.id, note_text: note }));
    if (queryError) throw queryError;
    if (notes === null) return error("This issue is unavailable.", 404);
    return Response.json({ notes }, { headers });
  } catch {
    return error("The note could not be saved. Try again.", 503);
  }
}

export async function PATCH(request: Request) {
  const input = await issueWrite(request);
  if (input instanceof Response) return input;
  if (typeof input.resolved !== "boolean") return error("Provide a valid resolution status.", 400);
  const resolved = input.resolved;
  try {
    const { data, error: queryError } = await ledgerRead(async client => client.from("expense_maintenance_issues")
      .update({ resolved }).eq("id", input.id).select("resolved").maybeSingle());
    if (queryError) throw queryError;
    if (!data) return error("This issue is unavailable.", 404);
    return Response.json(data, { headers });
  } catch {
    return error("The issue status could not be saved. Try again.", 503);
  }
}
