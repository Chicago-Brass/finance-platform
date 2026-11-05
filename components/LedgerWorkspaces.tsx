"use client";

import { useEffect, useRef, useState } from "react";
import type { LedgerAccountFilters, LedgerAccountOption, LedgerCategoryOption, TbRow, TChartRow, getGeneralLedger } from "@/lib/reports/ledger";
import { DateFilter } from "./DateFilter";
import { LedgerAccountFilter } from "./LedgerAccountFilter";
import { LedgerFilters } from "./LedgerFilters";
import { GeneralLedgerTable, TrialBalanceTable } from "./LedgerTable";
import { PostingRulesTable } from "./PostingRulesTable";
import { ReportPageHeader } from "./ReportPageHeader";
import { useReportNavigate } from "./ReportNavigation";
import type { ReportQuery } from "./ReportData";
import { ReportDataPanel } from "./ReportDataPanel";
import { SearchableSelect } from "./SearchableSelect";
import type { SelectOption } from "./SearchableSelect";
import { FilterBar, SearchField, SegmentedControl } from "./FilterControls";
import { ACCOUNT_TYPES, ledgerHref, ledgerSearchParam, ledgerTypeParam } from "./ledger-table-utils";
import "./ledger-tables.css";

type LedgerData = Awaited<ReturnType<typeof getGeneralLedger>>;
type LedgerOptions = LedgerAccountFilters & { from: string; to: string; page: number };

export function TrialBalanceWorkspace({ asOf, data }: { asOf: string; data: ReportQuery<TbRow[]> }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const filtered = query !== "" || type !== "all";
  return <article className="report-page ledger-page">
    <ReportPageHeader title="Trial Balance" description="Chicago Brass Inc. / Posted ledger / USD" />
    <DateFilter to={asOf} asOfOnly search={<SearchField value={query} onChange={setQuery} label="Search accounts" placeholder="Name or account number" />}>
      <SearchableSelect label="Account type" value={type} options={[{ value: "all", label: "All types" }, ...Object.entries(ACCOUNT_TYPES).map(([value, label]) => ({ value, label }))]} onChange={setType} />
      <button type="button" className="btn btn-quiet control-reset" disabled={!filtered} onClick={() => { setQuery(""); setType("all"); }}>Reset filters</button>
    </DateFilter>
    <ReportDataPanel query={data} label="Loading trial balance">{data.data && <TrialBalanceTable rows={data.data} asOf={asOf} query={query} type={type} />}</ReportDataPanel>
  </article>;
}

export function GeneralLedgerWorkspace({ options, data, countData, accountData, categoryData }: { options: LedgerOptions; data: ReportQuery<LedgerData>; countData: ReportQuery<number>; accountData: ReportQuery<LedgerAccountOption[]>; categoryData: ReportQuery<LedgerCategoryOption[]> }) {
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
  const categoryOptions: SelectOption[] = [{ value: "", label: "All categories" }, ...(categoryData.data ?? []).map(category => ({ value: category.rule_code, label: `${category.rule_code} - ${category.trigger_name}` }))];
  if (scope.category && !categoryOptions.some(option => option.value === scope.category)) categoryOptions.push({ value: scope.category, label: scope.category });
  if (categoryData.error) categoryOptions.push({ value: "unavailable", label: "Choices unavailable - refresh to retry", disabled: true });
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
    if (ledgerHref({ ...next, page: 1 }) === ledgerHref({ ...current, page: 1 })) return;
    const href = ledgerHref(next);
    if (href === requestedHref.current) return;
    scopeValue.current = next;
    setScope(next);
    requestedHref.current = href;
    submittedSearch.current = next.query ?? "";
    navigate(href);
  };
  const search = () => change({ query: ledgerSearchParam(draftValue.current) });
  const preserve = { account: scope.account, offset: scope.offset, q: ledgerSearchParam(draft), side: scope.side === "all" ? undefined : scope.side, type: scope.accountType, category: scope.category, min: scope.min?.toString(), max: scope.max?.toString() };
  const filtered = !!scope.account || !!scope.offset || !!scope.query || scope.side && scope.side !== "all" || !!scope.accountType || !!scope.category || scope.min !== undefined || scope.max !== undefined;
  return <article className="report-page ledger-page">
    <ReportPageHeader title="General Ledger" description="Chicago Brass Inc. / Posted ledger / USD" />
    <DateFilter from={scope.from} to={scope.to} preserve={preserve} onRangeChange={range => change({ from: range.from ?? scopeValue.current.from, to: range.to })} search={<form className="ledger-global-search" role="search" onSubmit={event => { event.preventDefault(); search(); }}>
        <SearchField label="Search all ledger records" name="q" maxLength={200} value={draft} placeholder="Search all records" onChange={updateDraft} onFocus={() => { searchFocused.current = true; }} onBlur={() => { searchFocused.current = false; search(); }} />
      </form>}>
      <SearchableSelect className="ledger-type-select" label="Account type" value={scope.accountType ?? ""} options={[{ value: "", label: "All types" }, ...Object.entries(ACCOUNT_TYPES).map(([value, label]) => ({ value, label }))]} onChange={value => change({ accountType: ledgerTypeParam(value) })} />
      <LedgerAccountFilter from={scope.from} to={scope.to} account={scope.account} offset={scope.offset} query={scope.query} side={scope.side} accounts={accounts} unavailable={unavailable} onChange={change} />
      <SegmentedControl label="Entry side" value={scope.side ?? "all"} options={[{ value: "all", label: "All" }, { value: "debit", label: "Debits" }, { value: "credit", label: "Credits" }]} onChange={side => change({ side })} />
      <LedgerFilters min={scope.min} max={scope.max} category={scope.category} categories={categoryOptions} onChange={change} />
      <button type="button" className="btn btn-quiet control-reset" disabled={!filtered} onClick={() => { updateDraft(""); change({ account: undefined, offset: undefined, query: undefined, side: "all", accountType: undefined, category: undefined, min: undefined, max: undefined }); }}>Reset filters</button>
    </DateFilter>
    {options.from > options.to && <div className="report-alerts" role="status"><p className="check check-bad">Start date is later than end date. Choose a valid date range.</p></div>}
    <ReportDataPanel query={data} label="Loading ledger records">{data.data && <GeneralLedgerTable {...options} accounts={accounts} rows={data.data.rows} hasNext={data.data.hasNext} page={data.data.page} pageSize={data.data.pageSize} total={countData.data} countPending={countData.pending} />}</ReportDataPanel>
  </article>;
}

const CATEGORIES = [{ value: "all", label: "All categories" }, { value: "expense", label: "Expenses" }, { value: "payment", label: "Payments" }, { value: "invoice_entry", label: "Invoice Entry" }, { value: "other", label: "Other Transactions" }];

export function PostingRulesWorkspace({ data }: { data: ReportQuery<TChartRow[]> }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  return <article className="report-page ledger-page">
    <ReportPageHeader title="T-Chart" description="Chicago Brass Inc. / Posting rules" />
    <FilterBar className="no-print" label="Posting rule filters">
      <SearchField value={query} onChange={setQuery} label="Search rules or accounts" placeholder="Rule, description or account" />
      <SearchableSelect label="Category" value={category} options={CATEGORIES} onChange={setCategory} />
      <button type="button" className="btn btn-quiet control-reset" disabled={!query && category === "all"} onClick={() => { setQuery(""); setCategory("all"); }}>Reset filters</button>
    </FilterBar>
    <ReportDataPanel query={data} label="Loading posting rules">{data.data && <PostingRulesTable rules={data.data} query={query} category={category} />}</ReportDataPanel>
  </article>;
}
