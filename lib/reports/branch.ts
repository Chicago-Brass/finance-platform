export const REPORT_BRANCHES = ["Chicago", "Minneapolis", "Milwaukee", "Overhead"] as const;

export function branchParam(value: unknown): string | undefined {
  return typeof value === "string" && REPORT_BRANCHES.some(branch => branch === value) ? value : undefined;
}

export function branchLabel(value?: string) { return value || "Consolidated"; }
