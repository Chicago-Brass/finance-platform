import type { LedgerStore, LedgerReference } from "./types.ts";
import { BudgetExceeded, RetryableError } from "./retry.ts";

export class WritebackError extends Error {}

export async function writeBack(ledger: LedgerStore, tableId: string, recordId: string): Promise<LedgerReference[]> {
  try { return await ledger.syncLinks(tableId, recordId); } catch (error) {
    if (error instanceof BudgetExceeded || error instanceof RetryableError) throw error;
    throw new WritebackError(error instanceof Error ? error.message : "Posting metadata writeback failed.");
  }
}
