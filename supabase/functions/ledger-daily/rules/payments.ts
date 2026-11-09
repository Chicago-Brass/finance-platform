import { fromStart } from "../scope.ts";
import { paymentSentFields, paymentEventsFields, POSTING_FIELDS } from "../definitions.ts";
import type { CategoryDefinition, FormulaBuilder } from "../types.ts";

const { TABLES: T, PAYMENT_FIELDS: P, INVOICE_FIELDS: I } = paymentSentFields;
const E = paymentEventsFields.PAYMENT_FIELDS;
import { and, or, invoiceAccount, invoiceType, invoiceVendor } from "./common.ts";
const ip = (q: FormulaBuilder, type: string) => q.eq(T.payments, P.type, type);
const pv = (q: FormulaBuilder, type: string) => q.eq(T.payments, P.vendorType, type);
const apExpense = (q: FormulaBuilder) => and(ip(q, "AP"), pv(q, "AP - Expenses (Non-Sales Tax)"));
const arProduct = (q: FormulaBuilder) => and(ip(q, "AR"), pv(q, "AR - Product"));
const arNonProduct = (q: FormulaBuilder) => and(ip(q, "AR"), pv(q, "AR - Non-Product"));
const refund = (q: FormulaBuilder) => and(ip(q, "AR"), pv(q, "AR - Refund/Credit"));
const partial = new Set(["PAY-03", "PAY-06", "PAY-12", "PAY-15"]);
const bank = (q: FormulaBuilder) => or(...paymentSentFields.BANK_ACCOUNT_NUMBERS.map(code => q.includes(T.payments, P.accounts, code)));
const fromInvoices = (filter: CategoryDefinition["filter"]): CategoryDefinition["related"] => ({ tableId: T.invoices, filter, linksFieldId: "fldeNFOgl9OBHPlNm" });
const fromLines = (...accounts: string[]): CategoryDefinition["related"] => ({
  tableId: T.lines, filter: q => or(...accounts.map(code => q.includes(T.lines, paymentSentFields.LINE_FIELDS.accounts, code))),
  linksFieldId: paymentSentFields.LINE_FIELDS.invoices, through: { tableId: T.invoices, linksFieldId: "fldeNFOgl9OBHPlNm" },
});

function sent(code: string, name: string, filter: CategoryDefinition["filter"], extra: Partial<CategoryDefinition> = {}): CategoryDefinition {
  return { id: code, code, name, module: "payment-sent", tableId: T.payments, eventType: "sent", filter, input: "record", status: partial.has(code) ? "partial" : "implemented", ...extra };
}
function invoiceOwned(code: string, name: string, filter: CategoryDefinition["filter"], extra: Partial<CategoryDefinition> = {}): CategoryDefinition {
  return sent(code, name, filter, { tableId: T.invoices, input: "linked-payment",
    related: {tableId:T.payments,filter:q=>and(q.eq(T.payments,P.sent,1),fromStart(q,T.payments,P.date)),linksFieldId:P.invoices}, ...extra });
}

// Candidate filters stay deliberately broad when qualification depends on linked records.
// Each CORE handler remains the final qualification and amount/account authority.
export const PAYMENT_CATEGORIES: CategoryDefinition[] = [
  sent("PAY-01", "Customer deposit received", arProduct),
  sent("PAY-02", "Customer payment after shipment", arProduct),
  sent("PAY-03", "Client overpayment credited on account", refund, { related: fromInvoices(q => q.eq(T.invoices, I.application, "Credit to Another Order")) }),
  sent("PAY-04", "Small overpayment", q => and(arProduct(q), `${q.field(T.payments, P.overpaid)}>0`, `${q.field(T.payments, P.overpaid)}<=1`), { id: "PAY-04:overpaid" }),
  invoiceOwned("PAY-04", "Small invoice shortfall", q => and(invoiceType(q, "AR"), invoiceVendor(q, "AR - Product"), `${q.field(T.invoices, I.remaining)}>0`, `${q.field(T.invoices, I.remaining)}<=5`), { id: "PAY-04:underpaid" }),
  sent("PAY-05", "Client cash refund", refund, { related: fromInvoices(q => q.eq(T.invoices, I.application, "Cash Refund")) }),
  sent("PAY-06", "Client payment cancelled", q => and(arProduct(q), q.eq(T.payments, E.cancelled, 1)), { module: "payment-events", eventType: "cancelled" }),
  sent("PAY-07", "Vendor bank payment", q => and(ip(q, "AP"), pv(q, "AP - Product"), q.eq(T.payments, P.recordType, "Regular Payment"), q.eq(T.payments, P.returned, 0), or(...paymentSentFields.BANK_PAYMENT_METHODS.map(v => q.eq(T.payments, P.method, v))))),
  sent("PAY-08", "Vendor card payment", q => and(ip(q, "AP"), pv(q, "AP - Product"), q.eq(T.payments, P.recordType, "Regular Payment"), q.includes(T.payments, P.accounts, "231.100"))),
  sent("PAY-09", "Credit-card statement payment", q => and(q.eq(T.payments, P.recordType, "CC Batch Payment"), `${q.field(T.payments, P.miniPayments)}!=""`, bank(q))),
  invoiceOwned("PAY-10", "Early-payment discount", q => and(invoiceType(q, "AP"), q.eq(T.invoices, I.paymentStatus, "Fully Paid"), `${q.field(T.invoices, I.discountTotal)}!=0`), { status: "blocked" }),
  invoiceOwned("PAY-11", "Vendor credits applied", q => and(invoiceType(q, "AP"), q.eq(T.invoices, I.paymentStatus, "Fully Paid"), `${q.field(T.invoices, I.creditsApplied)}!=0`)),
  sent("PAY-12", "Vendor payment returned", q => and(ip(q, "AP"), q.eq(T.payments, P.returned, 1)), { id: "PAY-12:returned" }),
  sent("PAY-12", "Vendor payment cancelled", q => and(ip(q, "AP"), q.eq(T.payments, E.cancelled, 1)), { id: "PAY-12:cancelled", module: "payment-events", eventType: "cancelled" }),
  sent("PAY-13", "Vendor refund received", q => and(ip(q, "AP"), pv(q, "AP - Credit"))),
  sent("PAY-14", "Payroll disbursement", () => "FALSE()", { status: "deferred" }),
  sent("PAY-15", "Staff accrued liabilities paid", q => and(ip(q, "AP"), pv(q, "AP - Staff")), { related: fromLines("005.101", "005.003", "005.001", "005.002", "005.006", "005.005") }),
  sent("PAY-16", "Loan principal and interest payment", apExpense, { related: fromLines("232.100") }),
  sent("PAY-17", "Line of credit draw", arNonProduct, { related: fromInvoices(q => invoiceAccount(q, "231.200")) }),
  sent("PAY-18", "Line of credit repayment", apExpense, { related: fromLines("231.200") }),
  sent("PAY-19", "Bank transfer", q => and(apExpense(q), bank(q)), { related: fromInvoices(q => or(...paymentSentFields.BANK_ACCOUNT_NUMBERS.map(code => invoiceAccount(q, code)))) }),
  sent("PAY-20", "Owner distribution", apExpense, { related: fromInvoices(q => invoiceAccount(q, "316.100")) }),
  sent("PAY-21", "Owner contribution", arNonProduct, { related: fromInvoices(q => invoiceAccount(q, "311.200")) }),
  sent("PAY-22", "Income tax payment", apExpense, { related: fromInvoices(q => or(invoiceAccount(q, "242.100"), invoiceAccount(q, "242.200"))) }),
  sent("PAY-23", "Insurance claim receipt", arNonProduct, { status: "blocked", related: fromInvoices(q => invoiceAccount(q, "122.100")) }),
  sent("PAY-24", "Security deposit payment", apExpense, { related: fromInvoices(q => invoiceAccount(q, "143.200")) }),
  invoiceOwned("PAY-25", "Fidelity interest or dividends", q => and(invoiceType(q, "AR"), invoiceVendor(q, "AR - Non-Product"), invoiceAccount(q, "010.003"), `${q.field(T.invoices, I.amount)}!=0`)),
  sent("PAY-26", "Bank reconciliation difference", q => and(q.eq(T.payments, E.reconciled, 1), `${q.field(T.payments, E.discrepancy)}!=0`), { module: "payment-events", eventType: "reconciled" }),
  invoiceOwned("PAY-27", "Credit-card rebate", q => and(invoiceType(q, "AR"), invoiceVendor(q, "AR - Non-Product"), invoiceAccount(q, "004.011"), q.eq(T.invoices, I.paymentStatus, "Fully Paid"), `${q.field(T.invoices, I.rebateTotal)}!=0`)),
];
