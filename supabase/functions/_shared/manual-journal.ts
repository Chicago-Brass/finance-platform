// FIN manual journals are owned by the parent; linked lines only supply account pairs.
export const MANUAL_TABLE = "tblCoBk0WB46B662R";
export const MANUAL_FIELDS = {
  date: "fldfndE2cF0BlxIAc", posted: "fld9XfqX2AlWbrudc", cancelled: "flddPrINXnyy3oyBH",
  lines: "fld4z1v1Kfw32JEaM", invoices: "fldWnlGft5OUzojF6", branch: "fldNpnsHJAuVhQI0y",
  reference: "fldQXRenNBZa0dS2m",
  reverseDate: "fld1TFuRQFzFCpl1q",
} as const;
export const MANUAL_LINE_TABLE = "tblmXtIRH6Bj2jNZM";
export const MANUAL_LINE_FIELDS = {
  parents: "fldonRGT8bG0AjYhw", amount: "fldbYrGyOzmtfWPIV",
  debit: "fld4xUz96tKsESlEW", credit: "fldXr9Oh2Gr1PU8bC",
} as const;
export const INVOICE_MANUAL_FIELD = "fld14k21jz6vjaXoy";
