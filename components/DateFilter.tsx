import { todayChicago } from "@/lib/dates";
import { formatDate } from "@/lib/reports/report-utils";
import { balanceDatePresets } from "@/lib/reports/filter-options";
import { CalendarMark } from "./ReportViewControls";
import { ReportForm, ReportLink } from "./ReportNavigation";
import { ledgerDatePresets } from "./ledger-table-utils";
import "./ledger-tables.css";

/** Native GET fields reset pagination while keeping the date range in the URL. */
export function DateFilter({ from, to, asOfOnly = false, note }: { from?: string; to: string; asOfOnly?: boolean; note?: string }) {
  const today = todayChicago();
  const rangePresets = ledgerDatePresets(today);
  const asOfPresets = balanceDatePresets(today);
  return (
    <div className="report-filters ledger-date-filters no-print" aria-label={asOfOnly ? "Trial Balance date filters" : "General Ledger date filters"}>
      <span className="filter-label">{asOfOnly ? "As of" : "Period"}</span>
      <details className="period-picker" key={`${from ?? ""}:${to}`}>
        <summary className="period-picker-trigger"><CalendarMark /><span>{asOfOnly || !from ? formatDate(to) : `${formatDate(from)} - ${formatDate(to)}`}</span><span aria-hidden="true">▾</span></summary>
        <div className={`period-picker-panel${asOfOnly ? "" : " ledger-range-panel"}`}>
          <ReportForm aria-label={asOfOnly ? "Custom Trial Balance date" : "Custom General Ledger dates"}>
            <div className={asOfOnly ? "filter-field" : "ledger-date-fields"}>
              {!asOfOnly && <div className="filter-field"><label htmlFor="ledger-from">Start date</label><input id="ledger-from" type="date" name="from" defaultValue={from} required /></div>}
              <div className="filter-field"><label htmlFor="ledger-to">{asOfOnly ? "As of date" : "End date"}</label><input id="ledger-to" type="date" name="to" defaultValue={to} required /></div>
            </div>
            <p className="filter-help">{asOfOnly ? "Includes all posted activity through this date." : "Includes both start and end dates."}</p>
            <button className="btn btn-primary" type="submit">{asOfOnly ? "Apply date" : "Apply dates"}</button>
          </ReportForm>
        </div>
      </details>
      <div className="date-presets" aria-label={asOfOnly ? "Quick as-of dates" : "Quick ledger periods"}>
        {asOfOnly ? asOfPresets.map(preset => <ReportLink key={preset.label} href={`?${new URLSearchParams({ to: preset.asOf })}`} className={`preset-link${to === preset.asOf ? " is-active" : ""}`} aria-current={to === preset.asOf ? "true" : undefined}>{preset.label}</ReportLink>) : rangePresets.map(preset => <ReportLink key={preset.label} href={`?${new URLSearchParams({ from: preset.from, to: preset.to })}`} className={`preset-link${from === preset.from && to === preset.to ? " is-active" : ""}`} aria-current={from === preset.from && to === preset.to ? "true" : undefined}>{preset.label}</ReportLink>)}
      </div>
      <ReportLink className="filter-reset" href={asOfOnly ? `?to=${today}` : `?${new URLSearchParams({ from: rangePresets[0].from, to: today })}`}>{asOfOnly ? "Reset to today" : "Reset to current year"}</ReportLink>
      {note && <span className="filter-context">{note}</span>}
    </div>
  );
}
