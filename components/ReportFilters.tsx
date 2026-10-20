"use client";

import type { IncomeStatementOptions } from "@/lib/reports/income-statement";
import { BRANCHES, PL_YEAR } from "@/lib/reports/pl-2026-data";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Report filters as a plain GET form: the URL holds the view, so it can be bookmarked and shared. */
export function ReportFilters({ options }: { options: IncomeStatementOptions }) {
  const byBranch = options.view === "BY_BRANCH";
  return (
    <form
      method="get"
      className="filters no-print"
      onChange={(e) => e.currentTarget.requestSubmit()}
      aria-label="Report filters"
    >
      <div className="filter">
        <label htmlFor="f-view">Branch</label>
        <select id="f-view" name="view" defaultValue={options.view}>
          <option value="ALL">Consolidated</option>
          {BRANCHES.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name}
            </option>
          ))}
          <option value="BY_BRANCH">Side by side by branch</option>
        </select>
      </div>

      <div className="filter">
        <label htmlFor="f-from">Start</label>
        <select id="f-from" name="from" defaultValue={options.from}>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m} 1, {PL_YEAR}
            </option>
          ))}
        </select>
      </div>

      <div className="filter">
        <label htmlFor="f-to">End</label>
        <select id="f-to" name="to" defaultValue={options.to}>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m} {new Date(PL_YEAR, i + 1, 0).getDate()}, {PL_YEAR}
            </option>
          ))}
        </select>
      </div>

      <div className="filter">
        <label htmlFor="f-grain">Columns</label>
        <select id="f-grain" name="grain" defaultValue={options.grain} disabled={byBranch}>
          <option value="month">Monthly</option>
          <option value="quarter">Quarterly</option>
          <option value="year">Annual</option>
        </select>
      </div>

      <div className="filter">
        <label htmlFor="f-layout">Detail</label>
        <select id="f-layout" name="layout" defaultValue={options.summary ? "summary" : "detail"}>
          <option value="detail">All accounts</option>
          <option value="summary">Simplified roll-up</option>
        </select>
      </div>

      <noscript>
        <button className="btn btn-quiet" type="submit">Apply</button>
      </noscript>
      <a className="filters-reset" href="?">Reset to current year</a>
      {byBranch && <p className="filters-hint">Side by side shows the whole Start–End range for each branch.</p>}
    </form>
  );
}
