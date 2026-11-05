"use client";

import { useEffect, useRef, useState } from "react";
import type { LedgerAccountFilters, LedgerAccountOption, TbRow, TChartRow, getGeneralLedger } from "@/lib/reports/ledger";
import { DateFilter } from "./DateFilter";
import { LedgerAccountFilter } from "./LedgerAccountFilter";
import { GeneralLedgerTable, TrialBalanceTable } from "./LedgerTable";
import { PostingRulesTable } from "./PostingRulesTable";
import { ReportPageHeader } from "./ReportPageHeader";
import { useReportNavigate } from "./ReportNavigation";
import type { ReportQuery } from "./ReportData";
import { ReportDataPanel } from "./ReportDataPanel";
import { ReportIcon } from "./ReportIcons";
import { SearchableSelect } from "./SearchableSelect";
import { FilterBar, SearchField, SegmentedControl } from "./FilterControls";
import { ACCOUNT_TYPES, ledgerHref, ledgerSearchParam } from "./ledger-table-utils";
import "./ledger-tables.css";

type LedgerData = Awaited<ReturnType<typeof getGeneralLedger>>;
type LedgerOptions = LedgerAccountFilters & { from: string; to: string; page: number };

export function TrialBalanceWorkspace({ asOf, data }: { asOf: string; data: ReportQuery<TbRow[]> }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [showZero, setShowZero] = useState(true);
  const filtered = query !== "" || type !== "all" || !showZero;
  return <article className="report-page ledger-page">
    <ReportPageHeader title="Trial Balance" description="Chicago Brass Inc. / Posted ledger / USD" />
    <DateFilter to={asOf} asOfOnly>
      <div className="control-bar-actions">
        <SearchableSelect label="Account type" value={type} options={[{ value: "all", label: "All types" }, ...Object.entries(ACCOUNT_TYPES).map(([value, label]) => ({ value, label }))]} onChange={setType} />
        <SegmentedControl label="Accounts" value={showZero} options={[{ value: true, label: "All" }, { value: false, label: "With activity" }]} onChange={setShowZero} />
        <SearchField value={query} onChange={setQuery} label="Search accounts" placeholder="Name or account number" />
        <button type="button" className="btn btn-quiet control-reset" disabled={!filtered} onClick={() => { setQuery(""); setType("all"); setShowZero(true); }}>Reset filters</button>
      </div>
    </DateFilter>
    <ReportDataPanel query={data} label="Loading trial balance">{data.data && <TrialBalanceTable rows={data.data} asOf={asOf} query={query} type={type} showZero={showZero} />}</ReportDataPanel>
  </article>;
}

export function GeneralLedgerWorkspace({ options, data, accountData }: { options: LedgerOptions; data: ReportQuery<LedgerData>; accountData: ReportQuery<LedgerAccountOption[]> }) {
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
  const accounts = accountData.data ?? [];
  const unavailable = accountData.error;
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
      <SegmentedControl label="Entry side" value={scope.side ?? "all"} options={[{ value: "all", label: "All" }, { value: "debit", label: "Debits" }, { value: "credit", label: "Credits" }]} onChange={side => change({ side })} />
      <form className="ledger-global-search" role="search" onSubmit={event => { event.preventDefault(); search(); }}>
        <SearchField label="Search all ledger records" name="q" maxLength={200} value={draft} placeholder="Search all records" onChange={updateDraft} onFocus={() => { searchFocused.current = true; }} onBlur={() => { searchFocused.current = false; search(); }} />
        <button type="submit" className="btn btn-quiet" aria-label="Apply ledger search"><ReportIcon name="search" /><span className="ledger-search-button-label">Search</span></button>
      </form>
      <button type="button" className="btn btn-quiet control-reset" disabled={!filtered} onClick={() => { updateDraft(""); change({ account: undefined, offset: undefined, query: undefined, side: "all" }); }}>Reset filters</button>
    </DateFilter>
    {options.from > options.to && <div className="report-alerts" role="status"><p className="check check-bad">Start date is later than end date. Choose a valid date range.</p></div>}
    <ReportDataPanel query={data} label="Loading ledger records">{data.data && <GeneralLedgerTable {...options} rows={data.data.rows} hasNext={data.data.hasNext} page={data.data.page} pageSize={data.data.pageSize} />}</ReportDataPanel>
  </article>;
}

const CATEGORIES = [{ value: "all", label: "All categories" }, { value: "expense", label: "Expenses" }, { value: "payment", label: "Payments" }, { value: "invoice_entry", label: "Invoice Entry" }, { value: "other", label: "Other Transactions" }];

export function PostingRulesWorkspace({ asOf, data }: { asOf: string; data: ReportQuery<TChartRow[]> }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  return <article className="report-page ledger-page">
    <ReportPageHeader title="T-Chart" description="Chicago Brass Inc. / Posting rules" />
    <FilterBar className="no-print" label="Posting rule filters">
      <SearchableSelect label="Category" value={category} options={CATEGORIES} onChange={setCategory} />
      <SearchField value={query} onChange={setQuery} label="Search rules or accounts" placeholder="Rule, description or account" />
      <button type="button" className="btn btn-quiet control-reset" disabled={!query && category === "all"} onClick={() => { setQuery(""); setCategory("all"); }}>Reset filters</button>
    </FilterBar>
    <ReportDataPanel query={data} label="Loading posting rules">{data.data && <PostingRulesTable rules={data.data} asOf={asOf} query={query} category={category} />}</ReportDataPanel>
  </article>;
}
