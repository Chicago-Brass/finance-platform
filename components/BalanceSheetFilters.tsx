"use client";

import type { BalanceSheetOptions } from "@/lib/reports/balance-sheet";
import { BRANCHES, PL_YEAR } from "@/lib/reports/pl-2026-data";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Balance sheet filters as a plain GET form, like the Income Statement's. */
export function BalanceSheetFilters({ options }: { options: BalanceSheetOptions }) {
  const byBranch = options.view === "BY_BRANCH";
  return (
    <form method="get" className="filters no-print" onChange={(e) => e.currentTarget.requestSubmit()} aria-label="Report filters">
      <div className="filter">
        <label htmlFor="b-view">Branch</label>
        <select id="b-view" name="view" defaultValue={options.view}>
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
        <label htmlFor="b-asof">As of</label>
        <select id="b-asof" name="asof" defaultValue={options.asOf}>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m} {new Date(PL_YEAR, i + 1, 0).getDate()}, {PL_YEAR}
            </option>
          ))}
        </select>
      </div>

      <div className="filter">
        <label htmlFor="b-grain">Columns</label>
        <select id="b-grain" name="grain" defaultValue={options.grain} disabled={byBranch}>
          <option value="single">As-of date only</option>
          <option value="month">Each month-end</option>
          <option value="quarter">Each quarter-end</option>
        </select>
      </div>

      <div className="filter">
        <label htmlFor="b-layout">Detail</label>
        <select id="b-layout" name="layout" defaultValue={options.summary ? "summary" : "detail"}>
          <option value="detail">All accounts</option>
          <option value="summary">Simplified roll-up</option>
        </select>
      </div>

      <noscript>
        <button className="btn btn-quiet" type="submit">Apply</button>
      </noscript>
      <a className="filters-reset" href="?">Reset to all time</a>
      {byBranch && <p className="filters-hint">Side by side shows each branch as of the selected date.</p>}
    </form>
  );
}
