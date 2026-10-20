import { DateFilter } from "@/components/DateFilter";
import { getTrialBalance } from "@/lib/reports/ledger";
import { cleanDate, todayChicago } from "@/lib/dates";
import { formatAmount } from "@/lib/format";

export const metadata = { title: "Trial Balance · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default async function TrialBalancePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const asOf = cleanDate(sp.to, todayChicago());
  const rows = await getTrialBalance(asOf, null);
  const dr = rows.reduce((t, r) => t + Number(r.total_debit), 0);
  const cr = rows.reduce((t, r) => t + Number(r.total_credit), 0);
  const ok = Math.round((dr - cr) * 100) === 0;
  return (
    <>
      <DateFilter to={asOf} asOfOnly note="Posted entries only, all time." />
      <article className="report">
        <header className="report-header">
          <div>
            <p className="report-entity">Chicago Brass Inc.</p>
            <h1 className="report-title">Trial Balance</h1>
            <p className="report-period">As of {asOf} · {rows.length} accounts · Live ledger</p>
          </div>
          <div className="report-checks">
            <span className={`check ${ok ? "check-ok" : "check-bad"}`}>{ok ? "✓ Debits = Credits" : `! Off by ${formatAmount(dr - cr)}`}</span>
          </div>
        </header>
        <div className="table-wrap">
          <table className="fin-table">
            <thead>
              <tr>
                <th className="label-cell">Account</th>
                <th className="label-cell">Type</th>
                <th className="num-cell">Debits</th>
                <th className="num-cell">Credits</th>
                <th className="num-cell">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.account_number} className="row-account">
                  <th scope="row" className="label-cell">{r.account_number}  {r.account_name}</th>
                  <td className="label-cell muted">{r.account_type} · {r.account_subtype}</td>
                  <td className="num-cell">{formatAmount(Number(r.total_debit))}</td>
                  <td className="num-cell">{formatAmount(Number(r.total_credit))}</td>
                  <td className="num-cell">{formatAmount(Number(r.balance))}</td>
                </tr>
              ))}
              <tr className="row-grandTotal">
                <th scope="row" className="label-cell">Totals</th>
                <td />
                <td className="num-cell">{formatAmount(dr, true)}</td>
                <td className="num-cell">{formatAmount(cr, true)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}
