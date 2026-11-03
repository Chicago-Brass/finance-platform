import { DateFilter } from "@/components/DateFilter";
import { getGeneralLedger } from "@/lib/reports/ledger";
import { cleanDate, startOfYear, todayChicago } from "@/lib/dates";
import { formatAmount } from "@/lib/format";

export const metadata = { title: "General Ledger · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

const safeLink = (u: string | null) => (u && /^https:\/\//i.test(u) ? u : null);

export default async function GeneralLedgerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const to = cleanDate(sp.to, todayChicago());
  const from = cleanDate(sp.from, startOfYear(to));
  const rows = await getGeneralLedger(from, to);
  return (
    <>
      <DateFilter from={from} to={to} note="Posted lines, up to 1,000 per view." />
      <article className="report">
        <header className="report-header">
          <div>
            <p className="report-entity">Chicago Brass Inc.</p>
            <h1 className="report-title">General Ledger</h1>
            <p className="report-period">{from} to {to} · {rows.length} lines · Live ledger</p>
          </div>
        </header>
        {rows.length === 0 ? (
          <p className="empty-state">No posted journal lines in this date range yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="fin-table gl-table">
              <thead>
                <tr>
                  <th className="label-cell">Date</th>
                  <th className="label-cell">Account Number</th>
                  <th className="label-cell">Account Name</th>
                  <th className="label-cell">Offsetting Account Number</th>
                  <th className="label-cell">Offsetting Account Name</th>
                  <th className="num-cell">Debit</th>
                  <th className="num-cell">Credit</th>
                  <th className="label-cell">Notes</th>
                  <th className="label-cell">Audit link</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const link = safeLink(r.audit_link);
                  return (
                    <tr key={`${r.entry_number}-${i}`} className="row-account">
                      <td className="label-cell">{r.date}</td>
                      <td className="label-cell">{r.account_number}</td>
                      <td className="label-cell">{r.account_name}</td>
                      <td className="label-cell">{r.offset_is_split ? "Split" : r.offsetting_account_number}</td>
                      <td className="label-cell">{r.offset_is_split ? "(multiple accounts)" : r.offsetting_account_name}</td>
                      <td className="num-cell">{Number(r.debit) ? formatAmount(Number(r.debit)) : ""}</td>
                      <td className="num-cell">{Number(r.credit) ? formatAmount(Number(r.credit)) : ""}</td>
                      <td className="label-cell">{r.notes}</td>
                      <td className="label-cell">{link ? <a href={link} target="_blank" rel="noopener noreferrer">Open</a> : r.audit_link}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </>
  );
}
