import { expenseWorkerFields as E, invoiceWorkerFields as I, paymentWorkerFields as P, INVOICE_MANUAL_FIELD } from "../definitions.ts";
import type { AirtableClient, AirtableRecord } from "../airtable.ts";
import type { CategoryDefinition } from "../types.ts";

// Share the exclusion before category calculations, including full-payment and targeted calls.
export async function hasManualInvoice(client: AirtableClient, category: CategoryDefinition, source: AirtableRecord): Promise<boolean> {
  const ids = (record: AirtableRecord, field: string): string[] => (record.value(field) || []).map((link: { id: string }) => link.id);
  if (category.tableId === I.TABLES.invoices) return ids(source, INVOICE_MANUAL_FIELD).length > 0;
  let invoiceIds: string[] = [];
  if (category.tableId === E.TABLES.lines) invoiceIds = ids(source, E.LINE_FIELDS.invoices);
  else if (category.tableId === E.TABLES.payments) {
    invoiceIds = ids(source, E.PAYMENT_FIELDS.invoices);
    if (category.code === "PAY-09") {
      const minis = await client.readRecords(E.TABLES.payments, ids(source, P.PAYMENT_FIELDS.miniPayments), [E.PAYMENT_FIELDS.invoices, P.PAYMENT_FIELDS.accounts]);
      invoiceIds.push(...minis.flatMap(mini => ids(mini, E.PAYMENT_FIELDS.invoices)));
    }
  } else if (category.tableId === E.TABLES.prepay) invoiceIds = ids(source, E.PREPAY_FIELDS.invoices);
  else if (category.tableId === I.TABLES.shipping) {
    const transactionIds = ids(source, I.SHIPPING_FIELDS.transactions);
    if (transactionIds.length !== 1) return false; // The shipping handler reports ambiguous ownership.
    const transactions = await client.readRecords(I.TABLES.transactions, transactionIds, Object.values(I.TRANSACTION_FIELDS));
    invoiceIds = transactions.flatMap(transaction => ids(transaction, I.TRANSACTION_FIELDS.invoices));
  }
  if (!invoiceIds.length) return false;
  const fields = category.module === "expenses" ? E.INVOICE_FIELDS : category.module === "payments" ? P.INVOICE_FIELDS : I.INVOICE_FIELDS;
  const invoices = await client.readRecords(I.TABLES.invoices, invoiceIds, Object.values(fields));
  return invoices.some(invoice => ids(invoice, INVOICE_MANUAL_FIELD).length > 0);
}
