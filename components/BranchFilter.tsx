"use client";

import { NO_BRANCH, REPORT_BRANCHES, branchLabel } from "@/lib/reports/branch";
import { useSearchParams } from "next/navigation";
import { useReportNavigate } from "./ReportNavigation";
import { SearchableSelect } from "./SearchableSelect";

const BRANCHES = ["", ...REPORT_BRANCHES, NO_BRANCH].map(value => ({ value, label: branchLabel(value) }));

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
