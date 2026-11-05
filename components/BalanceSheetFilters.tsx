"use client";

import { DismissibleMenu } from "./DismissibleMenu";
import { ReportLink, ReportForm } from "./ReportNavigation";
import type { BalanceSheetOptions } from "@/lib/reports/balance-sheet";
import { formatDate } from "@/lib/reports/report-utils";
import { balanceDatePresets, reportHref } from "@/lib/reports/filter-options";
import { CalendarMark } from "./ReportViewControls";
import { FilterField } from "./FilterControls";

export function BalanceSheetFilters({ options }: { options: BalanceSheetOptions }) {
  const params = { asof: options.asOf, grain: options.grain, layout: options.summary ? "summary" : "detail" };
  const presets = balanceDatePresets();
  return <FilterField label="As of" className="statement-period-controls">
    <DismissibleMenu className="period-picker" key={options.asOf}>
      <summary className="period-picker-trigger"><CalendarMark /><span>{formatDate(options.asOf)}</span><span aria-hidden="true">▾</span></summary>
      <div className="period-picker-panel">
        <div className="date-presets" aria-label="Quick as-of dates">{presets.map(preset => <ReportLink key={preset.label} href={reportHref(params, { asof: preset.asOf })} className={`preset-link${options.asOf === preset.asOf ? " is-active" : ""}`} aria-current={options.asOf === preset.asOf ? "true" : undefined}>{preset.label}</ReportLink>)}</div>
        <ReportForm aria-label="Custom Balance Sheet date">
          <FilterField label="As of date" htmlFor="b-asof"><input id="b-asof" name="asof" type="date" min="1900-01-01" defaultValue={options.asOf} required /></FilterField>
          <input type="hidden" name="grain" value={options.grain} /><input type="hidden" name="layout" value={params.layout} />
          <button className="btn btn-primary" type="submit">Apply date</button>
        </ReportForm>
      </div>
    </DismissibleMenu>
  </FilterField>;
}
