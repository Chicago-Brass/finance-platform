import type { Sql } from "npm:postgres@3.4.9";
import { postPayment, type LedgerPaymentEvent } from "./ledger.ts";
import { LINK_FIELDS, syncLedgerLinks, validateLinkSource, LedgerWritebackError, type LedgerSource } from "../_shared/ledger-links.ts";

// Keep the native posting contract; only Payments and Invoices have approved backlink fields.
export async function postAndSync(sql: Sql, event: LedgerPaymentEvent, token: string, fetcher: typeof fetch = fetch, options: { allowAdditionalCategories?: boolean; deadline?: number } = {}) {
  const source: LedgerSource | undefined = event.source ?? (event.depreciationRecordId || event.prepayLogRecordId ? undefined :
    event.invoiceRecordId ? { tableId: "tbldQXuqNEp8G5pfs", recordId: event.invoiceRecordId } :
    event.paymentRecordId ? { tableId: "tblR61NG9i0giid28", recordId: event.paymentRecordId } : undefined);
  const sync = source && Object.hasOwn(LINK_FIELDS, source.tableId);
  if (sync) validateLinkSource(source);
  if (sync && !token) throw new LedgerWritebackError();
  const result = await postPayment(sql, event, { allowAdditionalCategories: options.allowAdditionalCategories });
  if (!sync || result.status) return result;
  const newJournalIds = result.results.flatMap(row => row.status === "posted" && row.journalEntryId ? [row.journalEntryId] : []);
  const links = await syncLedgerLinks(sql, source, token, fetcher, options.deadline, newJournalIds);
  if (result.journalEntryIds.some(id => !links.journalEntryIds.includes(id))) throw new LedgerWritebackError();
  return { ...result, ledgerPostings: links.postings };
}
