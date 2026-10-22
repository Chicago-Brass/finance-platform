/**
 * Balance sheet balances by month-end, account and branch.
 * Empty until a trial balance (Airtable export or the Supabase ledger) is loaded.
 *
 * Shape: BS_BALANCES["2026-09"]["112.100"] = { ALL: 123456.78 }
 * Use branch keys (CHI, MSP, MKE, OVH) when a balance belongs to a branch; ALL = company-wide.
 * Sign: natural balance (assets, liabilities and equity positive; contra accounts negative).
 */
export type BranchKey = "CHI" | "MSP" | "MKE" | "OVH" | "ALL";

export const BS_BALANCES: Record<string, Record<string, Partial<Record<BranchKey, number>>>> = {};
