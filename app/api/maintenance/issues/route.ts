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
    const { data, error: queryError } = await ledgerRead(async client => client.from("expense_maintenance_issues")
      .select("id,rule_codes,title,context,finding,recommendation,examples,notes").order("sort_order"));
    if (queryError) throw queryError;
    return Response.json(data, { headers });
  } catch {
    return error("Expense issues could not be loaded.", 503);
  }
}

export async function PATCH(request: Request) {
  if (!expenseMaintenanceEnabled()) return error("Expense issues are unavailable.", 404);
  if (request.headers.get("origin") !== new URL(request.url).origin) return error("Save notes from the Maintenance page.", 403);
  try { await reportUser(); }
  catch { return error("Sign in to save notes.", 401); }
  const input = await request.json().catch(() => null);
  if (!input || typeof input.id !== "string" || !/^[a-z0-9-]{1,80}$/.test(input.id)
      || typeof input.notes !== "string" || input.notes.length > ISSUE_NOTE_LIMIT
      || typeof input.previous !== "string" || input.previous.length > ISSUE_NOTE_LIMIT) {
    return error("Provide an issue and valid review notes.", 400);
  }
  try {
    const { data, error: queryError } = await ledgerRead(async client => client.from("expense_maintenance_issues")
      .update({ notes: input.notes }).eq("id", input.id).eq("notes", input.previous).select("notes").maybeSingle());
    if (queryError) throw queryError;
    if (!data) return error("The saved note changed. Reload the Issues tab before saving again.", 409);
    return Response.json(data, { headers });
  } catch {
    return error("The note could not be saved. Try again.", 503);
  }
}
