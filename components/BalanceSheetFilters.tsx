import { ReportLink, ReportForm } from "./ReportNavigation";
import type { BalanceSheetOptions } from "@/lib/reports/balance-sheet";
import { formatDate } from "@/lib/reports/report-utils";
import { balanceDatePresets, reportHref } from "@/lib/reports/filter-options";
import { CalendarMark } from "./ReportViewControls";

export function BalanceSheetFilters({ options }: { options: BalanceSheetOptions }) {
  const params = { asof: options.asOf, grain: options.grain, layout: options.summary ? "summary" : "detail" };
  const presets = balanceDatePresets();
  return (
    <div className="report-filters no-print" aria-label="Balance Sheet date filters">
      <span className="filter-label">As of</span>
      <details className="period-picker" key={JSON.stringify(params)}>
        <summary className="period-picker-trigger"><CalendarMark /><span>{formatDate(options.asOf)}</span><span aria-hidden="true">▾</span></summary>
        <div className="period-picker-panel">
          <ReportForm aria-label="Custom Balance Sheet date">
            <div className="filter-field"><label htmlFor="b-asof">As of date</label><input id="b-asof" name="asof" type="date" min="1900-01-01" defaultValue={options.asOf} required /></div>
            <input type="hidden" name="grain" value={options.grain} /><input type="hidden" name="layout" value={params.layout} />
            <button className="btn btn-primary" type="submit">Apply date</button>
          </ReportForm>
        </div>
      </details>
      <div className="date-presets" aria-label="Quick as-of dates">
        {presets.map(preset => <ReportLink key={preset.label} href={reportHref(params, { asof: preset.asOf })} className={`preset-link${options.asOf === preset.asOf ? " is-active" : ""}`} aria-current={options.asOf === preset.asOf ? "true" : undefined}>{preset.label}</ReportLink>)}
      </div>
      <ReportLink className="filter-reset" href={reportHref(params, { asof: presets[0].asOf })}>Reset to today</ReportLink>
      <span className="filter-context">Cumulative posted balances</span>
    </div>
  );
}
