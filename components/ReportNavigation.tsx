"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useTransition } from "react";
import type { AnchorHTMLAttributes, FormHTMLAttributes, ReactNode } from "react";
import { ReportIcon } from "./ReportIcons";

const Navigation = createContext<{ pending: boolean; navigate: (href: string) => void; refresh: () => void } | null>(null);

export function ReportNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <Navigation.Provider value={{
    pending,
    navigate: href => startTransition(() => router.push(href, { scroll: false })),
    // Clears the browser's cached report pages and re-reads the current one from the ledger.
    refresh: () => startTransition(() => router.refresh()),
  }}>{children}</Navigation.Provider>;
}

export function RefreshDataButton() {
  const navigation = useContext(Navigation);
  return <button type="button" className="btn btn-quiet refresh-data" onClick={() => navigation?.refresh()} disabled={navigation?.pending} title="Load the latest posted ledger data"><ReportIcon name="refresh" className={navigation?.pending ? "is-spinning" : ""} /><span className="refresh-data-label">Refresh data</span></button>;
}

export function ReportLink({ href, children, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const navigation = useContext(Navigation);
  return <Link {...props} href={href} prefetch={false} scroll={false} onClick={event => {
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
  const path = usePathname();
  const titles: Record<string, string> = { "/income-statement": "Income Statement", "/balance-sheet": "Balance Sheet", "/trial-balance": "Trial Balance", "/general-ledger": "General Ledger", "/t-chart": "T-Chart" };
  const analytics = path === "/income-statement" || path === "/balance-sheet";
  return <article className="report-page report-skeleton" aria-busy="true" aria-label="Loading report">
    <header className="report-header"><div className="report-heading"><h1 className="report-title">{titles[path] || "Report"}</h1><p className="report-entity loading-message" role="status"><span className="report-spinner" aria-hidden="true" />Loading report...</p></div></header>
    <div className="report-filters skeleton-filter" aria-hidden="true"><span className="skeleton-bar" /><span className="skeleton-bar" /></div>
    <div className={`report-workspace${analytics ? " has-analytics" : ""}`} aria-hidden="true">
      <section className="statement-panel skeleton-table"><div className="skeleton-table-head" />{Array.from({ length: 12 }, (_, index) => <div className="skeleton-table-row" key={index}><span className="skeleton-bar" /><span className="skeleton-bar" /><span className="skeleton-bar" /></div>)}</section>
      {analytics && <aside className="skeleton-sidebar"><span className="skeleton-bar" /><span className="skeleton-bar" /><span className="skeleton-bar" /></aside>}
    </div>
  </article>;
}

export function ReportContent({ children }: { children: ReactNode }) {
  const navigation = useContext(Navigation);
  const pending = navigation?.pending ?? false;
  return <main className="content" aria-busy={pending}>
    <div className="report-content" inert={pending || undefined} aria-hidden={pending || undefined}>{children}</div>
    {pending && <div className="report-loading-overlay"><ReportLoading /></div>}
  </main>;
}
