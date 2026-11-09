import { paymentSentFields as fields } from "../definitions.ts";
import type { CategoryDefinition, FormulaBuilder } from "../types.ts";
export const and = (...parts: string[]) => `AND(${parts.filter(Boolean).join(",")})`;
export const or = (...parts: string[]) => `OR(${parts.filter(Boolean).join(",")})`;
export const invoiceAccount = (q: FormulaBuilder, code: string) => q.includes(fields.TABLES.invoices, fields.INVOICE_FIELDS.accounts, code);
export const invoiceType = (q: FormulaBuilder, type: string) => q.eq(fields.TABLES.invoices, "fld9e6yDIv0PtBDV0", type);
export const invoiceVendor = (q: FormulaBuilder, type: string) => q.eq(fields.TABLES.invoices, type.startsWith("AR") ? "fldbMLaxgnu81a0O0" : "fldXwodwAuXLJt5rP", type);
export const invoiceExpense = (q: FormulaBuilder) => and(invoiceType(q, "AP"), invoiceVendor(q, "AP - Expenses (Non-Sales Tax)"));
export const invoiceStaff = (q: FormulaBuilder) => and(invoiceType(q, "AP"), invoiceVendor(q, "AP - Staff"));
export const invoiceLines = (...codes: string[]): CategoryDefinition["related"] => ({
    tableId: fields.TABLES.lines,
    filter: q => or(...codes.map(code => q.includes(fields.TABLES.lines, fields.LINE_FIELDS.accounts, code))),
    linksFieldId: fields.LINE_FIELDS.invoices,
});
