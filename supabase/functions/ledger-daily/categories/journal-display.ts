import type { AirtableClient, AirtableRecord } from "../airtable.ts";
import { expenseWorkerFields } from "../definitions.ts";
import type { LedgerPaymentEvent, LedgerPosting } from "../../ledger-payment/ledger.ts";

const { TABLES, INVOICE_FIELDS } = expenseWorkerFields;
const invoiceShortField = "fld0fjHao1e7VIu76"; // Invoice ID (Short)

function linkedIds(postings: LedgerPosting[], single: keyof LedgerPosting, plural: keyof LedgerPosting): string[] {
  return [...new Set(postings.flatMap(posting => [
    posting[single],
    ...(Array.isArray(posting[plural]) ? posting[plural] : []),
  ]).filter((id): id is string => typeof id === "string" && id !== ""))];
}

export async function prefetchJournalDisplay(client: AirtableClient, invoices: AirtableRecord[], includeReferences: boolean) {
  if (includeReferences && client.table(TABLES.invoices).fields.some(field => field.id === invoiceShortField))
    await client.readRecords(TABLES.invoices, invoices.map(invoice => invoice.id), [invoiceShortField], "optional");
  await client.loadLinkNames(invoices, [INVOICE_FIELDS.clients, INVOICE_FIELDS.vendors], "optional");
}

export async function addJournalDisplay(client: AirtableClient, event: LedgerPaymentEvent): Promise<LedgerPaymentEvent> {
  const source = event.source;
  if (!source) return event;

  const groups = event.categories.map(category => {
    const postings = category.postings.filter(posting => Number(posting.amount) !== 0);
    const invoices = source.tableId === TABLES.invoices ? [source.recordId]
      : linkedIds(postings, "invoiceRecordId", "invoiceRecordIds");
    return {
      category,
      invoice: source.tableId !== TABLES.payments && invoices.length === 1 ? invoices[0] : undefined,
      clients: linkedIds(postings, "clientRecordId", "clientRecordIds"),
      vendors: linkedIds(postings, "vendorRecordId", "vendorRecordIds"),
    };
  });

  const invoiceFields = client.table(TABLES.invoices).fields;
  const names = async (linkField: string, ids: string[]) => {
    const tableId = invoiceFields.find(field => field.id === linkField)?.options?.linkedTableId;
    const rows = tableId && ids.length ? await client.readRecords(tableId, ids, [], "optional") : [];
    return new Map(rows.filter(row => row.name !== row.id).map(row => [row.id, row.name]));
  };

  const invoices = groups.flatMap(group => group.invoice ? [group.invoice] : []);
  const rows = invoices.length && invoiceFields.some(field => field.id === invoiceShortField)
    ? await client.readRecords(TABLES.invoices, invoices, [invoiceShortField], "optional") : [];
  const references = new Map(rows.map(row => [row.id, row.text(invoiceShortField)]));
  const clients = await names(INVOICE_FIELDS.clients, groups.flatMap(group => group.clients));
  const vendors = await names(INVOICE_FIELDS.vendors, groups.flatMap(group => group.vendors));

  const labels = (ids: string[], known: Map<string, string>) => ids.flatMap(id => known.get(id) || []);
  for (const group of groups) {
    group.category.display = {
      clientNames: labels(group.clients, clients),
      vendorNames: labels(group.vendors, vendors),
      referenceNumber: group.invoice ? references.get(group.invoice) : undefined,
    };
  }
  return event;
}
