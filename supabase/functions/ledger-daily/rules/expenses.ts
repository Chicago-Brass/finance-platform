import { expenseWorkerFields as F } from "../definitions.ts";
import { fromStart } from "../scope.ts";
import { and, or } from "./common.ts";
import type { CategoryDefinition, FormulaBuilder } from "../types.ts";

const { TABLES: T, INVOICE_FIELDS: I, LINE_FIELDS: L, PAYMENT_FIELDS: P } = F;
const w2Accounts = ["005.001", "005.002", "005.003", "005.005", "005.006"];
const taxAccounts = ["923100", "923300"];
const invoiceType = (q: FormulaBuilder, vendor: string) => and(q.eq(T.invoices, I.type, "AP"), q.eq(T.invoices, I.vendorType, vendor), q.eq(T.invoices, I.cancelled, 0));
const expenseInvoice = (q: FormulaBuilder) => invoiceType(q, "AP - Expenses (Non-Sales Tax)");
const staffInvoice = (q: FormulaBuilder) => invoiceType(q, "AP - Staff");
const prepaidInvoice = (q: FormulaBuilder) => and(invoiceType(q, "AP - Assets"), q.eq(T.invoices, I.prepaid, 1), `${q.field(T.invoices, I.accounts)}!=""`);
const invoiceAccount = (q: FormulaBuilder, code: string) => q.includes(T.invoices, I.accounts, code);
const lineAccounts = (q: FormulaBuilder, codes: string[]) => and(or(...codes.map(code => q.includes(T.lines, L.accounts, code))), `LEN(${q.field(T.lines, L.amount)}&"")>0`);
const fromInvoices = (filter: CategoryDefinition["filter"], linksFieldId: string = I.payments): CategoryDefinition["related"] => ({ tableId: T.invoices, filter, linksFieldId });
const fromPaidLines = (codes: string[], vendor = "AP - Staff"): CategoryDefinition["related"] => ({
    tableId: T.lines,
    filter: q => and(lineAccounts(q, codes), q.includes(T.lines, L.vendorType, vendor), q.includes(T.lines, L.status, "Fully Paid")),
    linksFieldId: L.invoices, through: { tableId: T.invoices, linksFieldId: I.payments },
});
function expense(code: string, name: string, tableId: string, filter: CategoryDefinition["filter"], extra: Partial<CategoryDefinition> = {}): CategoryDefinition {
    return { id: code, code, name, tableId, module: "expenses", input: "record", status: "implemented", filter,
        eventType: tableId === T.payments ? "sent" : tableId === T.prepay || tableId === T.depreciation ? "created" : "entry_requested", ...extra };
}
function lineEntry(code: string, name: string, codes: string[], parent: CategoryDefinition["filter"] = staffInvoice, extra: Partial<CategoryDefinition> = {}): CategoryDefinition {
    return expense(code, name, T.lines, q => lineAccounts(q, codes), {
        related: fromInvoices(q => and(parent(q), fromStart(q, T.invoices, I.date)), I.lines), ...extra,
    });
}
function linePayment(code: string, name: string, codes: string[], vendor = "AP - Staff"): CategoryDefinition {
    return expense(code, name, T.payments, q => q.eq(T.payments, P.sent, 1), { related: fromPaidLines(codes, vendor) });
}
const deferred = (code: string, name: string, tableId: string = T.invoices) => expense(code, name, tableId, () => "FALSE()", { status: "deferred" });

export const EXPENSE_CATEGORIES: CategoryDefinition[] = [
    expense("EXP-01", "Operating expense invoice", T.invoices, q => and(expenseInvoice(q), invoiceAccount(q, "006.002"), q.eq(T.invoices, I.noVendorBill, 0)), { status: "partial" }),
    expense("EXP-02", "Company credit-card purchase", T.payments, q => and(q.eq(T.payments, P.sent, 1), q.includes(T.payments, P.accounts, "231.100")), {
        related: fromInvoices(q => and(expenseInvoice(q), q.eq(T.invoices, I.noVendorBill, 1), `${q.field(T.invoices, I.accounts)}!=""`)),
    }),
    expense("EXP-03", "Prepaid expense invoice", T.invoices, prepaidInvoice),
    expense("EXP-04", "Prepaid monthly use-up", T.prepay, q => q.eq(T.prepay, F.PREPAY_FIELDS.cancelled, 0), { related: fromInvoices(prepaidInvoice, I.prepayLogs) }),
    lineEntry("EXP-05", "Employee tech allowance", ["005.102"]),
    lineEntry("EXP-06", "W2, owner and 1099 payroll", w2Accounts),
    lineEntry("EXP-07", "Offshore payroll", ["005.101"]),
    lineEntry("EXP-09", "Bonus invoice", ["005.201"]),
    expense("EXP-10", "Monthly depreciation", T.depreciation, () => "TRUE()"),
    expense("EXP-11", "Bank-fee invoice", T.invoices, q => and(expenseInvoice(q), invoiceAccount(q, "007.002"), q.eq(T.invoices, I.noVendorBill, 0))),
    deferred("EXP-12", "Bad-debt reserve"),
    lineEntry("EXP-13", "Income-tax invoice", taxAccounts, expenseInvoice),
    expense("EXP-14", "Operating expense payment", T.payments, q => q.eq(T.payments, P.sent, 1), { related: fromInvoices(q => and(expenseInvoice(q), invoiceAccount(q, "006.002"), q.eq(T.invoices, I.noVendorBill, 0))) }),
    expense("EXP-15", "Product invoice", T.invoices, q => invoiceType(q, "AP - Product")),
    expense("EXP-16", "Product payment", T.payments, q => q.eq(T.payments, P.sent, 1), { related: fromInvoices(q => invoiceType(q, "AP - Product")) }),
    expense("EXP-17", "Prepaid expense payment", T.payments, q => q.eq(T.payments, P.sent, 1), { related: fromInvoices(q => and(prepaidInvoice(q), q.eq(T.invoices, I.status, "Fully Paid"))) }),
    linePayment("EXP-18", "Tech allowance payment", ["005.102"]),
    linePayment("EXP-19", "W2, owner and 1099 payroll payment", w2Accounts),
    linePayment("EXP-20", "Offshore payroll payment", ["005.101"]),
    linePayment("EXP-21", "Bonus payment", ["005.201"]),
    deferred("EXP-22", "13th-month bonus accrual", T.lines),
    linePayment("EXP-23", "13th-month bonus payment", ["005.103"]),
    deferred("EXP-24", "Bad-debt write-off"),
    deferred("EXP-25", "Bad-debt recovery"),
    linePayment("EXP-26", "Income-tax payment", taxAccounts, "AP - Expenses (Non-Sales Tax)"),
    expense("EXP-27", "Bank-fee payment", T.payments, q => q.eq(T.payments, P.sent, 1), { related: fromInvoices(q => and(expenseInvoice(q), invoiceAccount(q, "007.002"), q.eq(T.invoices, I.noVendorBill, 0))) }),
];
