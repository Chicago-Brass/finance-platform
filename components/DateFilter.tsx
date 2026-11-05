import { DismissibleMenu } from "./DismissibleMenu";
import { todayChicago } from "@/lib/dates";
import { formatDate } from "@/lib/reports/report-utils";
import { balanceDatePresets } from "@/lib/reports/filter-options";
import { CalendarMark } from "./ReportViewControls";
import { ReportForm, ReportLink } from "./ReportNavigation";
import { ledgerDatePresets } from "./ledger-table-utils";
import type { MouseEvent, ReactNode } from "react";
import "./ledger-tables.css";
import { FilterBar, FilterField } from "./FilterControls";

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
export function DateFilter({ from, to, asOfOnly = false, note, preserve = {}, children, onRangeChange }: { from?: string; to: string; asOfOnly?: boolean; note?: string; preserve?: Preserved; children?: ReactNode; onRangeChange?: (range: { from?: string; to: string }) => void }) {
  const today = todayChicago();
  const rangePresets = ledgerDatePresets(today);
  const asOfPresets = balanceDatePresets(today);
  const rangeClick = (range: { from?: string; to: string }) => onRangeChange ? (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onRangeChange(range);
  } : undefined;
  return (
    <FilterBar className="ledger-date-filters no-print" label={asOfOnly ? "Trial Balance date filters" : "General Ledger date filters"}>
      <FilterField label={asOfOnly ? "As of" : "Period"} className="control-bar-period">
      <DismissibleMenu className="period-picker" key={`${from ?? ""}:${to}`}>
        <summary className="period-picker-trigger"><CalendarMark /><span>{asOfOnly || !from ? formatDate(to) : `${formatDate(from)} - ${formatDate(to)}`}</span><span aria-hidden="true">▾</span></summary>
        <div className={`period-picker-panel${asOfOnly ? "" : " ledger-range-panel"}`}>
          <ReportForm aria-label={asOfOnly ? "Custom Trial Balance date" : "Custom General Ledger dates"} onSubmit={event => {
            if (!onRangeChange) return;
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            onRangeChange({ from: asOfOnly ? undefined : String(fields.get("from")), to: String(fields.get("to")) });
          }}>
            <div className={asOfOnly ? "" : "ledger-date-fields"}>
              {!asOfOnly && <FilterField label="Start date" htmlFor="ledger-from"><input id="ledger-from" type="date" name="from" defaultValue={from} required /></FilterField>}
              <FilterField label={asOfOnly ? "As of date" : "End date"} htmlFor="ledger-to"><input id="ledger-to" type="date" name="to" defaultValue={to} required /></FilterField>
            </div>
            <p className="filter-help">{asOfOnly ? "Includes all posted activity through this date." : "Includes both start and end dates."}</p>
            {Object.entries(preserve).map(([key, value]) => value && <input key={key} type="hidden" name={key} value={value} />)}
            <button className="btn btn-primary" type="submit">{asOfOnly ? "Apply date" : "Apply dates"}</button>
          </ReportForm>
          <div className="date-presets" aria-label={asOfOnly ? "Quick as-of dates" : "Quick ledger periods"}>
            {asOfOnly ? asOfPresets.map(preset => <ReportLink key={preset.label} href={query({ to: preset.asOf }, preserve)} onClick={rangeClick({ to: preset.asOf })} className={`preset-link${to === preset.asOf ? " is-active" : ""}`} aria-current={to === preset.asOf ? "true" : undefined}>{preset.label}</ReportLink>) : rangePresets.map(preset => <ReportLink key={preset.label} href={query({ from: preset.from, to: preset.to }, preserve)} onClick={rangeClick({ from: preset.from, to: preset.to })} className={`preset-link${from === preset.from && to === preset.to ? " is-active" : ""}`} aria-current={from === preset.from && to === preset.to ? "true" : undefined}>{preset.label}</ReportLink>)}
          </div>
          <ReportLink className="filter-reset" onClick={rangeClick(asOfOnly ? { to: today } : { from: rangePresets[0].from, to: today })} href={asOfOnly ? query({ to: today }, preserve) : query({ from: rangePresets[0].from, to: today }, preserve)}>{asOfOnly ? "Reset to today" : "Reset to current year"}</ReportLink>
        </div>
      </DismissibleMenu></FilterField>
      {children}
      {note && <span className="filter-context">{note}</span>}
    </FilterBar>
  );
}
