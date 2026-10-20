"use client";

import { useMemo, useState } from "react";
import type { Report, ReportLine } from "@/lib/reports/types";
import { formatAmount, formatPercent } from "@/lib/format";
import { downloadExcel } from "@/lib/reports/export-excel";
import { LOGO_DATA_URI, LOGO_HEIGHT, LOGO_WIDTH } from "@/lib/reports/logo";

/** Rows that print a $ sign: first amount row of the report and every total. */
function showsSymbol(line: ReportLine, firstAmountId: string | undefined) {
  return line.id === firstAmountId || line.kind === "total" || line.kind === "grandTotal";
}

/** A section row can collapse when the next row is indented deeper than it. */
function collapsibleIds(lines: ReportLine[]) {
  const ids = new Set<string>();
  lines.forEach((l, i) => {
    if (l.kind === "section" && lines[i + 1] && lines[i + 1].depth > l.depth) ids.add(l.id);
  });
  return ids;
}

/** Hides rows deeper than a collapsed section until the next row at its level or above. */
function visibleLines(lines: ReportLine[], collapsed: Set<string>) {
  const out: ReportLine[] = [];
  let hideBelow: number | null = null;
  for (const l of lines) {
    if (hideBelow !== null) {
      if (l.depth > hideBelow) continue;
      hideBelow = null;
    }
    out.push(l);
    if (l.kind === "section" && collapsed.has(l.id)) hideBelow = l.depth;
  }
  return out;
}

export function ReportView({ report }: { report: Report }) {
  const firstAmountId = report.lines.find((l) => l.kind !== "section")?.id;
  const canCollapse = useMemo(() => collapsibleIds(report.lines), [report.lines]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const rows = useMemo(() => visibleLines(report.lines, collapsed), [report.lines, collapsed]);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <article className="report">
      <header className="report-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="print-logo" src={LOGO_DATA_URI} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt="Chicago Brass" />
        <div className="report-heading">
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

      <div className="report-actions no-print">
        {canCollapse.size > 0 && (
          <>
            <button type="button" className="btn btn-quiet" onClick={() => setCollapsed(new Set())}>
              Expand all
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setCollapsed(new Set(canCollapse))}>
              Collapse all
            </button>
          </>
        )}
        <span className="report-actions-spacer" />
        <button type="button" className="btn btn-quiet" onClick={() => downloadExcel(report, rows)}>
          Export Excel
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => window.print()}>
          Export PDF
        </button>
      </div>

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
            {rows.map((line) => {
              const isToggle = canCollapse.has(line.id);
              const isCollapsed = collapsed.has(line.id);
              return (
                <tr
                  key={line.id}
                  className={`row-${line.kind}${line.spaceBefore ? " row-gap" : ""}`}
                  data-account={line.accountCode}
                >
                  <th scope="row" className="label-cell" style={{ paddingLeft: `${0.75 + line.depth * 1.25}rem` }}>
                    {isToggle ? (
                      <button
                        type="button"
                        className="row-toggle"
                        aria-expanded={!isCollapsed}
                        onClick={() => toggle(line.id)}
                      >
                        <span className="row-caret no-print" aria-hidden>
                          {isCollapsed ? "▸" : "▾"}
                        </span>
                        {line.label}
                      </button>
                    ) : (
                      line.label
                    )}
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
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
