// Airtable posting cache shared by current webhooks and the future daily worker.
import type { Sql, TransactionSql } from "npm:postgres@3.4.9";

export const FIN_BASE = "app0Q1UMEdUeWl538";
export const LINK_FIELDS = {
  tblR61NG9i0giid28: { postings: "fldFcvTSQ5035ZYVa", ids: "fldUTQWnsCYxYZ8wa", reversalIds: "fld7j7LKJNbgfyFhk" },
  tbldQXuqNEp8G5pfs: { postings: "fld2K7xKmNnLoi4u6", ids: "fldLqYrXCySCoZRQT", reversalIds: "fldKWzgJ7ypvfn6Jw" },
} as const;
export interface LedgerSource { tableId: string; recordId: string }
export interface LedgerReference { rule: string; key: string; datetime: string; id: string }
export interface LedgerLinks { postings: LedgerReference[]; journalEntryIds: string[]; reversalJournalEntryIds: string[] }
export class LedgerWritebackError extends Error {
  readonly outcome: "rolled_back" | "unconfirmed";
  constructor(outcome: "rolled_back" | "unconfirmed" = "unconfirmed") {
    super(outcome === "rolled_back" ? "Airtable did not save the journal links. New journals were rolled back; this source can be retried." :
      "Ledger writeback or rollback could not be confirmed. Check this source before retrying.");
    this.outcome = outcome;
  }
}
export function validateLinkSource(source: LedgerSource) {
  if (!Object.hasOwn(LINK_FIELDS, source.tableId) || !/^rec[A-Za-z0-9]{14}$/.test(source.recordId)) throw new Error("Unsupported Airtable ledger source.");
}

export async function readLedgerLinks(tx: TransactionSql, source: LedgerSource): Promise<LedgerLinks> {
  const rows = await tx<(LedgerReference & { reversal_id: string | null })[]>`
    select o.rule_code as rule, o.source_entry_key as key, o.id::text,
      to_char(o.posted_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as datetime,
      r.id::text as reversal_id
    from public.journal_entries o
    left join public.journal_entries r on r.reverses_entry_id=o.id and r.status='posted'
    where o.source_system='airtable' and o.source_table=${source.tableId} and o.source_record_id=${source.recordId}
      and o.status='posted' and o.reverses_entry_id is null
    order by o.rule_code, o.source_entry_key, o.id`;
  return {
    postings: rows.map(({ rule, key, datetime, id }) => ({ rule, key, datetime, id })),
    journalEntryIds: rows.map(row => row.id),
    reversalJournalEntryIds: rows.flatMap(row => row.reversal_id ? [row.reversal_id] : []),
  };
}

// Verification and any compensating delete share the writer's source lock.
export async function syncLedgerLinks(sql: Sql, source: LedgerSource, token: string, fetcher: typeof fetch = fetch, deadline = Date.now() + 90_000, newJournalIds: string[] = []): Promise<LedgerLinks> {
  validateLinkSource(source);
  const fields = LINK_FIELDS[source.tableId as keyof typeof LINK_FIELDS];
  if (!token) throw new LedgerWritebackError();
  let result: { links: LedgerLinks; rolledBack: boolean };
  try { result = await sql.begin(async tx => {
    await tx`set local role service_role`;
    await tx`set local statement_timeout='15s'`;
    const lockKey = (source.tableId === "tblR61NG9i0giid28" ? "FIN payment:" : "FIN invoice:") + source.recordId;
    await tx`select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(${lockKey}, 0))`;
    const links = await readLedgerLinks(tx, source);
    if (!links.journalEntryIds.length) return { links, rolledBack: false };
    const values = {
      [fields.postings]: JSON.stringify(links.postings),
      [fields.ids]: JSON.stringify(links.journalEntryIds),
      [fields.reversalIds]: JSON.stringify(links.reversalJournalEntryIds),
    };
    const saved = await writeAndRead(source, values, token, fetcher, deadline);
    if (Object.entries(values).every(([id, value]) => saved[id] === value)) return { links, rolledBack: false };
    // Never delete prior journals or IDs which Airtable may already reference, even in a partial save.
    if (!newJournalIds.length || newJournalIds.some(id => Object.values(saved).some(value => String(value).includes(id)))) throw new LedgerWritebackError();
    const deleted = await tx`delete from public.journal_entries
      where id=any(${newJournalIds}::uuid[]) and source_system='airtable'
        and source_table=${source.tableId} and source_record_id=${source.recordId}
        and reverses_entry_id is null
      returning id`;
    if (deleted.length !== newJournalIds.length) throw new LedgerWritebackError();
    return { links, rolledBack: true };
  }); } catch {
    console.error("Airtable ledger writeback or rollback outcome is unconfirmed.", source);
    throw new LedgerWritebackError();
  }
  // Throw after COMMIT so the compensating delete is not itself rolled back.
  if (result.rolledBack) throw new LedgerWritebackError("rolled_back");
  return result.links;
}

async function writeAndRead(source: LedgerSource, values: Record<string, string>, token: string, fetcher: typeof fetch, deadline: number): Promise<Record<string, unknown>> {
  const url = `https://api.airtable.com/v0/${FIN_BASE}/${source.tableId}`;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  try {
    await request(url, { method: "PATCH", headers, body: JSON.stringify({ records: [{ id: source.recordId, fields: values }] }) }, fetcher, deadline, 1);
  } catch { /* A lost response is not proof of a failed save; always read the exact record. */ }
  const params = new URLSearchParams({ filterByFormula: `RECORD_ID()=${JSON.stringify(source.recordId)}`, returnFieldsByFieldId: "true", maxRecords: "1" });
  Object.keys(values).forEach(id => params.append("fields[]", id));
  const saved = await request(`${url}?${params}`, { headers }, fetcher, deadline);
  if (!Array.isArray(saved.records)) throw new LedgerWritebackError();
  const record = saved.records.find((row: { id: string }) => row.id === source.recordId);
  if (record && (!record.fields || typeof record.fields !== "object" || Array.isArray(record.fields))) throw new LedgerWritebackError();
  return record?.fields ?? {};
}

async function request(url: string, options: RequestInit, fetcher: typeof fetch, deadline: number, attempts = 3) {
  for (let attempt = 0; ; attempt++) {
    if (Date.now() + 15_000 >= deadline) throw new Error("Airtable ledger writeback time budget reached. Retry the same event.");
    let response: Response | undefined;
    try { response = await fetcher(url, { ...options, signal: AbortSignal.timeout(15_000) }); }
    catch { if (attempt + 1 >= attempts) throw new Error("Airtable ledger writeback did not complete. Retry the same event."); }
    if (response?.ok) return await response.json();
    if (response && response.status !== 429 && response.status < 500) throw new Error(`Airtable ledger writeback failed (${response.status}).`);
    if (attempt + 1 >= attempts) throw new Error(`Airtable ledger writeback failed (${response?.status ?? "network"}). Retry the same event.`);
    const delay = response?.status === 429 ? 30_000 : 500 * 2 ** attempt;
    if (Date.now() + delay + 15_000 >= deadline) throw new Error("Airtable ledger writeback time budget reached. Retry the same event.");
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
