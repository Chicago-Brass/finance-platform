"use client";

import { REPORT_BRANCHES } from "@/lib/reports/branch";
import { useSearchParams } from "next/navigation";
import { useReportNavigate } from "./ReportNavigation";
import { SearchableSelect } from "./SearchableSelect";

const BRANCHES = [{ value: "", label: "Consolidated" }, ...REPORT_BRANCHES.map(branch => ({ value: branch, label: branch }))];

export function BranchFilter({ value, onChange }: { value?: string; onChange?: (value: string | undefined) => void }) {
  const params = useSearchParams(), navigate = useReportNavigate();
  return <SearchableSelect label="Branch" value={value ?? ""} className="branch-filter" options={BRANCHES} onChange={branch => {
    if (onChange) { onChange(branch || undefined); return; }
    const next = new URLSearchParams(params);
    if (branch) next.set("branch", branch); else next.delete("branch");
    next.delete("page");
    navigate(`?${next}`);
  }} />;
}
