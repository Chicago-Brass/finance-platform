import { inSyncDateRange } from "../scope.ts";
import { createCategories as sentCategories } from "./payment-sent.js";
import { createCategories as eventCategories } from "./payment-events.js";
import { createCategories as invoiceCategories } from "./invoice-entry.js";
import { createCategories as currentExpenseCategories } from "./expenses.js";
import { AirtableClient, AirtableRecord } from "../airtable.ts";
import { paymentSentFields, paymentEventsFields, POSTING_FIELDS, invoiceWorkerFields, expenseWorkerFields } from "../definitions.ts";
import type { CategoryDefinition } from "../types.ts";
import type { LedgerPaymentEvent } from "../../ledger-payment/ledger.ts";

const { TABLES: T, PAYMENT_FIELDS: P } = paymentSentFields;
const E = paymentEventsFields.PAYMENT_FIELDS;
export function accountingDate(value: unknown): string {
  if (typeof value !== "string" || !value) throw new Error("The category's accounting date is missing.");
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("The category's accounting date is invalid.");
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function createCategoryEvaluator(client: AirtableClient) {
  const modules = { "payment-sent": sentCategories(client), "payment-events": eventCategories(client),
    "invoice-entry": invoiceCategories(client),
    "expenses": currentExpenseCategories(client) };
  return async (category: CategoryDefinition, source: AirtableRecord): Promise<LedgerPaymentEvent | null> => {
    if (!category.code.startsWith("PAY-")) return await evaluateSourceCategory(modules, category, source);
    let inputId = source.id;
    if (category.input === "linked-payment") {
      const ids = (source.value("fldeNFOgl9OBHPlNm") || []).map((link: { id: string }) => link.id);
      const payments = await client.readRecords(T.payments, ids, [...Object.values(P), E.cancelled, POSTING_FIELDS[T.payments].reverse, POSTING_FIELDS[T.payments].reverseDate]);
      const eligible = payments.filter(p => inSyncDateRange(p.text(P.date).slice(0,10), client.dateRange) && p.value(P.sent) && !p.value(E.cancelled) && !p.value(POSTING_FIELDS[T.payments].reverse) && !p.value(POSTING_FIELDS[T.payments].reverseDate));
      eligible.sort((a, b) => b.text(P.date).localeCompare(a.text(P.date)) || a.id.localeCompare(b.id));
      if (!eligible.length) return null;
      // Invoice-owned settlements use the latest eligible Sent payment's date, not Invoice Date.
      inputId = eligible[0].id;
    }
    const module = category.module === "payment-sent" ? modules["payment-sent"] : category.module === "payment-events" ? modules["payment-events"] : undefined;
    if (!module) throw new Error(`No payment category module ${category.module}.`);
    const { data, results } = await module.evaluate(category.code, inputId, category.eventType);
    const matches = results.filter((result: any) => {
      if (category.tableId === T.invoices) return result.invoice?.id === source.id;
      return !result.invoice;
    });
    if (!matches.length || !matches.some((r: any) => r.postings.some((p: any) => Number(p.amount) !== 0))) return null;
    const payment = data.payment;
    const dateField = category.eventType === "cancelled" ? E.cancelledDate : category.eventType === "reconciled" ? E.reconciledDate : P.date;
    return {
      paymentRecordId: payment.id,
      paymentName: payment.name,
      eventType: category.eventType,
      entryDate: accountingDate(payment.value(dateField)),
      source: { tableId: category.tableId, recordId: source.id, recordName: source.name },
      referenceNumber: category.tableId === T.invoices ? source.id : payment.text(P.reference),
      categories: matches.map((result: any) => ({
        ruleCode: category.code,
        entryKey: result.entryKey,
        transactionType: result.category.trim().replace(/[\u2013\u2014]/g, "-"),
        postings: result.postings,
      })),
    };
  };
}

async function evaluateSourceCategory(modules: any, category: CategoryDefinition, source: AirtableRecord): Promise<LedgerPaymentEvent | null> {
  const module=modules[category.module];
  if(!module)throw new Error(`No category module ${category.module}.`);
  const {data,results}=await module.evaluate(category.code, source.id, category.tableId);
  const matches=results.filter((result:any)=>result.postings.some((posting:any)=>Number(posting.amount)!==0));
  if(!matches.length)return null;
  if (category.module === "expenses" || category.module === "invoice-entry") {
    const tables = expenseWorkerFields.TABLES;
    const identities: Record<string, string> = {
      [tables.invoices]: "invoiceRecordId", [tables.lines]: "invoiceLineRecordId",
      [tables.payments]: "paymentRecordId", [tables.prepay]: "prepayLogRecordId",
      [tables.depreciation]: "depreciationRecordId", [invoiceWorkerFields.TABLES.shipping]: "shippingRecordId",
    };
    const identity = identities[category.tableId];
    if (!identity) throw new Error(`Unsupported source table ${category.tableId}.`);
    return {
      [identity]: source.id,
      ...(category.tableId === tables.payments ? { paymentName: source.name } : {}),
      eventType: category.eventType, entryDate: accountingDate(data.entryDate),
      source: { tableId: category.tableId, recordId: source.id, recordName: source.name },
      referenceNumber: category.tableId === tables.payments ? source.text(expenseWorkerFields.PAYMENT_FIELDS.reference) : source.id,
      categories: matches.map((result:any) => ({ ruleCode: category.code, entryKey: result.entryKey,
        transactionType: result.category.trim().replace(/[\u2013\u2014]/g, "-"), postings: result.postings,
        ...(result.notes ? { notes: result.notes } : {}) })),
    };
  }
  throw new Error(`Unsupported category module ${category.module}.`);
}

export function sourceFields(category: CategoryDefinition): string[] {
  const control = POSTING_FIELDS[category.tableId as keyof typeof POSTING_FIELDS];
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
  if (category.tableId === T.invoices) return [...new Set(["fldMZyzqDidRujeZS", "fldeNFOgl9OBHPlNm", "fldbovm1ab4HOZDBe", ...Object.values(control)])];
  return [...new Set([...Object.values(P), ...Object.values(E), ...Object.values(control)])];
}
