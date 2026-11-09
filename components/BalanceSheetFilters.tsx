"use client";

import type { BalanceSheetOptions } from "@/lib/reports/balance-sheet";

/** Balance sheet filters as a plain GET form, like the Income Statement's. */
export function BalanceSheetFilters({ options }: { options: BalanceSheetOptions }) {
  return (
    <form method="get" className="filters no-print" onChange={(e) => e.currentTarget.requestSubmit()} aria-label="Report filters">
      <div className="filter">
        <label htmlFor="b-asof">As of</label>
        <input id="b-asof" name="asof" type="date" defaultValue={options.asOf} min="1900-01-01" />
      </div>

      <div className="filter">
        <label htmlFor="b-grain">Columns</label>
        <select id="b-grain" name="grain" defaultValue={options.grain}>
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
    </form>
  );
}
