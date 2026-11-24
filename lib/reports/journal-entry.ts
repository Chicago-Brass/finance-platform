import { ledgerRead } from "./report-session";

export type JournalLine = {
  id: number | string; line_no: number; account_code: string; offset_account_code: string | null;
  account: { name: string } | null; debit: number | string; credit: number | string;
  notes: string | null; audit_link: string | null; vendor_ref: string[]; customer_ref: string[];
  order_ref: string[]; po_ref: string[]; invoice_ref: string[]; employee_ref: string[]; state_ref: string[];
  state_code: string | null; airtable_record_id: string | null; branch: string | null;
};

export type JournalPartyDetails = {
  client_names: string[] | null;
  vendor_names: string[] | null;
  reference_number: string | null;
  source_record_name: string | null;
};

export type JournalEntry = {
  id: string; entry_number: number; entry_date: string; source_date?: string | null; status: string; description: string;
  rule_code: string | null; transaction_type: string | null; notes: string | null; audit_link: string | null;
  source_system: string; source_event_type: string | null; source_table: string | null;
  source_record_id: string | null; external_ref: string | null; created_at: string; created_by: string | null;
  posted_at: string | null; posted_by: string | null; reverses_entry_id: string | null; reversal_reason: string | null;
  reversed_entry_number?: number | null;
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
      .select("id,entry_number,entry_date,source_date,status,description,rule_code,transaction_type,notes,audit_link,source_system,source_event_type,source_table,source_record_id,external_ref,created_at,created_by,posted_at,posted_by,reverses_entry_id,reversal_reason")
      .eq("entry_number", entryNumber).in("status", ["posted", "pending"]).maybeSingle();
    if (error) throw new Error(`Journal entry query failed: ${error.message}`);
    if (!entry) return null;
    const lines: JournalLine[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase.from("journal_lines")
        .select("id,line_no,account_code,offset_account_code,account:accounts!journal_lines_account_code_fkey(name),debit,credit,notes,audit_link,vendor_ref,customer_ref,order_ref,po_ref,invoice_ref,employee_ref,state_ref,state_code,airtable_record_id,branch")
        .eq("entry_id", entry.id).order("line_no").range(offset, offset + 499);
      if (error) throw new Error(`Journal lines query failed: ${error.message}`);
      lines.push(...(data ?? []) as unknown as JournalLine[]);
      if ((data?.length ?? 0) < 500) break;
    }
    let reversedEntryNumber: number | null = null;
    if (entry.reverses_entry_id) {
      const { data: original, error } = await supabase.from("journal_entries")
        .select("entry_number").eq("id", entry.reverses_entry_id).maybeSingle();
      if (error) throw new Error(`Original journal lookup failed: ${error.message}`);
      reversedEntryNumber = original?.entry_number ?? null;
    }
    return { ...entry, lines, reversed_entry_number: reversedEntryNumber } as JournalEntry;
  });
}
