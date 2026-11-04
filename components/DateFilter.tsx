import { todayChicago } from "@/lib/dates";
import { formatDate } from "@/lib/reports/report-utils";
import { balanceDatePresets } from "@/lib/reports/filter-options";
import { CalendarMark } from "./ReportViewControls";
import { ReportForm, ReportLink } from "./ReportNavigation";
import { ledgerDatePresets } from "./ledger-table-utils";
import type { ReactNode } from "react";
import "./ledger-tables.css";

type Preserved = Record<string, string | undefined>;

const query = (params: Record<string, string>, preserve: Preserved) => {
  const search = new URLSearchParams(params);
  for (const [key, value] of Object.entries(preserve)) if (value) search.set(key, value);
  return `?${search}`;
};

/**
 * Native GET fields reset pagination while keeping the date range in the URL.
 * `preserve` carries other active filters through date changes; `children` adds filters to the bar.
 */
export function DateFilter({ from, to, asOfOnly = false, note, preserve = {}, children }: { from?: string; to: string; asOfOnly?: boolean; note?: string; preserve?: Preserved; children?: ReactNode }) {
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
            {Object.entries(preserve).map(([key, value]) => value && <input key={key} type="hidden" name={key} value={value} />)}
            <button className="btn btn-primary" type="submit">{asOfOnly ? "Apply date" : "Apply dates"}</button>
          </ReportForm>
        </div>
      </details>
      <div className="date-presets" aria-label={asOfOnly ? "Quick as-of dates" : "Quick ledger periods"}>
        {asOfOnly ? asOfPresets.map(preset => <ReportLink key={preset.label} href={query({ to: preset.asOf }, preserve)} className={`preset-link${to === preset.asOf ? " is-active" : ""}`} aria-current={to === preset.asOf ? "true" : undefined}>{preset.label}</ReportLink>) : rangePresets.map(preset => <ReportLink key={preset.label} href={query({ from: preset.from, to: preset.to }, preserve)} className={`preset-link${from === preset.from && to === preset.to ? " is-active" : ""}`} aria-current={from === preset.from && to === preset.to ? "true" : undefined}>{preset.label}</ReportLink>)}
      </div>
      <ReportLink className="filter-reset" href={asOfOnly ? query({ to: today }, preserve) : query({ from: rangePresets[0].from, to: today }, preserve)}>{asOfOnly ? "Reset to today" : "Reset to current year"}</ReportLink>
      {children}
      {note && <span className="filter-context">{note}</span>}
    </div>
  );
}
