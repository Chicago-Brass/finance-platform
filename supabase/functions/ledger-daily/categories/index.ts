import { inSyncDateRange } from "../scope.ts";
import { createCategories as sentCategories } from "./payment-sent.js";
import { createCategories as eventCategories } from "./payment-events.js";
import { createCategories as expenseCategories } from "./expense-entry.js";
import { createCategories as paidExpenseCategories } from "./expense-fully-paid.js";
import { createCategories as invoiceCategories } from "./invoice-entry.js";
import { createCategories as outboundCategories } from "./invoice-created.js";
import { createCategories as depreciationCategories } from "./depreciation-created.js";
import { createCategories as prepayCategories } from "./prepay-created.js";
import { AirtableClient, AirtableRecord } from "../airtable.ts";
import { paymentSentFields, paymentEventsFields, POSTING_FIELDS, expenseFields, paidExpenseFields, invoiceEntryFields, outboundFields, depreciationFields, prepayFields } from "../definitions.ts";
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
    "expense-entry": expenseCategories(client), "expense-fully-paid": paidExpenseCategories(client),
    "invoice-entry": invoiceCategories(client), "invoice-created": outboundCategories(client),
    "depreciation-created": depreciationCategories(client), "prepay-created": prepayCategories(client) };
  return async (category: CategoryDefinition, source: AirtableRecord): Promise<LedgerPaymentEvent | null> => {
    if (!category.code.startsWith("PAY-")) return await evaluateSourceCategory(modules, category, source);
    let inputId = source.id;
    if (category.input === "linked-payment") {
      const ids = (source.value("fldeNFOgl9OBHPlNm") || []).map((link: { id: string }) => link.id);
      const payments = await client.readRecords(T.payments, ids, [...Object.values(P), E.cancelled, POSTING_FIELDS[T.payments].reverse, POSTING_FIELDS[T.payments].reverseDate]);
      const eligible = payments.filter(p => inSyncDateRange(p.text(P.date).slice(0,10)) && p.value(P.sent) && !p.value(E.cancelled) && !p.value(POSTING_FIELDS[T.payments].reverse) && !p.value(POSTING_FIELDS[T.payments].reverseDate));
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
  const {data,results}=await module.evaluate(category.code,source.id);
  const matches=results.filter((result:any)=>result.postings.some((posting:any)=>Number(posting.amount)!==0));
  if(!matches.length)return null;
  const dateField=module.fields.INVOICE_FIELDS?.date??module.fields.SOURCE_FIELDS?.date;
  return {
    ...(data.invoice?{invoiceRecordId:source.id}:category.module==="prepay-created"?{prepayLogRecordId:source.id}:{depreciationRecordId:source.id}),
    eventType:category.eventType,entryDate:accountingDate(source.value(dateField)),
    source:{tableId:category.tableId,recordId:source.id,recordName:source.name},referenceNumber:source.id,
    categories:matches.map((result:any)=>({ruleCode:category.code,entryKey:result.entryKey,
      transactionType:result.category.trim().replace(/[\u2013\u2014]/g,"-"),postings:result.postings,...(result.notes?{notes:result.notes}:{})})),
  };
}

const moduleFields = {
  "expense-entry": expenseFields.INVOICE_FIELDS,
  "expense-fully-paid": paidExpenseFields.INVOICE_FIELDS,
  "invoice-entry": invoiceEntryFields.INVOICE_FIELDS,
  "invoice-created": outboundFields.INVOICE_FIELDS,
  "depreciation-created": depreciationFields.FIELDS,
  "prepay-created": prepayFields.FIELDS,
};
export function sourceFields(category: CategoryDefinition): string[] {
  const control = POSTING_FIELDS[category.tableId as keyof typeof POSTING_FIELDS];
  if (!category.code.startsWith("PAY-")) return [...new Set([...Object.values(moduleFields[category.module as keyof typeof moduleFields]),...Object.values(control??{})])];
  if (category.tableId === T.invoices) return [...new Set(["fldMZyzqDidRujeZS", "fldeNFOgl9OBHPlNm", "fldbovm1ab4HOZDBe", ...Object.values(control)])];
  return [...new Set([...Object.values(P), ...Object.values(E), ...Object.values(control)])];
}
