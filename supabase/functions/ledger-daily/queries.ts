import { sourceDateFilter } from "./scope.ts";
import { paymentSentFields, paymentEventsFields, POSTING_FIELDS } from "./definitions.ts";
import { PAYMENT_CATEGORIES } from "./rules/payments.ts";
import { EXPENSE_CATEGORIES } from "./rules/expenses.ts";
import { INVOICE_CATEGORIES } from "./rules/invoice-entry.ts";
import { and, expectedPaymentRecordType } from "./rules/common.ts";
import { CHART } from "./rules/chart.ts";
import { MANUAL_CATEGORIES } from "./rules/manual-journals.ts";
import { INVOICE_MANUAL_FIELD } from "./definitions.ts";
import { postedKey } from "../_shared/ledger-links.ts";
import type { CategoryDefinition, FormulaBuilder, RunState } from "./types.ts";
export { and, or } from "./rules/common.ts";
export { PAYMENT_CATEGORIES } from "./rules/payments.ts";
const creditUse = new Set(["PAY-28", "PAY-29"]);
export const CATEGORIES = [
    ...PAYMENT_CATEGORIES.filter(rule => !creditUse.has(rule.code)),
    ...EXPENSE_CATEGORIES, ...INVOICE_CATEGORIES,
    ...PAYMENT_CATEGORIES.filter(rule => creditUse.has(rule.code)),
    ...MANUAL_CATEGORIES,
];
const { TABLES: T, PAYMENT_FIELDS: P } = paymentSentFields, E = paymentEventsFields.PAYMENT_FIELDS;
const nonPaymentAmountRules = new Set(["PAY-11", "EXP-18", "EXP-19", "EXP-20", "EXP-21", "EXP-23", "EXP-26"]);
/** Direct conditions narrow candidates; the category handler validates linked-record conditions. */
export function candidateFormula(category: CategoryDefinition, query: FormulaBuilder, createdFrom?: string, recordId?: string, repost = false): string {
    const fields = POSTING_FIELDS[category.tableId as keyof typeof POSTING_FIELDS];
    const parts = [category.filter(query, repost), repost && !query.dateRange ? "" : sourceDateFilter(category, query), createdFrom ? `CREATED_TIME()>=DATETIME_PARSE(${JSON.stringify(createdFrom)})` : ""].filter(Boolean);
    if (category.tableId === T.payments) parts.push(query.eq(T.payments, P.recordType, expectedPaymentRecordType(category.code)));
    if (fields) {
        if (!repost) parts.push(query.eq(category.tableId, fields.reverse, 0), `${query.field(category.tableId, fields.reverseDate)}=BLANK()`);
        // Targeted retries verify the database and all links even after a partially saved marker.
        if (!recordId && !query.ignorePostingMarkers) {
            const key = postedKey(category.code);
            parts.push(`FIND(${JSON.stringify(JSON.stringify(key))},${query.field(category.tableId, fields.reference)}&"")=0`);
        }
    }
    if (recordId) parts.push(`RECORD_ID()=${JSON.stringify(recordId)}`);
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

export function ownerDiscoveryGroup(query: FormulaBuilder, state: RunState, tableId: string,
    checked: ReadonlySet<string>, enabled?: ReadonlySet<string>) {
    const group: { id: string; formula: string }[] = [];
    let encodedLength = 0;
    for (const id of state.categoryIds.slice(state.categoryIndex)) {
        const category = CATEGORIES.find(rule => rule.id === id);
        if (!category || category.tableId !== tableId || category.status === "deferred" ||
            checked.has(id) || (enabled && !enabled.has(category.code)) ||
            (!state.createdFrom && !sourceDateFilter(category, query))) continue;
        const formula = candidateFormula(category, query, state.createdFrom);
        encodedLength += encodeURIComponent(formula).length + 3;
        // Keep the combined formula comfortably under Airtable's URL limit.
        if (encodedLength > 8000) break;
        group.push({ id, formula });
    }
    return group;
}
