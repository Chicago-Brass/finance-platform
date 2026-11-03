import type { BalanceSheetOptions } from "@/lib/reports/balance-sheet";

export function BalanceSheetFilters({ options }: { options: BalanceSheetOptions }) {
  return (
    <form method="get" className="filters no-print" aria-label="Report filters">
      <div className="filter">
        <label htmlFor="b-asof">As of</label>
        <input id="b-asof" name="asof" type="date" min="1900-01-01" defaultValue={options.asOf} required />
      </div>
      <div className="filter">
        <label htmlFor="b-grain">Columns</label>
        <select id="b-grain" name="grain" defaultValue={options.grain}>
          <option value="single">As-of date only</option><option value="month">Each month-end</option><option value="quarter">Each quarter-end</option>
        </select>
      </div>
      <div className="filter">
        <label htmlFor="b-layout">Detail</label>
        <select id="b-layout" name="layout" defaultValue={options.summary ? "summary" : "detail"}>
          <option value="detail">All accounts</option><option value="summary">Simplified roll-up</option>
        </select>
      </div>
      <button className="btn btn-quiet" type="submit">Apply</button>
      <a className="filters-reset" href="?">Reset to today</a>
    </form>
  );
}
