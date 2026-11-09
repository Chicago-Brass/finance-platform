import { invoiceEntryFields as F } from "../definitions.ts";
import { and, invoiceAccount, invoiceType, invoiceVendor, invoiceExpense } from "./common.ts";
import type { CategoryDefinition } from "../types.ts";
const T = F.TABLES.invoices, I = F.INVOICE_FIELDS;
const product = (q: Parameters<CategoryDefinition["filter"]>[0]) => and(invoiceType(q, "AP"), invoiceVendor(q, "AP - Product"));
const credit = (q: Parameters<CategoryDefinition["filter"]>[0]) => and(invoiceType(q, "AP"), invoiceVendor(q, "AP - Credit"));
const invoice = (code: string, name: string, filter: CategoryDefinition["filter"], extra: Partial<CategoryDefinition> = {}): CategoryDefinition => ({
    id: code, code, name, tableId: T, module: "invoice-entry", eventType: "entry_requested", input: "record", status: "implemented", filter, ...extra,
});
export const INVOICE_CATEGORIES: CategoryDefinition[] = [
    invoice("INV-01", "Product invoice after receipt", q => and(product(q), `${q.field(T, I.receivedNotInvoiced)}>0`)),
    invoice("INV-03", "Vendor deposit invoice", q => and(product(q), q.eq(T, I.poStatus, "Confirmed"), `${q.field(T, I.poReceivedDate)}=BLANK()`)),
    invoice("INV-04", "Inbound freight", product),
    invoice("INV-05", "Outbound shipping", q => and(invoiceExpense(q), invoiceAccount(q, "004.013")), { module: "invoice-created", eventType: "created", status: "partial" }),
    invoice("INV-06", "Sales tax remittance invoice", q => and(invoiceType(q, "AP"), invoiceVendor(q, "AP - Expenses (Sales Tax)"))),
    invoice("INV-07", "Fixed asset invoice", q => and(invoiceType(q, "AP"), invoiceVendor(q, "AP - Assets"))),
    invoice("INV-08", "Vendor return credit", q => and(credit(q), `${q.field(T, I.purchaseOrders)}!=""`)),
    invoice("INV-09", "Vendor price credit", q => and(credit(q), `${q.field(T, I.purchaseOrders)}=""`), { status: "partial" }),
    invoice("INV-10", "Non-product client invoice", q => and(invoiceType(q, "AR"), invoiceVendor(q, "AR - Non-Product"), invoiceAccount(q, "010.001"))),
];
