import { ReportLink, ReportForm } from "./ReportNavigation";
import type { IncomeStatementOptions } from "@/lib/reports/income-statement";
import { formatDate, monthEnd, monthStart } from "@/lib/reports/report-utils";
import { incomeDatePresets, reportHref } from "@/lib/reports/filter-options";
import { CalendarMark } from "./ReportViewControls";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ReportFilters({ options }: { options: IncomeStatementOptions }) {
  const params = { year: String(options.year), from: String(options.from), to: String(options.to), grain: options.grain, layout: options.summary ? "summary" : "detail" };
  const presets = incomeDatePresets();
  return (
    <div className="report-filters no-print" aria-label="Report date filters">
      <span className="filter-label">Period</span>
      <details className="period-picker" key={JSON.stringify(params)}>
        <summary className="period-picker-trigger"><CalendarMark /><span>{formatDate(monthStart(options.year, options.from))} - {formatDate(monthEnd(options.year, options.to))}</span><span aria-hidden="true">▾</span></summary>
        <div className="period-picker-panel">
          <ReportForm aria-label="Custom reporting period">
            <div className="filter-field"><label htmlFor="f-year">Year</label><input id="f-year" name="year" type="number" min="1900" max="9999" defaultValue={options.year} required /></div>
            <div className="period-months">
              <div className="filter-field"><label htmlFor="f-from">Start month</label><select id="f-from" name="from" defaultValue={options.from}>{MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></div>
              <div className="filter-field"><label htmlFor="f-to">End month</label><select id="f-to" name="to" defaultValue={options.to}>{MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></div>
            </div>
            <input type="hidden" name="grain" value={options.grain} /><input type="hidden" name="layout" value={params.layout} />
            <p className="filter-help">Includes the full selected months.</p>
            <button className="btn btn-primary" type="submit">Apply period</button>
          </ReportForm>
        </div>
      </details>
      <div className="date-presets" aria-label="Quick reporting periods">
        {presets.map(preset => {
          const active = options.year === preset.year && options.from === preset.from && options.to === preset.to;
          return <ReportLink key={preset.label} href={reportHref(params, { year: String(preset.year), from: String(preset.from), to: String(preset.to) })} className={`preset-link${active ? " is-active" : ""}`} aria-current={active ? "true" : undefined}>{preset.label}</ReportLink>;
        })}
      </div>
      <ReportLink className="filter-reset" href={reportHref(params, { year: String(presets[0].year), from: "1", to: String(presets[0].to) })}>Reset to current year</ReportLink>
    </div>
  );
}
