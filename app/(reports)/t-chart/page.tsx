import { getTChart } from "@/lib/reports/ledger";

export const metadata = { title: "T-Chart · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  expense: "Expenses",
  payment: "Payments",
  invoice_entry: "Invoice Entry",
  other: "Other Transactions",
};

export default async function TChartPage() {
  const rows = await getTChart();
  const cats = [...new Set(rows.map((r) => r.category))];
  return (
    <article className="report">
      <header className="report-header">
        <div>
          <p className="report-entity">Chicago Brass Inc.</p>
          <h1 className="report-title">T-Chart: Posting Rules</h1>
          <p className="report-period">{rows.length} rules · from Supabase ledger_rules</p>
        </div>
      </header>
      {cats.map((c) => (
        <section key={c} className="tchart-section">
          <h2 className="tchart-heading">{CATEGORY_LABEL[c] ?? c} <span className="muted">({rows.filter((r) => r.category === c).length})</span></h2>
          <div className="table-wrap">
            <table className="fin-table tchart-table">
              <thead>
                <tr>
                  <th className="label-cell">Rule</th>
                  <th className="label-cell">Trigger</th>
                  <th className="label-cell">Debit</th>
                  <th className="label-cell">Credit</th>
                  <th className="label-cell">Reversible</th>
                  <th className="label-cell">When to post</th>
                  <th className="label-cell">Audit trail</th>
                </tr>
              </thead>
              <tbody>
                {rows.filter((r) => r.category === c).map((r) => (
                  <tr key={r.rule_code} className="row-account">
                    <td className="label-cell nowrap">{r.rule_code}</td>
                    <td className="label-cell">{r.trigger_name}</td>
                    <td className="label-cell">{r.debit_accounts}</td>
                    <td className="label-cell">{r.credit_accounts}</td>
                    <td className="label-cell">{r.reversible == null ? "–" : r.reversible ? "Yes" : "No"}</td>
                    <td className="label-cell">{r.when_to_post}</td>
                    <td className="label-cell muted">{r.audit_trail || "Not set"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </article>
  );
}
