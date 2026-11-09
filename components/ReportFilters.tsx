"use client";

import type { IncomeStatementOptions } from "@/lib/reports/income-statement";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Report filters as a plain GET form: the URL holds the view, so it can be bookmarked and shared. */
export function ReportFilters({ options }: { options: IncomeStatementOptions }) {
  const years = [...new Set([options.year, ...Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index)])].sort((a, b) => b - a);
  return (
    <form
      method="get"
      className="filters no-print"
      onChange={(e) => e.currentTarget.requestSubmit()}
      aria-label="Report filters"
    >
      <div className="filter">
        <label htmlFor="f-year">Year</label>
        <select id="f-year" name="year" defaultValue={options.year}>
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>

      <div className="filter">
        <label htmlFor="f-from">Start</label>
        <select id="f-from" name="from" defaultValue={options.from}>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m} 1, {options.year}
            </option>
          ))}
        </select>
      </div>

      <div className="filter">
        <label htmlFor="f-to">End</label>
        <select id="f-to" name="to" defaultValue={options.to}>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m} {new Date(options.year, i + 1, 0).getDate()}, {options.year}
            </option>
          ))}
        </select>
      </div>

      <div className="filter">
        <label htmlFor="f-grain">Columns</label>
        <select id="f-grain" name="grain" defaultValue={options.grain}>
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
    </form>
  );
}
