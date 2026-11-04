"use client";

import { useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { ReportAnalytics as AnalyticsData } from "@/lib/reports/analytics";
import { formatReportAmount } from "@/lib/format";
import { ReportIcon } from "./ReportIcons";
import "./report-analytics.css";

const COLORS = ["#f4f7fa", "#a9bdcf", "#718fa8", "#d2dde6", "#54748e"];

export function changeFromPrevious(value: number, previous: number) {
  const difference = (Math.round(value * 100) - Math.round(previous * 100)) / 100;
  return { difference, percent: previous === 0 ? difference === 0 ? 0 : null : difference / Math.abs(previous) };
}

const percent = (value: number | null) => value == null ? "N/A" : `${(value * 100).toFixed(1)}%`;

export function compositionIsChartable(items: { value: number }[]) {
  return items.length > 0 && items.every(item => item.value >= 0) && items.some(item => item.value > 0);
}

function Composition({ data }: { data: AnalyticsData["composition"] }) {
  const total = data.items.reduce((sum, item) => sum + Math.round(item.value * 100), 0) / 100;
  const chartable = compositionIsChartable(data.items);
  let offset = 0;
  const circumference = 2 * Math.PI * 49;
  return (
    <section className="analytics-module analytics-composition" aria-label={data.title}>
      <h3>{data.title}</h3>
      {!chartable && <p className="analytics-note">{data.items.some(item => item.value < 0) ? "Signed balances are shown below." : "No balance in this view."}</p>}
      <div className={`analytics-composition-layout${chartable ? " has-chart" : ""}`}>
      {chartable && (
        <svg className="analytics-donut" width="84" height="84" viewBox="0 0 142 142" role="img" aria-label={`${data.title}: ${data.items.map(item => `${item.label} ${formatReportAmount(item.value)}`).join(", ")}`}>
          {data.items.map((item, index) => {
            const length = item.value / total * circumference;
            const start = offset;
            offset += length;
            return <circle key={item.label} cx="71" cy="71" r="49" fill="none" stroke={COLORS[index % COLORS.length]} strokeWidth="17" strokeDasharray={`${length} ${circumference}`} strokeDashoffset={-start} transform="rotate(-90 71 71)" />;
          })}
        </svg>
      )}
      <ul className="analytics-legend">
        {data.items.map((item, index) => (
          <li key={item.label}>
            <span className="analytics-legend-label"><i style={{ background: COLORS[index % COLORS.length] }} aria-hidden="true" />{item.label}</span>
            <span className="analytics-legend-value"><strong>{formatReportAmount(item.value)}</strong>{chartable && <small>{percent(item.value / total)}</small>}</span>
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}

function Trend({ title, points }: { title: string; points: AnalyticsData["movement"]["trend"] }) {
  if (!points.length) return <section className="analytics-module analytics-trend"><h3>{title}</h3><p className="analytics-note">No periods in this view.</p></section>;
  const values = points.map(point => point.value);
  const low = Math.min(...values), high = Math.max(...values);
  const span = high - low || Math.max(Math.abs(high) * 0.1, 1);
  const min = low - span * 0.15, max = high + span * 0.15;
  const coords = points.map((point, index) => ({ x: points.length === 1 ? 150 : 16 + index * 268 / (points.length - 1), y: 18 + (max - point.value) / (max - min) * 64 }));
  return (
    <section className="analytics-module analytics-trend">
      <div className="analytics-module-header"><h3>{title}</h3><p className="analytics-trend-value">{formatReportAmount(points[points.length - 1].value)}</p></div>
      <svg className="analytics-chart" width="300" height="120" viewBox="0 0 300 120" role="img" aria-label={`${title}: ${points.map(point => `${point.label}: ${formatReportAmount(point.value)}`).join("; ")}`}>
        <title>{title}</title>
        {[24, 56, 88].map(y => <line key={y} x1="12" x2="288" y1={y} y2={y} className="analytics-gridline" />)}
        {coords.length > 1 && <polyline points={coords.map(point => `${point.x},${point.y}`).join(" ")} fill="none" className="analytics-trend-line" />}
        {coords.map((point, index) => <circle key={points[index].label} cx={point.x} cy={point.y} r="2.5" className="analytics-trend-dot"><title>{`${points[index].label}: ${formatReportAmount(points[index].value)}`}</title></circle>)}
        <text x="12" y="112" className="analytics-axis">{points[0].label}</text>
        {points.length > 1 && <text x="288" y="112" textAnchor="end" className="analytics-axis">{points[points.length - 1].label}</text>}
      </svg>
      {points.length === 1 && <p className="analytics-note">One period in this view.</p>}
    </section>
  );
}

export function ReportAnalytics({ analytics }: { analytics: AnalyticsData }) {
  const [tab, setTab] = useState<"position" | "movement">("position");
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabNames = ["position", "movement"] as const;
  const positionTitle = analytics.kind === "balance" ? "Financial position" : "Financial overview";
  const selectWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % 2;
    else if (event.key === "ArrowLeft") next = (index + 1) % 2;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 1;
    else return;
    event.preventDefault(); setTab(tabNames[next]); tabs.current[next]?.focus();
  };
  return (
    <aside className="report-analytics no-print" aria-label="Report analytics">
      <div className="analytics-tabs" role="tablist" aria-label="Report analytics views">
        {tabNames.map((name, index) => <button key={name} ref={element => { tabs.current[index] = element; }} type="button" role="tab" id={`${id}-${name}-tab`} aria-selected={tab === name} aria-controls={`${id}-${name}-panel`} tabIndex={tab === name ? 0 : -1} onClick={() => setTab(name)} onKeyDown={event => selectWithKeyboard(event, index)}>{name === "position" ? "Position" : "Movement"}</button>)}
      </div>
      <section className="analytics-panel" id={`${id}-position-panel`} role="tabpanel" tabIndex={0} aria-labelledby={`${id}-position-tab`} hidden={tab !== "position"}>
        <div className="analytics-heading"><h2>{positionTitle}</h2><p>{analytics.asOf}</p></div>
        <section className="analytics-headline"><span>{analytics.headline.label}</span><strong className="analytics-value">{formatReportAmount(analytics.headline.value)}</strong></section>
        <Composition data={analytics.composition} />
        <section className="analytics-module analytics-secondary">
          <div className="analytics-module-header"><h3>{analytics.kind === "balance" ? "Cash share" : "Net margin"}</h3><p className="analytics-share-value">{percent(analytics.secondary.share)}<span>{analytics.kind === "balance" ? "of assets" : "of revenue"}</span></p></div>
          <div className="analytics-secondary-amount"><span>{analytics.secondary.label}</span><strong>{formatReportAmount(analytics.secondary.value)}</strong></div>
          {analytics.secondary.share != null && analytics.secondary.share >= 0 && analytics.secondary.share <= 1 && <div className="analytics-share-track" aria-hidden="true"><span style={{ width: `${analytics.secondary.share * 100}%` }} /></div>}
          {analytics.secondary.share == null && <p className="analytics-note">{analytics.kind === "balance" ? "No asset balance to calculate a share." : "No revenue to calculate a margin."}</p>}
        </section>
      </section>
      <section className="analytics-panel" id={`${id}-movement-panel`} role="tabpanel" tabIndex={0} aria-labelledby={`${id}-movement-tab`} hidden={tab !== "movement"}>
        <div className="analytics-heading"><h2>{analytics.kind === "balance" ? "Quarter-end movement" : "Period movement"}</h2><p>{analytics.movement.comparisonLabel}</p></div>
        <div className="analytics-movements">
          {analytics.movement.metrics.map(metric => {
            const change = changeFromPrevious(metric.value, metric.previous);
            return <section className="analytics-movement" key={metric.label}><div className="analytics-movement-top"><span>{metric.label}</span><strong>{formatReportAmount(metric.value)}</strong></div><div className="analytics-movement-bottom"><small className="analytics-previous">Previous: {formatReportAmount(metric.previous)}</small><div className="analytics-change"><ReportIcon name={change.difference > 0 ? "arrowUp" : change.difference < 0 ? "arrowDown" : "minus"} /><span>{change.difference > 0 ? "+" : ""}{formatReportAmount(change.difference)} <small>({change.percent != null && change.percent > 0 ? "+" : ""}{percent(change.percent)})</small></span></div></div></section>;
          })}
        </div>
        <Trend title={analytics.movement.trendTitle} points={analytics.movement.trend} />
      </section>
    </aside>
  );
}
