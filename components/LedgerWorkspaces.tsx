"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import type { LedgerAccountFilters, LedgerAccountOption, TbRow, TChartRow, getGeneralLedger } from "@/lib/reports/ledger";
import { DateFilter } from "./DateFilter";
import { LedgerAccountFilter } from "./LedgerAccountFilter";
import { GeneralLedgerTable, TrialBalanceTable } from "./LedgerTable";
import { PostingRulesTable } from "./PostingRulesTable";
import { ReportPageHeader } from "./ReportPageHeader";
import { ReportDataBoundary, ReportDataLoading, ReportDataRegion, useReportNavigate } from "./ReportNavigation";
import { ReportIcon } from "./ReportIcons";
import { SearchableSelect } from "./SearchableSelect";
import { ACCOUNT_TYPES, ledgerHref, ledgerSearchParam } from "./ledger-table-utils";
import "./ledger-tables.css";

type LedgerData = Awaited<ReturnType<typeof getGeneralLedger>>;
type LedgerOptions = LedgerAccountFilters & { from: string; to: string; page: number };

function SearchField({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return <label className="report-account-search"><ReportIcon name="search" /><span className="sr-only">{label}</span><input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={label} /></label>;
}

export function TrialBalanceWorkspace({ asOf, data }: { asOf: string; data: Promise<TbRow[]> }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [showZero, setShowZero] = useState(true);
  const filtered = query !== "" || type !== "all" || !showZero;
  return <article className="report-page ledger-page">
    <ReportPageHeader title="Trial Balance" description="Chicago Brass Inc. / Posted ledger / USD" />
    <DateFilter to={asOf} asOfOnly>
      <div className="control-bar-actions">
        <SearchableSelect label="Account type" value={type} options={[{ value: "all", label: "All types" }, ...Object.entries(ACCOUNT_TYPES).map(([value, label]) => ({ value, label }))]} onChange={setType} />
        <label className="ledger-checkbox" title="Include accounts with no debit, credit or balance."><input type="checkbox" checked={showZero} onChange={event => setShowZero(event.target.checked)} />Include zero activity</label>
        <SearchField value={query} onChange={setQuery} label="Search accounts" />
        <button type="button" className="btn btn-quiet control-reset" disabled={!filtered} onClick={() => { setQuery(""); setType("all"); setShowZero(true); }}>Reset filters</button>
      </div>
    </DateFilter>
    <ReportDataRegion><ReportDataBoundary resetKey={data}><Suspense fallback={<ReportDataLoading label="Loading trial balance" />}><TrialBalanceData data={data} asOf={asOf} query={query} type={type} showZero={showZero} /></Suspense></ReportDataBoundary></ReportDataRegion>
  </article>;
}

function TrialBalanceData({ data, ...props }: { data: Promise<TbRow[]>; asOf: string; query: string; type: string; showZero: boolean }) {
  return <TrialBalanceTable rows={use(data)} {...props} />;
}

export function GeneralLedgerWorkspace({ options, data, accountData }: { options: LedgerOptions; data: Promise<LedgerData>; accountData: Promise<LedgerAccountOption[]> }) {
  const navigate = useReportNavigate();
  const [scope, setScope] = useState(options);
  const scopeValue = useRef(options);
  const committedOptions = useRef(options);
  committedOptions.current = options;
  const requestedHref = useRef<string | null>(null);
  const [draft, setDraft] = useState(options.query ?? "");
  const draftValue = useRef(draft);
  const searchFocused = useRef(false);
  const submittedSearch = useRef(options.query ?? "");
  const updateDraft = (value: string) => { draftValue.current = value; setDraft(value); };
  const [accounts, setAccounts] = useState<LedgerAccountOption[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const committed = ledgerHref(options);
  useEffect(() => {
    // An earlier response cannot replace filters that the user has already changed again.
    if (requestedHref.current && committed !== requestedHref.current) return;
    requestedHref.current = null;
    scopeValue.current = options;
    setScope(options);
    if (!searchFocused.current || draftValue.current === submittedSearch.current) updateDraft(options.query ?? "");
  }, [committed, options]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const restore = () => {
      requestedHref.current = null;
      scopeValue.current = committedOptions.current;
      setScope(committedOptions.current);
      updateDraft(committedOptions.current.query ?? "");
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    let current = true;
    accountData.then(rows => { if (current) { setAccounts(rows); setUnavailable(false); } }).catch(() => { if (current) setUnavailable(true); });
    return () => { current = false; };
  }, [accountData]);
  const change = (changes: Partial<LedgerOptions>) => {
    const current = scopeValue.current;
    const next = { ...current, page: 1, query: ledgerSearchParam(draftValue.current), ...changes };
    if (next.from === current.from && next.to === current.to && next.account === current.account && next.offset === current.offset && ledgerSearchParam(next.query) === ledgerSearchParam(current.query) && (next.side ?? "all") === (current.side ?? "all")) return;
    const href = ledgerHref(next);
    if (href === requestedHref.current) return;
    scopeValue.current = next;
    setScope(next);
    requestedHref.current = href;
    submittedSearch.current = next.query ?? "";
    navigate(href);
  };
  const search = () => change({ query: ledgerSearchParam(draftValue.current) });
  const preserve = { account: scope.account, offset: scope.offset, q: ledgerSearchParam(draft), side: scope.side === "all" ? undefined : scope.side };
  const filtered = !!scope.account || !!scope.offset || !!scope.query || scope.side && scope.side !== "all";
  return <article className="report-page ledger-page">
    <ReportPageHeader title="General Ledger" description="Chicago Brass Inc. / Posted ledger / USD" />
    <DateFilter from={scope.from} to={scope.to} preserve={preserve} onRangeChange={range => change({ from: range.from ?? scopeValue.current.from, to: range.to })}>
      <LedgerAccountFilter from={scope.from} to={scope.to} account={scope.account} offset={scope.offset} query={scope.query} side={scope.side} accounts={accounts} unavailable={unavailable} onChange={change} />
      <div className="ledger-side-controls" role="group" aria-label="Entry side">
        {[{ value: "all", label: "All" }, { value: "debit", label: "Debits" }, { value: "credit", label: "Credits" }].map(item => <button key={item.value} type="button" aria-pressed={(scope.side ?? "all") === item.value} onClick={() => change({ side: item.value as "all" | "debit" | "credit" })}>{item.label}</button>)}
      </div>
      <form className="ledger-global-search" role="search" onSubmit={event => { event.preventDefault(); search(); }}>
        <label className="report-account-search"><ReportIcon name="search" /><span className="sr-only">Search all ledger records</span><input name="q" type="search" maxLength={200} value={draft} placeholder="Search all records" onChange={event => updateDraft(event.target.value)} onFocus={() => { searchFocused.current = true; }} onBlur={() => { searchFocused.current = false; search(); }} /></label>
        <button type="submit" className="btn btn-quiet" aria-label="Apply ledger search"><ReportIcon name="search" /><span className="ledger-search-button-label">Search</span></button>
      </form>
      <button type="button" className="btn btn-quiet control-reset" disabled={!filtered} onClick={() => { updateDraft(""); change({ account: undefined, offset: undefined, query: undefined, side: "all" }); }}>Reset filters</button>
    </DateFilter>
    {options.from > options.to && <div className="report-alerts" role="status"><p className="check check-bad">Start date is later than end date. Choose a valid date range.</p></div>}
    <ReportDataRegion><ReportDataBoundary resetKey={data}><Suspense fallback={<ReportDataLoading label="Loading ledger records" />}><GeneralLedgerData data={data} options={options} /></Suspense></ReportDataBoundary></ReportDataRegion>
  </article>;
}

function GeneralLedgerData({ data, options }: { data: Promise<LedgerData>; options: LedgerOptions }) {
  const result = use(data);
  return <GeneralLedgerTable {...options} rows={result.rows} hasNext={result.hasNext} page={result.page} pageSize={result.pageSize} />;
}

const CATEGORIES = [{ value: "all", label: "All categories" }, { value: "expense", label: "Expenses" }, { value: "payment", label: "Payments" }, { value: "invoice_entry", label: "Invoice Entry" }, { value: "other", label: "Other Transactions" }];

export function PostingRulesWorkspace({ asOf, data }: { asOf: string; data: Promise<TChartRow[]> }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  return <article className="report-page ledger-page">
    <ReportPageHeader title="T-Chart" description="Chicago Brass Inc. / Posting rules" />
    <div className="report-filters dashboard-control-bar no-print" aria-label="Posting rule filters">
      <SearchableSelect label="Category" value={category} options={CATEGORIES} onChange={setCategory} />
      <SearchField value={query} onChange={setQuery} label="Search rules or accounts" />
      <button type="button" className="btn btn-quiet control-reset" disabled={!query && category === "all"} onClick={() => { setQuery(""); setCategory("all"); }}>Reset filters</button>
    </div>
    <ReportDataRegion><ReportDataBoundary resetKey={data}><Suspense fallback={<ReportDataLoading label="Loading posting rules" />}><PostingRulesData data={data} asOf={asOf} query={query} category={category} /></Suspense></ReportDataBoundary></ReportDataRegion>
  </article>;
}

function PostingRulesData({ data, ...props }: { data: Promise<TChartRow[]>; asOf: string; query: string; category: string }) {
  return <PostingRulesTable rules={use(data)} {...props} />;
}
