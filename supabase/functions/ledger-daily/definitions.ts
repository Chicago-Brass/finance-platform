// Stable FIN table/field IDs. Field names for filterByFormula are resolved from the live schema.
export { FIN_BASE } from "../_shared/ledger-links.ts";
import { LINK_FIELDS } from "../_shared/ledger-links.ts";

export const POSTING_FIELDS = {
  tblAxlsdmJN0X0sQs: { postings: LINK_FIELDS.tblAxlsdmJN0X0sQs.postings, ids: LINK_FIELDS.tblAxlsdmJN0X0sQs.ids, reverse: "fld8oS4rTOmZtuTl6", reverseDate: "fldAgNtldwTtWCfo2" },
  tblR61NG9i0giid28: { postings: LINK_FIELDS.tblR61NG9i0giid28.postings, ids: LINK_FIELDS.tblR61NG9i0giid28.ids, reverse: "fldNtEQiswXd8mODj", reverseDate: "fldXItbQ15eokPT0P" },
  tbldQXuqNEp8G5pfs: { postings: LINK_FIELDS.tbldQXuqNEp8G5pfs.postings, ids: LINK_FIELDS.tbldQXuqNEp8G5pfs.ids, reverse: "fldOZh1NZmJi9tqkb", reverseDate: "fld1SzFreZ84owLgq", cancelled: "fldbovm1ab4HOZDBe" },
  tblV26TC0f6CKDneL: { postings: LINK_FIELDS.tblV26TC0f6CKDneL.postings, ids: LINK_FIELDS.tblV26TC0f6CKDneL.ids, reverse: "fldEN2QtqnbyNjjDW", reverseDate: "fld5t7Tr5qraHGWP8" },
  tbl1LgiUYt7Gc492d: { postings: LINK_FIELDS.tbl1LgiUYt7Gc492d.postings, ids: LINK_FIELDS.tbl1LgiUYt7Gc492d.ids, reverse: "fldnTDkZ6w2HdA3g0", reverseDate: "fldqX6PQbMnOCbTWC", cancelled: "fldtR0eFChr1XDIoN" },
  tblC0dbO5UMXzHma9: { postings: LINK_FIELDS.tblC0dbO5UMXzHma9.postings, ids: LINK_FIELDS.tblC0dbO5UMXzHma9.ids, reverse: "fld421jsytudCyW6u", reverseDate: "fldroh8valB06yEvQ" },
} as const;

export const paymentSentFields = {
  "TABLES": {
    "payments": "tblR61NG9i0giid28",
    "invoices": "tbldQXuqNEp8G5pfs",
    "accounts": "tblJ2RF8vlOhNMBKR",
    "lines": "tblV26TC0f6CKDneL"
  },
  "PAYMENT_FIELDS": {
    "name": "fld0WzELo8ivaRfEb",
    "amount": "fldhP2S68pT3XkZmX",
    "reference": "fldxjaur2SnqKmRfN",
    "methodAR": "fldICKCPwydpwAPL1",
    "vendorType": "fldJlmVZzUf5tuz0m",
    "vendorTypesAP": "fldXsmHPdtpkNKFun",
    "vendorTypesAR": "fldRIZiZhwJb4rztx",
    "type": "fldkoW3MMQEe0Lwm1",
    "sent": "fld03L3JpNZBLauEC",
    "returned": "fldRvZLik2A6g0KVd",
    "date": "fld0mYG8IMrDaNzdE",
    "recordType": "fldRT5cjyYzDUHMmm",
    "method": "fldu02yC1LElzDabE",
    "overpaid": "fldjsHZCoUYnnc2fV",
    "accounts": "fldCIQSOdytBGi91S",
    "invoices": "fldzPDwsJ1ZT2tVIs",
    "miniPayments": "fldnR14dyPcbdOeap"
  },
  "LINE_FIELDS": {
    "amount": "fldkhhHCD2qKD71rI",
    "accounts": "fldwr0Pfp8OHsNj5N",
    "invoices": "fldZpOBUbuVJbuaOG",
    "type": "fldchdpL3w2aXfm4P",
    "discountStatus": "fldU0H6S3D9uAFwBs"
  },
  "INVOICE_FIELDS": {
    "amount": "fldm5nXoW7MrwjkhW",
    "totalPaid": "fldjIeCk9utD91Rq6",
    "remaining": "fldnPvmnWzmfgBq3m",
    "lines": "fldF0uqCMkPgwuIes",
    "name": "fldMZyzqDidRujeZS",
    "rebateTotal": "fldyTbRUtFof1IByi",
    "sourceCredits": "fldQ6CZ4bMQjpCKoh",
    "creditsApplied": "fldtVpTc9y7AtQNx0",
    "discountTotal": "fldsPglrh1E185nU4",
    "paymentStatus": "fldde9LpRBshHfqCE",
    "amountToPay": "fldNqZMZsZfRPiRFp",
    "clients": "fld9aY5ze2BbaoWG5",
    "staff": "fldJXrFmx3Y6Szxa5",
    "branch": "fldt5PjqGDrINUYT5",
    "states": "fld3kO1XElo5S3Hhy",
    "application": "fld0uNpxg7XweQ9Xf",
    "accounts": "fldT5u0prSS8G1H4x",
    "purchaseOrders": "fldcIaoLYHgegP17m",
    "vendors": "fld77UN3hpnMagzkj",
    "transactions": "fldxUmaAhUJjAGnrw",
    "firstShipDate": "fldXs88CyaF07XyWv"
  },
  "CREDIT_FIELDS": {
    "name": "fldMZyzqDidRujeZS",
    "type": "fld9e6yDIv0PtBDV0",
    "vendorTypeAP": "fldXwodwAuXLJt5rP",
    "available": "fldREWnrJBr5DqkBB",
    "recipientInvoices": "fldkLsua8jujHnXWQ"
  },
  "ACCOUNT_FIELDS": {
    "number": "fldTjgAITNrJVCCWq"
  },
  "CREDIT_CARD_ACCOUNT": {
    "recordId": "receFCwcrEx4SXLST",
    "number": "231.100"
  },
  "BANK_ACCOUNT_NUMBERS": [
    "112.100",
    "0747",
    "112.200"
  ],
  "BANK_PAYMENT_METHODS": [
    "Nickel Check",
    "Wise",
    "Our ACH / Wire",
    "Vendor ACH / Wire",
    "Paper Check"
  ]
} as const;

export const paymentEventsFields = {
  "TABLES": {
    "payments": "tblR61NG9i0giid28",
    "accounts": "tblJ2RF8vlOhNMBKR",
    "invoices": "tbldQXuqNEp8G5pfs"
  },
  "ACCOUNT_FIELDS": {
    "number": "fldTjgAITNrJVCCWq"
  },
  "PAYMENT_FIELDS": {
    "name": "fld0WzELo8ivaRfEb",
    "amount": "fldhP2S68pT3XkZmX",
    "date": "fld0mYG8IMrDaNzdE",
    "reference": "fldxjaur2SnqKmRfN",
    "method": "fldu02yC1LElzDabE",
    "methodAR": "fldICKCPwydpwAPL1",
    "accounts": "fldCIQSOdytBGi91S",
    "cancelledDate": "fldsRLo5cO8fSdut8",
    "reconciledDate": "fldnw5Y6ATOWrhNJq",
    "invoices": "fldzPDwsJ1ZT2tVIs",
    "vendorType": "fldJlmVZzUf5tuz0m",
    "vendorTypesAP": "fldXsmHPdtpkNKFun",
    "vendorTypesAR": "fldRIZiZhwJb4rztx",
    "cancelled": "fldpmVZHFDVYEhUvo",
    "reconciled": "fldFpyRR8rlLXE4WO",
    "discrepancy": "fldo8tnQ820K5aYyv",
    "type": "fldkoW3MMQEe0Lwm1"
  },
  "INVOICE_FIELDS": {
    "name": "fldMZyzqDidRujeZS",
    "amountToPay": "fldNqZMZsZfRPiRFp",
    "firstShipDate": "fldXs88CyaF07XyWv",
    "clients": "fld9aY5ze2BbaoWG5",
    "branch": "fldt5PjqGDrINUYT5"
  }
} as const;


export const expenseFields = {
  "TABLES": {
    "invoices": "tbldQXuqNEp8G5pfs",
    "lines": "tblV26TC0f6CKDneL",
    "accounts": "tblJ2RF8vlOhNMBKR"
  },
  "INVOICE_FIELDS": {
    "name": "fldMZyzqDidRujeZS",
    "type": "fld9e6yDIv0PtBDV0",
    "vendorType": "fldXwodwAuXLJt5rP",
    "createEntry": "fldFrvGncUen39hBY",
    "prepaid": "fldckuYNfSzBXq0AX",
    "employeeBranch": "fldSHm0sXlVswhqs4",
    "amount": "fldm5nXoW7MrwjkhW",
    "date": "fldSungTQU5nIEIvi",
    "lines": "fldF0uqCMkPgwuIes",
    "accounts": "fldT5u0prSS8G1H4x",
    "payments": "fldeNFOgl9OBHPlNm",
    "vendors": "fld77UN3hpnMagzkj",
    "clients": "fld9aY5ze2BbaoWG5",
    "staff": "fldJXrFmx3Y6Szxa5",
    "transactions": "fldxUmaAhUJjAGnrw",
    "purchaseOrders": "fldcIaoLYHgegP17m",
    "branch": "fldt5PjqGDrINUYT5",
    "states": "fld3kO1XElo5S3Hhy"
  },
  "LINE_FIELDS": {
    "amount": "fldkhhHCD2qKD71rI",
    "accounts": "fldwr0Pfp8OHsNj5N",
    "invoices": "fldZpOBUbuVJbuaOG"
  },
  "ACCOUNT_FIELDS": {
    "number": "fldTjgAITNrJVCCWq"
  }
} as const;

export const paidExpenseFields = {
  "TABLES": {
    "invoices": "tbldQXuqNEp8G5pfs",
    "payments": "tblR61NG9i0giid28",
    "accounts": "tblJ2RF8vlOhNMBKR"
  },
  "INVOICE_FIELDS": {
    "name": "fldMZyzqDidRujeZS",
    "type": "fld9e6yDIv0PtBDV0",
    "vendorType": "fldXwodwAuXLJt5rP",
    "status": "fldde9LpRBshHfqCE",
    "amount": "fldm5nXoW7MrwjkhW",
    "date": "fldSungTQU5nIEIvi",
    "accounts": "fldT5u0prSS8G1H4x",
    "payments": "fldeNFOgl9OBHPlNm",
    "vendors": "fld77UN3hpnMagzkj",
    "clients": "fld9aY5ze2BbaoWG5",
    "staff": "fldJXrFmx3Y6Szxa5",
    "transactions": "fldxUmaAhUJjAGnrw",
    "purchaseOrders": "fldcIaoLYHgegP17m",
    "branch": "fldt5PjqGDrINUYT5",
    "states": "fld3kO1XElo5S3Hhy"
  },
  "PAYMENT_FIELDS": {
    "accounts": "fldCIQSOdytBGi91S"
  },
  "ACCOUNT_FIELDS": {
    "number": "fldTjgAITNrJVCCWq"
  }
} as const;

export const depreciationFields = {
  "TABLE": "tblC0dbO5UMXzHma9",
  "FIELDS": {
    "name": "fld9isGL0VoPVdkeU",
    "date": "fldQ299tE4wJB4SmH",
    "assets": "fldLXqVZ4TUaxq8kF",
    "amount": "fld58fd0YHB0YRxC1"
  }
} as const;

export const prepayFields = {
  "TABLE": "tbl1LgiUYt7Gc492d",
  "FIELDS": {
    "name": "fldBuTnJqQ5ymPhRt",
    "date": "fldXoWjXIrS76p84x",
    "invoices": "fldg3040Hc1Z6AQoe",
    "amount": "fld5NmFxp9Dhza6BK"
  },
  "INVOICES": "tbldQXuqNEp8G5pfs",
  "BRANCH": "fldt5PjqGDrINUYT5"
} as const;

// Current Expense chart entry points. Native automation field groups above remain unchanged.
export const expenseWorkerFields = {
  TABLES: { ...expenseFields.TABLES, payments: paymentSentFields.TABLES.payments, prepay: prepayFields.TABLE, depreciation: depreciationFields.TABLE },
  INVOICE_FIELDS: { ...expenseFields.INVOICE_FIELDS, status: "fld2YNpvvqweloE6S", cancelled: "fldbovm1ab4HOZDBe", prepayLogs: "fldINdIcixfdPbgw0", noVendorBill: "fldYZBfXWpNCWd0sg" },
  LINE_FIELDS: { ...expenseFields.LINE_FIELDS, status: "fldmIVFZRPfKf0QoX", vendorType: "fldflW5cKyjNYB0SJ" },
  PAYMENT_FIELDS: {
    name: paymentSentFields.PAYMENT_FIELDS.name, amount: paymentSentFields.PAYMENT_FIELDS.amount,
    reference: paymentSentFields.PAYMENT_FIELDS.reference, date: paymentSentFields.PAYMENT_FIELDS.date,
    sent: paymentSentFields.PAYMENT_FIELDS.sent, accounts: paymentSentFields.PAYMENT_FIELDS.accounts,
    invoices: paymentSentFields.PAYMENT_FIELDS.invoices, cancelled: paymentEventsFields.PAYMENT_FIELDS.cancelled,
    returned: paymentSentFields.PAYMENT_FIELDS.returned,
  },
  PREPAY_FIELDS: { ...prepayFields.FIELDS, cancelled: "fldtR0eFChr1XDIoN" },
  DEPRECIATION_FIELDS: depreciationFields.FIELDS,
  ACCOUNT_FIELDS: expenseFields.ACCOUNT_FIELDS,
} as const;

// Current Invoice Entry chart. Shipping links use the actual tables exposed by FIN.
export const invoiceWorkerFields = {
  TABLES: { invoices: paymentSentFields.TABLES.invoices, accounts: paymentSentFields.TABLES.accounts, payments: paymentSentFields.TABLES.payments,
    shipping: "tblAxlsdmJN0X0sQs", mtas: "tblNcoC7APgbJ3kgf" },
  INVOICE_FIELDS: {
    type: "fld9e6yDIv0PtBDV0", vendorTypeAP: "fldXwodwAuXLJt5rP", vendorTypeAR: "fldbMLaxgnu81a0O0",
    kind: "fld11boAS4dCyyuZW", cancelled: "fldbovm1ab4HOZDBe", prepaid: "fldckuYNfSzBXq0AX",
    amount: "fldm5nXoW7MrwjkhW", date: "fldSungTQU5nIEIvi", accounts: "fldT5u0prSS8G1H4x",
    payments: "fldeNFOgl9OBHPlNm", branch: "fldt5PjqGDrINUYT5", vendors: "fld77UN3hpnMagzkj",
    clients: "fld9aY5ze2BbaoWG5", staff: "fldJXrFmx3Y6Szxa5", transactions: "fldxUmaAhUJjAGnrw",
    purchaseOrders: "fldcIaoLYHgegP17m", states: "fld3kO1XElo5S3Hhy",
  },
  PAYMENT_FIELDS: expenseWorkerFields.PAYMENT_FIELDS,
  SHIPPING_FIELDS: { shipped: "fldluJJSvhtYasYQ7", date: "fldTcXR9nHM4XTJZo",
    mtas: "fld4XfIBm2RnK0yfo", transactions: "flduv7e2XhfIYwQ6h" },
  MTA_FIELDS: { amount: "fldSsRsBXUOkXSU8c", branch: "fldUaZWYWb6jOPbFA", states: "fldM5NdON38IvCXGD" },
  ACCOUNT_FIELDS: paymentSentFields.ACCOUNT_FIELDS,
} as const;
