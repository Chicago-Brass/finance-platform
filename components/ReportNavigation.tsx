"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Component, createContext, useContext, useMemo, useState, useTransition } from "react";
import type { AnchorHTMLAttributes, FormHTMLAttributes, ReactNode } from "react";
import { ReportIcon } from "./ReportIcons";
import { REPORT_PATHS } from "@/lib/reports/report-routes";
import { useReportFetching, useReportRefresh } from "./ReportData";

const Navigation = createContext<{ pending: boolean; destination: string | null; navigate: (href: string) => void; refresh: () => void } | null>(null);

const isReportPath = (path: string) => Object.values(REPORT_PATHS).some(value => value === path);

export function ReportNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [destination, setDestination] = useState<string | null>(null);
  const refreshData = useReportRefresh();
  const navigation = useMemo(() => ({
    pending, destination,
    navigate: (href: string) => {
      const target = new URL(href, window.location.href);
      if (target.origin === window.location.origin && isReportPath(window.location.pathname) && isReportPath(target.pathname)) {
        // These routes share one client workspace; Next syncs its URL hooks with native history.
        if (target.href !== window.location.href) window.history.pushState(null, "", `${target.pathname}${target.search}${target.hash}`);
        return;
      }
      setDestination(target.pathname);
      startTransition(() => router.push(href, { scroll: false }));
    },
    refresh: () => {
      if (isReportPath(window.location.pathname) || window.location.pathname === "/periods") { refreshData(); return; }
      setDestination(window.location.pathname);
      startTransition(() => router.refresh());
    },
  }), [pending, destination, router, refreshData]);
  return <Navigation.Provider value={navigation}>{children}</Navigation.Provider>;
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
  const pending = useReportFetching() || navigation?.pending;
  return <button type="button" className="btn btn-quiet refresh-data" onClick={() => navigation?.refresh()} disabled={pending} title="Load the latest posted ledger data"><ReportIcon name="refresh" className={pending ? "is-spinning" : ""} /><span className="refresh-data-label">Refresh data</span></button>;
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

export function ReportContent({ children }: { children: ReactNode }) {
  const fetching = useReportFetching(), pending = useReportPending() || fetching;
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
