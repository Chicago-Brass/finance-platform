import type { IncomeStatementOptions } from "@/lib/reports/income-statement";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ReportFilters({ options }: { options: IncomeStatementOptions }) {
  return (
    <form method="get" className="filters no-print" aria-label="Report filters">
      <div className="filter">
        <label htmlFor="f-year">Year</label>
        <input id="f-year" name="year" type="number" min="1900" max="9999" defaultValue={options.year} required />
      </div>
      <div className="filter">
        <label htmlFor="f-from">Start</label>
        <select id="f-from" name="from" defaultValue={options.from}>
          {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month} 1</option>)}
        </select>
      </div>
      <div className="filter">
        <label htmlFor="f-to">End</label>
        <select id="f-to" name="to" defaultValue={options.to}>
          {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month} {new Date(Date.UTC(options.year, index + 1, 0)).getUTCDate()}</option>)}
        </select>
      </div>
      <div className="filter">
        <label htmlFor="f-grain">Columns</label>
        <select id="f-grain" name="grain" defaultValue={options.grain}>
          <option value="month">Monthly</option><option value="quarter">Quarterly</option><option value="year">Annual</option>
        </select>
      </div>
      <div className="filter">
        <label htmlFor="f-layout">Detail</label>
        <select id="f-layout" name="layout" defaultValue={options.summary ? "summary" : "detail"}>
          <option value="detail">All accounts</option><option value="summary">Simplified roll-up</option>
        </select>
      </div>
      <button className="btn btn-quiet" type="submit">Apply</button>
      <a className="filters-reset" href="?">Reset to current year</a>
    </form>
  );
}
