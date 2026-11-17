import { reportUser } from "@/lib/reports/report-session";
import { getProgress, ProgressMutationError, setProgressEnabled } from "@/lib/progress/data";
import { progressQuery, progressToggle } from "@/lib/progress/query";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  try { await reportUser(); }
  catch { return Response.json({ error: "Sign in to view rule progress." }, { status: 401, headers }); }
  try {
    const data = await getProgress(progressQuery(new URL(request.url).searchParams));
    if (!data) return Response.json({ error: "Rule is not available." }, { status: 404, headers });
    return Response.json(data, { headers });
  } catch (error) {
    if (error instanceof RangeError) return Response.json({ error: error.message }, { status: 400, headers });
    return Response.json({ error: "Rule progress could not be loaded. Try again." }, { status: 503, headers });
  }
}

export async function PATCH(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Use this site's rule controls to change a rule." }, { status: 403, headers });
  try { await reportUser(); }
  catch { return Response.json({ error: "Sign in to change a rule." }, { status: 401, headers }); }
  let input: ReturnType<typeof progressToggle>;
  try { input = progressToggle(await request.json()); }
  catch { return Response.json({ error: "Choose a rule and its enabled state." }, { status: 400, headers }); }
  try { return Response.json(await setProgressEnabled(input.ruleCode, input.enabled), { headers }); }
  catch (error) {
    if (error instanceof ProgressMutationError) return Response.json({ error: error.message }, { status: error.status, headers });
    return Response.json({ error: "Rule could not be updated. Refresh to check its state before trying again." }, { status: 503, headers });
  }
}
