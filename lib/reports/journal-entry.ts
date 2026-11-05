import { ledgerRead } from "./report-session";

export type JournalLine = {
  id: number | string; line_no: number; account_code: string; offset_account_code: string | null;
  account: { name: string } | null; debit: number | string; credit: number | string;
  notes: string | null; audit_link: string | null; vendor_ref: string | null; customer_ref: string | null;
  order_ref: string | null; po_ref: string | null; invoice_ref: string | null; employee_ref: string | null;
  state_code: string | null; airtable_record_id: string | null; branch: string | null;
};

export type JournalEntry = {
  id: string; entry_number: number; entry_date: string; status: string; description: string;
  rule_code: string | null; transaction_type: string | null; notes: string | null; audit_link: string | null;
  source_system: string; source_event_type: string | null; source_table: string | null;
  source_record_id: string | null; external_ref: string | null; created_at: string; created_by: string | null;
  posted_at: string | null; posted_by: string | null; reverses_entry_id: string | null; reversal_reason: string | null;
  lines: JournalLine[];
};

export function journalEntryNumber(value: string | null) {
  const number = Number(value);
  if (!value || !/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < 1) throw new RangeError("Invalid journal entry number.");
  return number;
}

/** Posted entries are immutable. Read their complete line set, independent of report filters. */
export async function getJournalEntry(entryNumber: number): Promise<JournalEntry | null> {
  return ledgerRead(async supabase => {
    const { data: entry, error } = await supabase.from("journal_entries")
      .select("id,entry_number,entry_date,status,description,rule_code,transaction_type,notes,audit_link,source_system,source_event_type,source_table,source_record_id,external_ref,created_at,created_by,posted_at,posted_by,reverses_entry_id,reversal_reason")
      .eq("entry_number", entryNumber).eq("status", "posted").maybeSingle();
    if (error) throw new Error(`Journal entry query failed: ${error.message}`);
    if (!entry) return null;
    const lines: JournalLine[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase.from("journal_lines")
        .select("id,line_no,account_code,offset_account_code,account:accounts!journal_lines_account_code_fkey(name),debit,credit,notes,audit_link,vendor_ref,customer_ref,order_ref,po_ref,invoice_ref,employee_ref,state_code,airtable_record_id,branch")
        .eq("entry_id", entry.id).order("line_no").range(offset, offset + 499);
      if (error) throw new Error(`Journal lines query failed: ${error.message}`);
      lines.push(...(data ?? []) as unknown as JournalLine[]);
      if ((data?.length ?? 0) < 500) break;
    }
    return { ...entry, lines } as JournalEntry;
  });
}
