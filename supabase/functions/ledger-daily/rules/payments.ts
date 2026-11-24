import { fromStart } from "../scope.ts";
import { CARD_REBATE_INCOME, paymentWorkerFields as F, expenseWorkerFields, LOAN_RECORDS } from "../definitions.ts";
import { and, or, cardAccountFilter } from "./common.ts";
import type { CategoryDefinition, FormulaBuilder } from "../types.ts";
const { TABLES: T, INVOICE_FIELDS: I, PAYMENT_FIELDS: P, LINE_FIELDS: L } = F;
const invoiceType = (q: FormulaBuilder, type: string, vendor?: string) => and(q.eq(T.invoices, I.type, type),
  vendor ? q.eq(T.invoices, type === "AP" ? I.vendorTypeAP : I.vendorTypeAR, vendor) : "", q.eq(T.invoices, I.cancelled, 0));
const account = (q: FormulaBuilder, code: string) => q.includes(T.invoices, I.accounts, code);
const creditApplied = (q: FormulaBuilder) => and(`LEN(${q.field(T.invoices,I.creditsApplied)}&"")>0`, `${q.field(T.invoices,I.creditsApplied)}!=0`);
const related = (filter: CategoryDefinition["filter"]): CategoryDefinition["related"] => ({tableId:T.invoices, filter, linksFieldId:I.payments});
function invoice(code: string, name: string, filter: CategoryDefinition["filter"], status: CategoryDefinition["status"] = "implemented"): CategoryDefinition {
  return {id:code,code,name,module:"payments",tableId:T.invoices,eventType:"entry_requested",input:"record",status,filter};
}
function payment(code: string, name: string, parent?: CategoryDefinition["filter"], status: CategoryDefinition["status"] = "implemented"): CategoryDefinition {
  return {...invoice(code,name,q=>q.eq(T.payments,P.sent,1),status),tableId:T.payments,eventType:"sent",...(parent?{related:related(parent)}:{})};
}
function line(code: string, name: string, filter: CategoryDefinition["filter"], status: CategoryDefinition["status"]): CategoryDefinition {
  return {...invoice(code,name,filter,status),tableId:T.lines,related:{tableId:T.payments,
    filter:q=>and(q.eq(T.payments,P.sent,1),q.eq(T.payments,P.recordType,"Regular Payment"),q.eq(T.payments,P.cancelled,0),fromStart(q,T.payments,P.date)),
    linksFieldId:P.invoices,through:{tableId:T.invoices,linksFieldId:I.lines}}};
}

function loanFunding(code: string, name: string, setup: string): CategoryDefinition {
  const loan = LOAN_RECORDS;
  return {...invoice(code,name,q=>and(q.eq(loan.table,loan.active,1),q.eq(loan.table,loan.setup,setup))),
    tableId:loan.table,eventType:"created"};
}

// Direct queries narrow candidates; each named handler validates the full linked graph.
export const PAYMENT_CATEGORIES: CategoryDefinition[] = [
  invoice("PAY-28","Client credit applied",q=>and(invoiceType(q,"AR"),creditApplied(q),
    `${q.field(T.invoices,I.sourceCredits)}!=BLANK()`)),
  payment("PAY-29","Client cash refund",q=>and(invoiceType(q,"AR","AR - Refund/Credit"),q.eq(T.invoices,I.application,"Cash Refund"))),
  {...payment("PAY-08","Vendor card payment",q=>invoiceType(q,"AP","AP - Product")),
    filter:(q:FormulaBuilder)=>and(q.eq(T.payments,P.sent,1),q.eq(T.payments,P.method,"Credit Card"),cardAccountFilter(q,T.payments,P.accounts))},
  {...payment("PAY-09","Credit-card statement payment"),filter:(q:FormulaBuilder)=>and(q.eq(T.payments,P.sent,1),q.eq(T.payments,P.recordType,"CC Batch Payment"))},
  line("PAY-10","Early-payment discount",q=>and(q.eq(T.lines,L.type,"Discount"), or(...["AP - Product","AP - Expenses (Sales Tax)"].map(vendor=>q.includes(T.lines,expenseWorkerFields.LINE_FIELDS.vendorType,vendor))),`${q.field(T.lines,L.discountStatus)}!="Expired"`),"implemented"),
  payment("PAY-11","Vendor credits applied",q=>and(invoiceType(q,"AP"),q.eq(T.invoices,I.status,"Fully Paid"),creditApplied(q))),
  {...payment("PAY-12","Vendor payment returned"),filter:(q:FormulaBuilder)=>and(q.eq(T.payments,P.sent,1),q.eq(T.payments,P.type,"AP"),q.eq(T.payments,P.recordType,"Return Payment"))},
  {...payment("PAY-30","Vendor return payment repaid"),filter:(q:FormulaBuilder)=>and(q.eq(T.payments,P.sent,1),q.eq(T.payments,P.type,"AP"),q.eq(T.payments,P.recordType,"Repayment"))},
  payment("PAY-13","Vendor refund received",q=>invoiceType(q,"AP","AP - Refund")),
  loanFunding("PAY-31","Loan Funding Recorded",LOAN_RECORDS.cashSetup),
  loanFunding("PAY-33","Financed Purchase Recorded",LOAN_RECORDS.purchaseSetup),
  {...line("PAY-16","Monthly Loan Repayment (Principal and Interest)",q=>`${q.field(T.lines,L.accounts)}!=BLANK()`,"implemented"),
    related:{tableId:T.invoices,filter:q=>and(`LEN(${q.field(T.invoices,I.monthlyLoan)}&"")>0`,q.eq(T.invoices,I.status,"Fully Paid"),q.eq(T.invoices,I.cancelled,0)),linksFieldId:I.lines}},
  payment("PAY-20","Owner distribution",q=>and(invoiceType(q,"AP","AP - Expenses (Non-Sales Tax)"),account(q,"316.100"))),
  payment("PAY-21","Owner contribution",q=>and(invoiceType(q,"AR","AR - Non-Product"),account(q,"311.200"))),
  payment("PAY-23","Insurance claim receipt",q=>and(invoiceType(q,"AR","AR - Non-Product"),account(q,"004.004"))),
  invoice("PAY-32","Security deposit invoice",q=>and(invoiceType(q,"AP","AP - Assets"),account(q,"143.200"))),
  payment("PAY-24","Security deposit payment",q=>and(invoiceType(q,"AP","AP - Assets"),account(q,"143.200"))),
  {...payment("PAY-27","Credit-card rebate",q=>and(
    or(invoiceType(q,"AR","AR - Non-Product"),and(invoiceType(q,"AP","AP - Expenses (Non-Sales Tax)"),`${q.field(T.invoices,I.amount)}<0`)),
    account(q,CARD_REBATE_INCOME),q.eq(T.invoices,I.status,"Fully Paid"))),
    filter:(q:FormulaBuilder)=>and(q.eq(T.payments,P.sent,1),cardAccountFilter(q,T.payments,P.accounts))},
];
