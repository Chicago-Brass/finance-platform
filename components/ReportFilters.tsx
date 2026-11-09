"use client";

import { DismissibleMenu } from "./DismissibleMenu";
import { useState } from "react";
import { ReportLink, ReportForm } from "./ReportNavigation";
import type { IncomeStatementOptions } from "@/lib/reports/income-statement";
import { formatDate, monthEnd, monthStart } from "@/lib/reports/report-utils";
import { incomeDatePresets, reportHref } from "@/lib/reports/filter-options";
import { CalendarMark } from "./ReportViewControls";
import { SearchableSelect } from "./SearchableSelect";
import { FilterField } from "./FilterControls";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((label, index) => ({ label, value: String(index + 1) }));

function CustomPeriod({ options }: { options: IncomeStatementOptions }) {
  const [from, setFrom] = useState(String(options.from)), [to, setTo] = useState(String(options.to));
  return <ReportForm aria-label="Custom reporting period">
    <FilterField label="Year" htmlFor="f-year"><input id="f-year" name="year" type="number" min="1900" max="9999" defaultValue={options.year} required /></FilterField>
    <div className="period-months"><SearchableSelect label="Start month" name="from" value={from} options={MONTHS} onChange={setFrom} /><SearchableSelect label="End month" name="to" value={to} options={MONTHS} onChange={setTo} /></div>
    <input type="hidden" name="grain" value={options.grain} /><input type="hidden" name="layout" value={options.summary ? "summary" : "detail"} />
    {options.branch && <input type="hidden" name="branch" value={options.branch} />}
    <p className="filter-help">Includes the full selected months.</p>
    <button className="btn btn-primary" type="submit">Apply period</button>
  </ReportForm>;
}

export function ReportFilters({ options }: { options: IncomeStatementOptions }) {
  const params = { ...(options.branch ? { branch: options.branch } : {}), year: String(options.year), from: String(options.from), to: String(options.to), grain: options.grain, layout: options.summary ? "summary" : "detail" };
  const presets = incomeDatePresets();
  const period = `${options.year}:${options.from}:${options.to}`;
  return <FilterField label="Period" className="statement-period-controls">
    <DismissibleMenu className="period-picker" key={period}>
      <summary className="period-picker-trigger"><CalendarMark /><span>{formatDate(monthStart(options.year, options.from))} - {formatDate(monthEnd(options.year, options.to))}</span><span aria-hidden="true">▾</span></summary>
      <div className="period-picker-panel">
        <div className="date-presets" aria-label="Quick reporting periods">{presets.map(preset => {
          const active = options.year === preset.year && options.from === preset.from && options.to === preset.to;
          return <ReportLink key={preset.label} href={reportHref(params, { year: String(preset.year), from: String(preset.from), to: String(preset.to) })} className={`preset-link${active ? " is-active" : ""}`} aria-current={active ? "true" : undefined}>{preset.label}</ReportLink>;
        })}</div>
        <CustomPeriod options={options} />
      </div>
    </DismissibleMenu>
  </FilterField>;
}
