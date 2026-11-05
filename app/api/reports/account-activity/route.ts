import { accountActivityInput, getAccountActivityLines, getAccountActivitySummary } from "@/lib/reports/account-activity-server";
import { reportUser } from "@/lib/reports/report-session";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

/** GET reads can run concurrently; separate Server Actions from the browser are queued. */
export async function GET(request: Request) {
  try { await reportUser(); }
  catch { return Response.json({ error: "Sign in to load account details." }, { status: 401, headers }); }

  const params = new URL(request.url).searchParams;
  const section = params.get("section");
  if (section !== "summary" && section !== "lines") return Response.json({ error: "Invalid account section." }, { status: 400, headers });
  try {
    const input = accountActivityInput(Object.fromEntries(params));
    const data = section === "summary" ? await getAccountActivitySummary(input) : await getAccountActivityLines(input);
    return Response.json(data, { headers });
  } catch (error) {
    if (error instanceof RangeError) return Response.json({ error: error.message }, { status: 400, headers });
    return Response.json({ error: "Account details could not be loaded. Try again." }, { status: 503, headers });
  }
}
