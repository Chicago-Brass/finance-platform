import type { Report, ReportLine } from "@/lib/reports/types";
import { formatAmount, formatPercent } from "@/lib/format";

/** Rows that print a $ sign: first amount row of the report and every total. */
function showsSymbol(line: ReportLine, firstAmountId: string | undefined) {
  return line.id === firstAmountId || line.kind === "total" || line.kind === "grandTotal";
}

export function ReportView({ report }: { report: Report }) {
  const firstAmountId = report.lines.find((l) => l.kind !== "section")?.id;

  return (
    <article className="report">
      <header className="report-header">
        <div>
          <p className="report-entity">{report.entity}</p>
          <h1 className="report-title">{report.title}</h1>
          <p className="report-period">
            {report.periodLabel} · {report.basis}
          </p>
        </div>
        <div className="report-checks">
          {report.checks.map((c) => (
            <span key={c.label} className={`check ${c.ok ? "check-ok" : "check-bad"}`} title={c.detail}>
              <span aria-hidden>{c.ok ? "✓" : "!"}</span> {c.label}: {c.detail}
            </span>
          ))}
        </div>
      </header>

      {report.isSample && (
        <p className="sample-banner" role="note">
          Sample data. These figures are invented for layout review and are not Chicago Brass results.
        </p>
      )}

      <div className="table-wrap">
        <table className="fin-table">
          <colgroup>
            <col className="col-label" />
            {report.columns.map((c) => (
              <col key={c.key} className={c.kind === "percent" ? "col-pct" : "col-amt"} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="label-cell">
                <span className="sr-only">Line item</span>
              </th>
              {report.columns.map((c) => (
                <th key={c.key} scope="col" className="num-cell">
                  <span className="col-head">{c.label}</span>
                  {c.sublabel && <span className="col-sub">{c.sublabel}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.lines.map((line) => (
              <tr
                key={line.id}
                className={`row-${line.kind}${line.spaceBefore ? " row-gap" : ""}`}
                data-account={line.accountCode}
              >
                <th scope="row" className="label-cell" style={{ paddingLeft: `${0.75 + line.depth * 1.25}rem` }}>
                  {line.label}
                </th>
                {report.columns.map((c) => {
                  const v = line.values[c.key];
                  const text =
                    line.kind === "section"
                      ? ""
                      : c.kind === "percent"
                        ? formatPercent(v)
                        : formatAmount(v, showsSymbol(line, firstAmountId));
                  const neg = typeof v === "number" && v < 0;
                  return (
                    <td key={c.key} className={`num-cell${neg ? " neg" : ""}`}>
                      {text}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
