import type { Sql } from "npm:postgres@3.4.9";
import { reverseJournals, type ReversalRequest } from "./reversal.ts";
import { syncLedgerLinks, LedgerWritebackError } from "../_shared/ledger-links.ts";

export async function reverseAndSync(sql: Sql, request: ReversalRequest, token: string, fetcher: typeof fetch = fetch) {
  if (!token) throw new LedgerWritebackError();
  const result = await reverseJournals(sql, request);
  if (result.status) return result;
  const links = await syncLedgerLinks(sql, result.source, token, fetcher);
  return { ...result, journalEntryIds: links.journalEntryIds, reversalJournalEntryIds: links.reversalJournalEntryIds, ledgerPostings: links.postings };
}
