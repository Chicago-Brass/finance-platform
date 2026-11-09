import { getGeneralLedger, getLedgerAccounts, getLedgerCategories, getLedgerCount, getTChart, getTrialBalance } from "@/lib/reports/ledger";
import { loadBalanceSheetData, loadIncomeStatementData } from "@/lib/reports/statement-loaders";
import { parseReportScreen, REPORT_PATHS } from "@/lib/reports/report-routes";
import type { ReportKind } from "@/lib/reports/report-routes";
import { reportUser } from "@/lib/reports/report-session";

export const dynamic = "force-dynamic";

/** Financial reads stay behind user-scoped authentication and RLS, outside the route shell. */
export async function GET(request: Request) {
  const started = performance.now();
  const json = (data: unknown, status = 200) => Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store", "Server-Timing": `report;dur=${(performance.now() - started).toFixed(1)}` },
  });
  try { await reportUser(); }
  catch { return json({ error: "Sign in to load reports." }, 401); }

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const report = params.report;
  if (report !== "accounts" && report !== "categories" && report !== "ledger-count" && !Object.hasOwn(REPORT_PATHS, report)) return json({ error: "Unknown report." }, 400);
  try {
    if (report === "accounts") return json(await getLedgerAccounts());
    if (report === "categories") return json(await getLedgerCategories());
    const screen = parseReportScreen(report === "ledger-count" ? REPORT_PATHS.ledger : REPORT_PATHS[report as ReportKind], params);
    switch (screen.kind) {
      case "income": return json(await loadIncomeStatementData(screen.options));
      case "balance": return json(await loadBalanceSheetData(screen.options.asOf, screen.options.branch));
      case "trial": return json(await getTrialBalance(screen.options.asOf, null, screen.options.branch));
      case "ledger": {
        const { from, to, page, ...filters } = screen.options;
        if (report === "ledger-count") return json(await getLedgerCount(from, to, filters));
        return json(await getGeneralLedger(from, to, page, filters));
      }
      case "rules": return json(await getTChart());
    }
  } catch {
    return json({ error: "Report data could not be loaded. Try again." }, 500);
  }
}
