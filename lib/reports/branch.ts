export const REPORT_BRANCHES = ["Chicago", "Minneapolis", "Milwaukee", "Overhead"] as const;

export const NO_BRANCH = "no-branch";

export function branchParam(value: unknown): string | undefined {
  return typeof value === "string" && (value === NO_BRANCH || REPORT_BRANCHES.some(branch => branch === value)) ? value : undefined;
}

export function branchLabel(value?: string) { return value === NO_BRANCH ? "No branch" : value || "Consolidated"; }
