import type { AirtableRecord } from "../airtable.ts";
import { INVOICE_BRANCH_FIELDS } from "../definitions.ts";

export function invoiceBranches(invoice: AirtableRecord): string[] {
    const branch = invoice.value(INVOICE_BRANCH_FIELDS.branch)?.name;
    if (branch) return [branch];
    const lookup = [...new Set<string>(invoice.value(INVOICE_BRANCH_FIELDS.transactionBranch) ?? [])];
    return lookup.length === 1 ? lookup : [];
}

export function combinedInvoiceBranches(invoices: AirtableRecord[], resolve = invoiceBranches): string[] {
    const branches = invoices.map(resolve);
    return branches.some(values => !values.length) ? [] : [...new Set(branches.flat())];
}
