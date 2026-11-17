import { fromStart } from "../scope.ts";
import { paymentWorkerFields as F } from "../definitions.ts";
import { and } from "./common.ts";
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

// Direct queries narrow candidates; each named handler validates the full linked graph.
export const PAYMENT_CATEGORIES: CategoryDefinition[] = [
  invoice("PAY-03","Client credit created",q=>invoiceType(q,"AR","AR - Refund/Credit")),
  invoice("PAY-28","Client credit applied",q=>and(invoiceType(q,"AR"),creditApplied(q))),
  payment("PAY-29","Client cash refund",q=>and(invoiceType(q,"AR","AR - Refund/Credit"),q.eq(T.invoices,I.application,"Cash Refund"))),
  {...payment("PAY-08","Vendor card payment",q=>invoiceType(q,"AP","AP - Product")),
    filter:(q:FormulaBuilder)=>and(q.eq(T.payments,P.sent,1),q.includes(T.payments,P.accounts,"231.100"))},
  {...payment("PAY-09","Credit-card statement payment"),filter:(q:FormulaBuilder)=>and(q.eq(T.payments,P.sent,1),q.eq(T.payments,P.recordType,"CC Batch Payment"))},
  line("PAY-10","Early-payment discount",q=>and(q.eq(T.lines,L.type,"Discount"),`${q.field(T.lines,L.discountStatus)}!="Expired"`),"implemented"),
  payment("PAY-11","Vendor credits applied",q=>and(invoiceType(q,"AP"),q.eq(T.invoices,I.status,"Fully Paid"),creditApplied(q))),
  {...payment("PAY-12","Vendor payment returned"),filter:(q:FormulaBuilder)=>and(q.eq(T.payments,P.sent,1),q.eq(T.payments,P.type,"AP"),q.eq(T.payments,P.recordType,"Return Payment"))},
  {...payment("PAY-30","Vendor return payment repaid"),filter:(q:FormulaBuilder)=>and(q.eq(T.payments,P.sent,1),q.eq(T.payments,P.type,"AP"),q.eq(T.payments,P.recordType,"Repayment"))},
  payment("PAY-13","Vendor refund received",q=>invoiceType(q,"AP","AP - Refund")),
  invoice("PAY-31","Loan invoice created",q=>and(invoiceType(q,"AR","AR - Non-Product"),`${q.field(T.invoices,I.loan)}!=""`),"blocked"),
  payment("PAY-16","Loan principal and interest payment",q=>invoiceType(q,"AR","AR - Non-Product"),"blocked"),
  payment("PAY-20","Owner distribution",q=>and(invoiceType(q,"AP","AP - Expenses (Non-Sales Tax)"),account(q,"316.100"))),
  payment("PAY-21","Owner contribution",q=>and(invoiceType(q,"AR","AR - Non-Product"),account(q,"311.200"))),
  payment("PAY-23","Insurance claim receipt",q=>and(invoiceType(q,"AR","AR - Non-Product"),account(q,"004.004"))),
  invoice("PAY-32","Security deposit invoice",q=>and(invoiceType(q,"AP","AP - Assets"),account(q,"143.200"))),
  payment("PAY-24","Security deposit payment",q=>and(invoiceType(q,"AP","AP - Assets"),account(q,"143.200"))),
  {...payment("PAY-27","Credit-card rebate",q=>and(invoiceType(q,"AR","AR - Non-Product"),account(q,"004.011"),q.eq(T.invoices,I.status,"Fully Paid"))),
    filter:(q:FormulaBuilder)=>and(q.eq(T.payments,P.sent,1),q.includes(T.payments,P.accounts,"231.100"))},
];
