"use client";

import type { BalanceSheetOptions } from "@/lib/reports/balance-sheet";
import { BRANCHES } from "@/lib/reports/branches";

/** Balance sheet filters as a plain GET form, like the Income Statement's. */
export function BalanceSheetFilters({ options }: { options: BalanceSheetOptions }) {
  const year = Number(options.asOf.slice(0, 4));
  const dates = [...new Set([...Array.from({ length: 12 }, (_, month) => new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10)), options.asOf])].sort();
  return (
    <form method="get" className="filters no-print" onChange={(e) => e.currentTarget.requestSubmit()} aria-label="Report filters">
      <div className="filter">
        <label htmlFor="b-view">Branch</label>
        <select id="b-view" name="view" defaultValue={options.view ?? "ALL"}>
          <option value="ALL">Consolidated</option>
          {BRANCHES.map(branch => <option key={branch.code} value={branch.code}>{branch.name}</option>)}
          <option value="BY_BRANCH">Side by side by branch</option>
        </select>
      </div>
      <div className="filter">
        <label htmlFor="b-asof">As of</label>
        <select id="b-asof" name="asof" defaultValue={options.asOf}>
          {dates.map(date => <option key={date} value={date}>{new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</option>)}
        </select>
      </div>

      <div className="filter">
        <label htmlFor="b-grain">Columns</label>
        <select id="b-grain" name="grain" defaultValue={options.grain} disabled={options.view === "BY_BRANCH"}>
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
