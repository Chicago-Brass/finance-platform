import { createCategories as paymentCategories } from "./payments.js";
import { createCategories as invoiceCategories } from "./invoice-entry.js";
import { createCategories as currentExpenseCategories } from "./expenses.js";
import { createCategories as manualCategories } from "./manual-journals.ts";
import { hasManualInvoice } from "./manual-exclusion.ts";
import { AirtableClient, AirtableRecord } from "../airtable.ts";
import { paymentWorkerFields, POSTING_FIELDS, invoiceWorkerFields, expenseWorkerFields, MANUAL_TABLE, MANUAL_FIELDS } from "../definitions.ts";
import type { CategoryDefinition } from "../types.ts";
import type { LedgerPaymentEvent } from "../../ledger-payment/ledger.ts";
import { expectedPaymentRecordType } from "../rules/common.ts";

export function accountingDate(value: unknown): string {
  if (typeof value !== "string" || !value) throw new Error("The category's accounting date is missing.");
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("The category's accounting date is invalid.");
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function createCategoryEvaluator(client: AirtableClient, readDepositBalance?: (invoiceRecordId: string) => Promise<number>) {
  const modules = { payments: paymentCategories(client), "invoice-entry": invoiceCategories(client, readDepositBalance),
    expenses: currentExpenseCategories(client), manual: manualCategories(client) };
  return async (category: CategoryDefinition, source: AirtableRecord): Promise<LedgerPaymentEvent | null> => {
    if (category.module !== "manual" && await hasManualInvoice(client, category, source)) return null;
    return evaluateSourceCategory(modules, category, source);
  };
}

async function evaluateSourceCategory(modules: any, category: CategoryDefinition, source: AirtableRecord): Promise<LedgerPaymentEvent | null> {
  if (category.tableId === expenseWorkerFields.TABLES.payments && source.text(expenseWorkerFields.PAYMENT_FIELDS.recordType) !== expectedPaymentRecordType(category.code)) return null;
  const module=modules[category.module];
  if(!module)throw new Error(`No category module ${category.module}.`);
  const {data,results}=await module.evaluate(category.code, source.id, category.tableId);
  const matches=results.filter((result:any)=>result.postings.some((posting:any)=>Number(posting.amount)!==0));
  if(!matches.length)return null;
  if (["expenses", "invoice-entry", "payments", "manual"].includes(category.module)) {
    const tables = expenseWorkerFields.TABLES;
    const identities: Record<string, string> = {
      [tables.invoices]: "invoiceRecordId", [tables.lines]: "invoiceLineRecordId",
      [tables.payments]: "paymentRecordId", [tables.prepay]: "prepayLogRecordId",
      [tables.depreciation]: "depreciationRecordId", [invoiceWorkerFields.TABLES.shipping]: "shippingRecordId",
      [MANUAL_TABLE]: "manualJournalRecordId",
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
      : category.tableId === paymentWorkerFields.TABLES.lines ? paymentWorkerFields.LINE_FIELDS : null;
    if (!fields) throw new Error(`Unsupported Payment source table ${category.tableId}.`);
    return [...new Set([...Object.values(fields), ...Object.values(control ?? {})])];
  }
  throw new Error(`Unsupported category module ${category.module}.`);
}
