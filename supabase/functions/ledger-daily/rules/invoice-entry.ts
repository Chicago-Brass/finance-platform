import { invoiceWorkerFields as F } from "../definitions.ts";
import { and, or } from "./common.ts";
import type { CategoryDefinition, FormulaBuilder } from "../types.ts";
const { TABLES: T, INVOICE_FIELDS: I, PAYMENT_FIELDS: P, SHIPPING_FIELDS: S } = F;
const ar = (q: FormulaBuilder) => q.eq(T.invoices, I.type, "AR");
const product = (q: FormulaBuilder) => and(ar(q), q.eq(T.invoices, I.vendorTypeAR, "AR - Product"));
const deposit = (q: FormulaBuilder) => and(product(q), q.eq(T.invoices, I.kind, "Deposit Invoice"));
const balance = (q: FormulaBuilder) => and(product(q), or(q.eq(T.invoices, I.kind, "Full Invoice"), q.eq(T.invoices, I.kind, "Balance Invoice")));
const asset = (q: FormulaBuilder) => and(q.eq(T.invoices, I.type, "AP"), q.eq(T.invoices, I.vendorTypeAP, "AP - Assets"), q.eq(T.invoices, I.prepaid, 0), q.includes(T.invoices, I.accounts, "143.300"));
const nonProduct = (q: FormulaBuilder) => and(ar(q), q.eq(T.invoices, I.vendorTypeAR, "AR - Non-Product"));
function invoice(code: string, name: string, filter: CategoryDefinition["filter"], extra: Partial<CategoryDefinition> = {}): CategoryDefinition {
    return { id: code, code, name, tableId: T.invoices, module: "invoice-entry", eventType: "entry_requested", input: "record", status: "implemented", filter, ...extra };
}
function payment(code: string, name: string, filter: CategoryDefinition["filter"], extra: Partial<CategoryDefinition> = {}): CategoryDefinition {
    return invoice(code, name, q => q.eq(T.payments, P.sent, 1), { tableId: T.payments, eventType: "sent",
        related: { tableId: T.invoices, filter: q => and(filter(q), q.eq(T.invoices, I.cancelled, 0)), linksFieldId: I.payments }, ...extra });
}
const deferred = (code: string, name: string) => invoice(code, name, () => "FALSE()", { status: "deferred" });
export const INVOICE_CATEGORIES: CategoryDefinition[] = [
    invoice("INV-12", "Deposit invoice created", deposit),
    payment("INV-13", "Deposit invoice paid", deposit),
    invoice("INV-14", "Shipment against customer deposit", q => and(q.eq(T.shipping, S.shipped, 1), `${q.field(T.shipping, S.date)}!=BLANK()`), { tableId: T.shipping, eventType: "created", status: "partial" }),
    invoice("INV-15", "Full or balance invoice created", balance),
    payment("INV-16", "Full or balance invoice paid", balance),
    invoice("INV-07", "Fixed asset invoice", asset, { status: "partial" }),
    payment("INV-17", "Fixed asset invoice paid", asset, { status: "partial" }),
    deferred("INV-08", "Vendor return credit"),
    deferred("INV-09", "Vendor price credit"),
    invoice("INV-10", "Non-product client invoice", nonProduct),
    payment("INV-18", "Non-product client invoice paid", nonProduct),
];
