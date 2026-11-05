import { getJournalEntry, journalEntryNumber } from "@/lib/reports/journal-entry";
import { reportUser } from "@/lib/reports/report-session";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  try { await reportUser(); }
  catch { return Response.json({ error: "Sign in to load journal entries." }, { status: 401, headers }); }
  try {
    const entryNumber = journalEntryNumber(new URL(request.url).searchParams.get("entry"));
    const entry = await getJournalEntry(entryNumber);
    if (!entry) return Response.json({ error: "Journal entry is not available." }, { status: 404, headers });
    return Response.json(entry, { headers });
  } catch (error) {
    if (error instanceof RangeError) return Response.json({ error: error.message }, { status: 400, headers });
    return Response.json({ error: "Journal entry could not be loaded. Try again." }, { status: 503, headers });
  }
}
