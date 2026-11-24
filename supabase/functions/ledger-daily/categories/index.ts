import { createCategories as paymentCategories } from "./payments.js";
import { createCategories as invoiceCategories } from "./invoice-entry.js";
import { createCategories as currentExpenseCategories } from "./expenses.js";
import { createCategories as manualCategories } from "./manual-journals.ts";
import { prefetchJournalDisplay } from "./journal-display.ts";
import { hasManualInvoice } from "./manual-exclusion.ts";
import { AirtableClient, AirtableRecord } from "../airtable.ts";
import { paymentWorkerFields, POSTING_FIELDS, invoiceWorkerFields, expenseWorkerFields, LINKED_SETTLEMENT_FIELDS, MANUAL_TABLE, MANUAL_FIELDS, LOAN_RECORDS, LOAN_SOURCE_FIELDS } from "../definitions.ts";
import type { CategoryDefinition } from "../types.ts";
import type { LedgerPaymentEvent } from "../../ledger-payment/ledger.ts";
import type { readCustomerBalance } from "../../_shared/customer-credit.ts";
import { expectedPaymentRecordType } from "../rules/common.ts";

export function accountingDate(value: unknown): string {
  if (typeof value !== "string" || !value) throw new Error("The category's accounting date is missing.");
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("The category's accounting date is invalid.");
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function createCategoryEvaluator(client: AirtableClient, readRemainingDeposit?: (invoiceRecordId: string, depositCents: number) => Promise<number>, customerBalance?: ReturnType<typeof readCustomerBalance>) {
  const modules = { payments: paymentCategories(client, customerBalance), "invoice-entry": invoiceCategories(client, readRemainingDeposit, customerBalance),
    expenses: currentExpenseCategories(client), manual: manualCategories(client) };
  return async (category: CategoryDefinition, source: AirtableRecord, repost = false): Promise<LedgerPaymentEvent | null> => {
    if (category.module !== "manual" && await hasManualInvoice(client, category, source)) return null;
    return evaluateSourceCategory(modules, category, source, repost);
  };
}

async function evaluateSourceCategory(modules: any, category: CategoryDefinition, source: AirtableRecord, repost: boolean): Promise<LedgerPaymentEvent | null> {
  if (category.tableId === expenseWorkerFields.TABLES.payments && source.text(expenseWorkerFields.PAYMENT_FIELDS.recordType) !== expectedPaymentRecordType(category.code)) return null;
  const module=modules[category.module];
  if(!module)throw new Error(`No category module ${category.module}.`);
  const {data,results}=await module.evaluate(category.code, source.id, category.tableId, repost);
  const matches=results.filter((result:any)=>result.postings.some((posting:any)=>Number(posting.amount)!==0));
  if(!matches.length)return null;
  if (category.module !== "manual" && matches.some(({ postings }: LedgerPaymentEvent["categories"][number]) =>
    postings.some(({ debitAccount, creditAccount }) => debitAccount.number === "231.100" || creditAccount.number === "231.100"))) {
    throw new Error("Credit Card Clearing (231.100) is retired for automatic posting. Select AMEX (231.101) or Chase (231.102) in FIN.");
  }
  if (["expenses", "invoice-entry", "payments", "manual"].includes(category.module)) {
    const tables = expenseWorkerFields.TABLES;
    const identities: Record<string, string> = {
      [tables.invoices]: "invoiceRecordId", [tables.lines]: "invoiceLineRecordId",
      [tables.payments]: "paymentRecordId", [tables.prepay]: "prepayLogRecordId",
      [tables.depreciation]: "depreciationRecordId", [invoiceWorkerFields.TABLES.shipping]: "shippingRecordId",
      [MANUAL_TABLE]: "manualJournalRecordId", [LOAN_RECORDS.table]: "loanRecordId",
    };
    const identity = identities[category.tableId];
    if (!identity) throw new Error(`Unsupported source table ${category.tableId}.`);
    return {
      [identity]: source.id,
      ...(data.customerSettlement ? { customerSettlement: data.customerSettlement } : {}),
      ...(category.tableId === invoiceWorkerFields.TABLES.shipping ? { depositInvoiceAmountCents: data.depositInvoiceAmountCents } : {}),
      ...(category.tableId === tables.payments ? { paymentName: source.name } : {}),
      eventType: category.eventType, entryDate: accountingDate(data.entryDate),
      source: { tableId: category.tableId, recordId: source.id, recordName: source.name },
      referenceNumber: category.tableId === tables.payments ? source.text(expenseWorkerFields.PAYMENT_FIELDS.reference) : source.id,
      categories: matches.map((result:any) => ({ ruleCode: result.ruleCode ?? category.code, entryKey: result.entryKey,
        transactionType: result.category.trim().replace(/[\u2013\u2014]/g, "-"), postings: result.postings,
        ...(result.notes ? { notes: result.notes } : {}) })),
    };
  }
  throw new Error(`Unsupported category module ${category.module}.`);
}

export function sourceFields(category: CategoryDefinition): string[] {
  const control = POSTING_FIELDS[category.tableId as keyof typeof POSTING_FIELDS];
  if (category.module === "manual") return Object.values(MANUAL_FIELDS);
  if (category.module === "expenses") {
    const fieldsByTable: Record<string, Readonly<Record<string, string>>> = {
      [expenseWorkerFields.TABLES.invoices]: expenseWorkerFields.INVOICE_FIELDS,
      [expenseWorkerFields.TABLES.lines]: expenseWorkerFields.LINE_FIELDS,
      [expenseWorkerFields.TABLES.payments]: expenseWorkerFields.PAYMENT_FIELDS,
      [expenseWorkerFields.TABLES.prepay]: expenseWorkerFields.PREPAY_FIELDS,
      [expenseWorkerFields.TABLES.depreciation]: expenseWorkerFields.DEPRECIATION_FIELDS,
    };
    const fields = fieldsByTable[category.tableId];
    if (!fields) throw new Error(`Unsupported Expense source table ${category.tableId}.`);
    return [...new Set([...Object.values(fields), ...Object.values(control ?? {})])];
  }
  if (category.module === "invoice-entry") {
    const fields = category.tableId === invoiceWorkerFields.TABLES.invoices ? invoiceWorkerFields.INVOICE_FIELDS
      : category.tableId === invoiceWorkerFields.TABLES.payments ? invoiceWorkerFields.PAYMENT_FIELDS
      : category.tableId === invoiceWorkerFields.TABLES.shipping ? invoiceWorkerFields.SHIPPING_FIELDS : null;
    if (!fields) throw new Error(`Unsupported Invoice Entry source table ${category.tableId}.`);
    return [...new Set([...Object.values(fields), ...Object.values(control ?? {})])];
  }
  if (category.module === "payments") {
    const fields = category.tableId === paymentWorkerFields.TABLES.invoices ? paymentWorkerFields.INVOICE_FIELDS
      : category.tableId === paymentWorkerFields.TABLES.payments ? paymentWorkerFields.PAYMENT_FIELDS
      : category.tableId === paymentWorkerFields.TABLES.lines ? paymentWorkerFields.LINE_FIELDS
      : category.tableId === LOAN_RECORDS.table ? LOAN_SOURCE_FIELDS : null;
    if (!fields) throw new Error(`Unsupported Payment source table ${category.tableId}.`);
    return [...new Set([...Object.values(fields), ...Object.values(control ?? {})])];
  }
  throw new Error(`Unsupported category module ${category.module}.`);
}

export async function prefetchInvoiceContext(client: AirtableClient, category: CategoryDefinition, sources: AirtableRecord[], includeDisplay = false) {
  const { TABLES: tables, INVOICE_FIELDS: invoice, PAYMENT_FIELDS: payment, LINE_FIELDS: line,
    PREPAY_FIELDS: prepay, ACCOUNT_FIELDS: account } = expenseWorkerFields;
  const invoiceFields = category.module === "expenses" ? expenseWorkerFields.INVOICE_FIELDS
    : category.module === "payments" ? paymentWorkerFields.INVOICE_FIELDS : invoiceWorkerFields.INVOICE_FIELDS;
  const linked = (rows: typeof sources, field: string) => rows.flatMap(row =>
    (row.value(field) ?? []).map((link: { id: string }) => link.id));
  const prefetch = (table: string, ids: string[], fields: readonly string[]) =>
    // At most one optional request at each level. Larger relationships load on demand.
    ids.length ? client.readRecords(table, [...new Set(ids)].slice(0, 40), fields, false) : Promise.resolve([]);
  const { tableId } = category;
  if (tableId === invoiceWorkerFields.TABLES.shipping) {
    const { TABLES: shippingTables, SHIPPING_FIELDS: shipping, TRANSACTION_FIELDS: transaction } = invoiceWorkerFields;
    const transactions = await prefetch(shippingTables.transactions, linked(sources, shipping.transactions), Object.values(transaction));
    await prefetch(shippingTables.invoices, linked(transactions, transaction.invoices), Object.values(invoiceFields));
    return;
  }
  const parentField = tableId === tables.payments ? payment.invoices : tableId === tables.lines ? line.invoices
    : tableId === tables.prepay ? prepay.invoices : null;
  const invoices = tableId === tables.invoices ? sources
    : parentField ? await prefetch(tables.invoices, linked(sources, parentField), Object.values(invoiceFields)) : [];
  await prefetch(tables.accounts, [
    ...linked(invoices, invoice.accounts),
    ...(tableId === tables.payments ? linked(sources, payment.accounts)
      : tableId === tables.lines && category.module === "expenses" ? linked(sources, line.accounts) : []),
  ], Object.values(account));
  if (category.code === "PAY-10" || category.code === "PAY-16") {
    await prefetch(tables.payments, linked(invoices, invoiceFields.payments), LINKED_SETTLEMENT_FIELDS);
  }
  if (includeDisplay && invoices.length) await prefetchJournalDisplay(client, invoices, tableId !== tables.payments);
}
