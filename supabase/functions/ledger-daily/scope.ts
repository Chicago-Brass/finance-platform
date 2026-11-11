import { paymentSentFields as F, paymentEventsFields as E, invoiceWorkerFields, depreciationFields, prepayFields } from "./definitions.ts";
import type { CategoryDefinition, FormulaBuilder, SyncDateRange } from "./types.ts";

// Temporary scope: the last 30 UTC calendar days, including today, never Created Time.
export function syncDateRange(now = Date.now()) {
  return { from: new Date(now - 29 * 86_400_000).toISOString().slice(0, 10), to: new Date(now).toISOString().slice(0, 10) };
}
export function inSyncDateRange(date: string, range: SyncDateRange = syncDateRange()) {
  const { from, to } = range;
  return date >= from && date <= to;
}
export function fromStart(q: FormulaBuilder, table: string, field: string) {
  const { from, to } = q.dateRange ?? syncDateRange(), value = q.field(table, field);
  return `AND(${value}>=DATETIME_PARSE("${from}"),${value}<DATEADD(DATETIME_PARSE("${to}"),1,'days'))`;
}
export function sourceDateFilter(category: CategoryDefinition, q: FormulaBuilder): string {
  if (category.tableId === F.TABLES.payments) {
    const field = category.eventType === "cancelled" ? E.PAYMENT_FIELDS.cancelledDate : category.eventType === "reconciled" ? E.PAYMENT_FIELDS.reconciledDate : F.PAYMENT_FIELDS.date;
    return fromStart(q, category.tableId, field);
  }
  if (category.input === "linked-payment") return ""; // The qualifying Payment Date belongs to the linked payment query.
  if (category.tableId === F.TABLES.lines) return ""; // The parent-invoice query constrains Invoice Date; final payload dates are checked again.
  if (category.tableId === F.TABLES.invoices) return fromStart(q, category.tableId, invoiceWorkerFields.INVOICE_FIELDS.date);
  if (category.tableId === depreciationFields.TABLE) return fromStart(q, category.tableId, depreciationFields.FIELDS.date);
  if (category.tableId === prepayFields.TABLE) return fromStart(q, category.tableId, prepayFields.FIELDS.date);
  if (category.tableId === invoiceWorkerFields.TABLES.shipping) return fromStart(q, category.tableId, invoiceWorkerFields.SHIPPING_FIELDS.date);
  throw new Error(`No accounting-date filter for ${category.tableId}.`);
}
