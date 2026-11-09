import { expenseFields as F, paidExpenseFields as P, depreciationFields as D, prepayFields as L } from "../definitions.ts";
import { and, or, invoiceExpense, invoiceStaff, invoiceAccount, invoiceLines } from "./common.ts";
import type { CategoryDefinition } from "../types.ts";
const T = F.TABLES.invoices, I = F.INVOICE_FIELDS;
const expense = (code: string, name: string, filter: CategoryDefinition["filter"], extra: Partial<CategoryDefinition> = {}): CategoryDefinition => ({
    id: code, code, name, tableId: T, module: "expense-entry", eventType: "entry_requested", input: "record", status: "implemented", filter, ...extra,
});
export const EXPENSE_CATEGORIES: CategoryDefinition[] = [
    expense("EXP-01", "Utilities invoice", q => and(invoiceExpense(q), invoiceAccount(q, "006.002"))),
    expense("EXP-02", "Company card expense", q => and(invoiceExpense(q), q.eq(T, P.INVOICE_FIELDS.status, "Fully Paid"), `${q.field(T, I.accounts)}!=""`), {
        module: "expense-fully-paid", eventType: "paid", related: { tableId: P.TABLES.payments, filter: q => q.includes(P.TABLES.payments, P.PAYMENT_FIELDS.accounts, "231.100"), linksFieldId: "fldzPDwsJ1ZT2tVIs" },
    }),
    expense("EXP-03", "Prepaid expense bill", q => and(invoiceExpense(q), q.eq(T, I.prepaid, 1))),
    expense("EXP-04", "Prepaid monthly use-up", () => "TRUE()", { tableId: L.TABLE, module: "prepay-created", eventType: "created" }),
    expense("EXP-05", "Employee tech allowance", invoiceStaff, { related: invoiceLines("005.102") }),
    expense("EXP-06", "W2 payroll accrual", invoiceStaff, { status: "partial", related: invoiceLines("005.002", "005.005", "005.006") }),
    expense("EXP-07", "Offshore, 1099 and owner payroll accrual", invoiceStaff, { related: invoiceLines("005.101", "005.003", "005.001") }),
    expense("EXP-09", "Bonus and commission accrual", invoiceStaff, { related: invoiceLines("005.201") }),
    expense("EXP-10", "Monthly depreciation", () => "TRUE()", { tableId: D.TABLE, module: "depreciation-created", eventType: "created" }),
    expense("EXP-11", "Bank fees invoice", q => and(invoiceExpense(q), q.eq(T, P.INVOICE_FIELDS.status, "Fully Paid"), invoiceAccount(q, "007.002")), { module: "expense-fully-paid", eventType: "paid" }),
    expense("EXP-12", "Bad debt reserve", q => and(invoiceExpense(q), invoiceAccount(q, "007.005"))),
    expense("EXP-13", "Income tax accrual", q => and(invoiceExpense(q), or(invoiceAccount(q, "242.100"), invoiceAccount(q, "242.200")))),
];
