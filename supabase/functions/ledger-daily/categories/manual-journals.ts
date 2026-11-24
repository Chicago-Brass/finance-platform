import { MANUAL_TABLE, MANUAL_FIELDS as F, MANUAL_LINE_TABLE, MANUAL_LINE_FIELDS as L, invoiceWorkerFields as I } from "../definitions.ts";
import type { AirtableClient, AirtableRecord } from "../airtable.ts";
import type { LedgerPosting } from "../../ledger-payment/ledger.ts";
import { OPERATING_EXPENSE_ACCOUNT_MAPPING } from "../rules/expense-accounts.ts";

const ACCOUNT_MAPPING: Record<string, string> = { ...OPERATING_EXPENSE_ACCOUNT_MAPPING, "923100": "011.001", "923300": "011.002" };

export function createCategories(client: AirtableClient) {
  return { async evaluate(_rule: string, recordId: string, _tableId?: string, repost = false) {
    const record = await client.readRecord(MANUAL_TABLE, recordId, Object.values(F));
    if (!record) throw new Error("Manual journal entry not found.");
    const data = { entryDate: record.value(F.date) };
    if (!data.entryDate || (!repost && ((!client.ignorePostingMarkers && record.value(F.posted)) || record.value(F.cancelled) || record.value(F.reverseDate)))) return { data, results: [] };
    const lines = await client.readRecords(MANUAL_LINE_TABLE, ids(record, F.lines), Object.values(L));
    if (!lines.length) throw new Error("Manual journal entry needs at least one Journal Line.");
    const invoices = await client.readRecords(I.TABLES.invoices, ids(record, F.invoices), Object.values(I.INVOICE_FIELDS));
    const refs: Record<string, string[]> = { invoiceRecordIds: invoices.map(invoice => invoice.id).sort() };
    for (const [name, field] of Object.entries({ vendorRecordIds: I.INVOICE_FIELDS.vendors, clientRecordIds: I.INVOICE_FIELDS.clients,
      staffRecordIds: I.INVOICE_FIELDS.staff, transactionRecordIds: I.INVOICE_FIELDS.transactions,
      poRecordIds: I.INVOICE_FIELDS.purchaseOrders, stateRecordIds: I.INVOICE_FIELDS.states })) {
      refs[name] = [...new Set(invoices.flatMap(invoice => ids(invoice, field)))].sort();
    }
    const postings: LedgerPosting[] = [];
    const accountIds = [...new Set(lines.flatMap(line => [...ids(line, L.debit), ...ids(line, L.credit)]))];
    const accounts = new Map((await client.readRecords(I.TABLES.accounts, accountIds, Object.values(I.ACCOUNT_FIELDS))).map(account => [account.id, account]));
    for (const line of [...lines].sort((a, b) => a.id.localeCompare(b.id))) {
      const parents = ids(line, L.parents);
      if (parents.length !== 1 || parents[0] !== record.id) throw new Error("Journal Line must belong to this manual journal entry only.");
      const amount = line.value(L.amount);
      if (typeof amount !== "number" || !Number.isFinite(amount)) throw new Error("Journal Line Amount must be a finite number.");
      const [digits, exponent = "0"] = String(Math.abs(amount)).split("e");
      const cents = Math.sign(amount) * Math.round(Number(`${digits}e${Number(exponent) + 2}`));
      if (!Number.isSafeInteger(cents) || !cents) throw new Error("Journal Line Amount must be nonzero and within safe cent precision.");
      const account = (field: string) => {
        const links = ids(line, field);
        if (links.length !== 1) throw new Error("Each Journal Line must identify one debit account and one credit account.");
        const linked = accounts.get(links[0]);
        const number = linked?.text(I.ACCOUNT_FIELDS.number);
        if (!number) throw new Error("Journal Line account number is missing.");
        return { number: ACCOUNT_MAPPING[number] ?? number };
      };
      postings.push({ debitAccount: account(L.debit), creditAccount: account(L.credit), amount: (cents / 100).toFixed(2),
        branch: record.text(F.branch) || undefined, sourceRecordId: line.id, sourceRecordIds: [line.id], ...refs });
    }
    return { data, results: [{ category: "Manual Journal Entry", postings }] };
  } };
}

function ids(record: AirtableRecord, field: string): string[] {
  return [...new Set<string>((record.value(field) || []).map((link: { id: string }) => link.id))];
}
