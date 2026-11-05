"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Component, createContext, useContext, useState, useTransition } from "react";
import type { AnchorHTMLAttributes, FormHTMLAttributes, ReactNode } from "react";
import { ReportIcon } from "./ReportIcons";

const Navigation = createContext<{ pending: boolean; destination: string | null; navigate: (href: string) => void; refresh: () => void } | null>(null);

export function ReportNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [destination, setDestination] = useState<string | null>(null);
  return <Navigation.Provider value={{
    pending, destination,
    navigate: href => { setDestination(new URL(href, window.location.href).pathname); startTransition(() => router.push(href, { scroll: false })); },
    // Clears the browser's cached report pages and re-reads the current one from the ledger.
    refresh: () => { setDestination(window.location.pathname); startTransition(() => router.refresh()); },
  }}>{children}</Navigation.Provider>;
}

export function useReportPath() {
  const path = usePathname(), navigation = useContext(Navigation);
  return navigation?.pending && navigation.destination ? navigation.destination : path;
}

export function useReportNavigate() {
  const navigation = useContext(Navigation);
  if (!navigation) throw new Error("Report navigation provider is missing.");
  return navigation.navigate;
}

export function useReportPending() {
  return useContext(Navigation)?.pending ?? false;
}

export function RefreshDataButton() {
  const navigation = useContext(Navigation);
  return <button type="button" className="btn btn-quiet refresh-data" onClick={() => navigation?.refresh()} disabled={navigation?.pending} title="Load the latest posted ledger data"><ReportIcon name="refresh" className={navigation?.pending ? "is-spinning" : ""} /><span className="refresh-data-label">Refresh data</span></button>;
}

export function ReportLink({ href, children, onClick, prefetch = false, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean | null }) {
  const navigation = useContext(Navigation);
  return <Link {...props} href={href} prefetch={prefetch} scroll={false} onClick={event => {
    onClick?.(event);
    if (!navigation || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (props.target && props.target !== "_self")) return;
    event.preventDefault();
    navigation.navigate(href);
  }}>{children}</Link>;
}

export function ReportForm({ children, onSubmit, ...props }: Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "method">) {
  const navigation = useContext(Navigation);
  return <form {...props} method="get" onSubmit={event => {
    onSubmit?.(event);
    if (!navigation || event.defaultPrevented) return;
    event.preventDefault();
    const params = new URLSearchParams();
    // Empty optional fields (such as "All accounts") stay out of the URL.
    new FormData(event.currentTarget).forEach((value, key) => { if (typeof value === "string" && value !== "") params.set(key, value); });
    navigation.navigate(`?${params}`);
  }}>{children}</form>;
}

export function ReportLoading() {
  const path = useReportPath();
  const titles: Record<string, string> = { "/income-statement": "Income Statement", "/balance-sheet": "Balance Sheet", "/trial-balance": "Trial Balance", "/general-ledger": "General Ledger", "/t-chart": "T-Chart" };
  const analytics = path === "/income-statement" || path === "/balance-sheet";
  return <article className="report-page report-skeleton" aria-busy="true" aria-label="Loading report">
    <header className="report-header"><div className="report-heading"><h1 className="report-title">{titles[path] || "Report"}</h1><p className="report-entity loading-message" role="status"><span className="report-spinner" aria-hidden="true" />Loading report...</p></div></header>
    <div className="dashboard-control-bar report-controls-placeholder" aria-hidden="true" />
    <ReportDataLoading analytics={analytics} />
  </article>;
}

export function ReportContent({ children }: { children: ReactNode }) {
  const pending = useReportPending();
  return <main className="content" id="report-content" tabIndex={-1}>
    {pending && <div className="report-request-progress" role="status"><span className="sr-only">Updating report data...</span></div>}
    <div className="report-content">{children}</div>
  </main>;
}

export function ReportDataLoading({ analytics = false, label = "Loading report data..." }: { analytics?: boolean; label?: string }) {
  return <div className={`report-workspace report-data-loading${analytics ? " has-analytics" : ""}`} aria-busy="true">
    <section className="statement-panel report-panel-loading" role="status"><span className="report-spinner" aria-hidden="true" /><span>{label}</span></section>
    {analytics && <aside className="report-analytics report-panel-loading" role="status" aria-label="Loading analytics"><span className="report-spinner" aria-hidden="true" /><span>Loading analytics...</span></aside>}
  </div>;
}

/** Keep controls usable and preserve mounted chart state while only the data region waits. */
export function ReportDataRegion({ children, analytics = false }: { children: ReactNode; analytics?: boolean }) {
  const pending = useReportPending();
  return <div className="report-data-region" aria-busy={pending}>
    <div className="report-data-content" inert={pending || undefined} aria-hidden={pending || undefined} style={pending ? { visibility: "hidden" } : undefined}>{children}</div>
    {pending && <div className="report-data-pending"><ReportDataLoading analytics={analytics} /></div>}
  </div>;
}

class DataBoundary extends Component<{ children: ReactNode; resetKey: unknown; onRetry: () => void; pending: boolean; fallback?: ReactNode; analytics?: boolean }, { failed: boolean; resetKey: unknown }> {
  state = { failed: false, resetKey: this.props.resetKey };
  static getDerivedStateFromError() { return { failed: true }; }
  static getDerivedStateFromProps(props: { resetKey: unknown }, state: { resetKey: unknown }) {
    return props.resetKey !== state.resetKey ? { failed: false, resetKey: props.resetKey } : null;
  }
  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return <div className={`report-workspace${this.props.analytics ? " has-analytics" : ""}`}>
      <section className="statement-panel report-panel-loading" role="alert"><p>Report data could not be loaded.</p><button className="btn btn-quiet" type="button" disabled={this.props.pending} onClick={this.props.onRetry}>Try again</button></section>
      {this.props.analytics && <aside className="report-analytics report-panel-loading"><span>Analytics unavailable</span></aside>}
    </div>;
  }
}

export function ReportDataBoundary({ children, resetKey, fallback, analytics = false }: { children: ReactNode; resetKey: unknown; fallback?: ReactNode; analytics?: boolean }) {
  const navigation = useContext(Navigation);
  return <DataBoundary resetKey={resetKey} analytics={analytics} fallback={fallback} pending={navigation?.pending ?? false} onRetry={() => navigation?.refresh()}>{children}</DataBoundary>;
}
