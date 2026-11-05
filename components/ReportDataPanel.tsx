"use client";

import type { ReactNode } from "react";
import type { ReportQuery } from "./ReportData";
import { ReportDataBoundary, ReportDataLoading } from "./ReportNavigation";

/** Financial reads never block the destination's header or controls. */
export function ReportDataPanel({ query, analytics = false, label, children }: {
  query: ReportQuery<unknown>; analytics?: boolean; label?: string; children: ReactNode;
}) {
  return <div className="report-data-region" aria-busy={query.pending}>
    <div className="report-data-content">
      <ReportDataBoundary resetKey={query.data} analytics={analytics}>
        {query.pending ? <ReportDataLoading analytics={analytics} label={label} /> : query.error ?
          <div className={`report-workspace${analytics ? " has-analytics" : ""}`}>
            <section className="statement-panel report-panel-loading" role="alert"><p>Report data could not be loaded.</p><button className="btn btn-quiet" type="button" onClick={query.retry}>Try again</button></section>
            {analytics && <aside className="report-analytics report-panel-loading"><span>Analytics unavailable</span></aside>}
          </div> : children}
      </ReportDataBoundary>
    </div>
  </div>;
}
