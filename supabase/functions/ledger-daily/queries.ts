import { sourceDateFilter } from "./scope.ts";
import { paymentSentFields, paymentEventsFields, POSTING_FIELDS } from "./definitions.ts";
import { PAYMENT_CATEGORIES } from "./rules/payments.ts";
import { EXPENSE_CATEGORIES } from "./rules/expenses.ts";
import { INVOICE_CATEGORIES } from "./rules/invoice-entry.ts";
import { and, expectedPaymentRecordType } from "./rules/common.ts";
import { CHART } from "./rules/chart.ts";
import { MANUAL_CATEGORIES } from "./rules/manual-journals.ts";
import { INVOICE_MANUAL_FIELD } from "./definitions.ts";
import type { CategoryDefinition, FormulaBuilder } from "./types.ts";
export { and, or } from "./rules/common.ts";
export { PAYMENT_CATEGORIES } from "./rules/payments.ts";
export const CATEGORIES = [...PAYMENT_CATEGORIES, ...EXPENSE_CATEGORIES, ...INVOICE_CATEGORIES, ...MANUAL_CATEGORIES];
const { TABLES: T, PAYMENT_FIELDS: P } = paymentSentFields, E = paymentEventsFields.PAYMENT_FIELDS;
const nonPaymentAmountRules = new Set(["PAY-11", "PAY-16", "EXP-18", "EXP-19", "EXP-20", "EXP-21", "EXP-23", "EXP-26"]);
/** Direct conditions narrow candidates; the category handler validates linked-record conditions. */
export function candidateFormula(category: CategoryDefinition, query: FormulaBuilder, createdFrom?: string): string {
    const fields = POSTING_FIELDS[category.tableId as keyof typeof POSTING_FIELDS];
    const parts = [category.filter(query), sourceDateFilter(category, query), createdFrom ? `CREATED_TIME()>=DATETIME_PARSE(${JSON.stringify(createdFrom)})` : ""].filter(Boolean);
    if (category.tableId === T.payments) parts.push(query.eq(T.payments, P.recordType, expectedPaymentRecordType(category.code)));
    if (fields)
        parts.push(query.eq(category.tableId, fields.reverse, 0), `${query.field(category.tableId, fields.reverseDate)}=BLANK()`, `FIND(${JSON.stringify(`"${category.code}"`)},${query.field(category.tableId, fields.postings)}&"")=0`);
    if (category.tableId === T.invoices) {
        parts.push(`LEN(${query.field(T.invoices, INVOICE_MANUAL_FIELD)}&"")=0`);
        parts.push(query.eq(T.invoices, POSTING_FIELDS[T.invoices].cancelled, 0));
        if (category.input === "linked-payment")
            parts.push(`${query.field(T.invoices, "fldeNFOgl9OBHPlNm")}!=""`);
    }
    else if (category.tableId === T.payments && category.eventType === "sent") {
        parts.push(query.eq(T.payments, P.sent, 1), query.eq(T.payments, E.cancelled, 0));
    }
    if (category.tableId === T.payments && !nonPaymentAmountRules.has(category.code))
        parts.push(`${query.field(T.payments, P.amount)}!=0`);
    return and(...parts);
}

export const DEFERRED_CATEGORIES = Object.entries(CHART).filter(([,row]) => row.status.toLowerCase() === "not yet").map(([code]) => code);
