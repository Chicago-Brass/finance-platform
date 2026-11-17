// Airtable posting cache shared by current webhooks and the future daily worker.
import type { Sql, TransactionSql } from "npm:postgres@3.4.9";
import { lockLedgerSource } from "./period-review.ts";
import { MANUAL_TABLE, MANUAL_FIELDS } from "./manual-journal.ts";

export const FIN_BASE = "app0Q1UMEdUeWl538";
export const LINK_FIELDS = {
  [MANUAL_TABLE]: { postings: MANUAL_FIELDS.postings, ids: MANUAL_FIELDS.ids, reversalIds: MANUAL_FIELDS.reversalIds, posted: MANUAL_FIELDS.posted },
  tblrnXm1HN9y6HPxY: { postings: "fldpzQMtRabsTFN3p", ids: "fldAnSta5oo9el7xm", reversalIds: "fldDSYAiyS6IjgAA7" },
  tblR61NG9i0giid28: { postings: "fldFcvTSQ5035ZYVa", ids: "fldUTQWnsCYxYZ8wa", reversalIds: "fld7j7LKJNbgfyFhk" },
  tbldQXuqNEp8G5pfs: { postings: "fld2K7xKmNnLoi4u6", ids: "fldLqYrXCySCoZRQT", reversalIds: "fldKWzgJ7ypvfn6Jw" },
  tblV26TC0f6CKDneL: { postings: "fldggH4cOAdWpW8WO", ids: "fldi0ML7ThX0lD1vg", reversalIds: "fldxgFR0EWkD0fMLD" },
  tbl1LgiUYt7Gc492d: { postings: "fldw8s2MSZm1vbuO2", ids: "fld5xpLcuYN7i1gRz", reversalIds: "fldbYYEu6fFmzegQT" },
  tblC0dbO5UMXzHma9: { postings: "fldTbVTOFkYW8Qb5Y", ids: "fld0rJIJ4BytBFaTC", reversalIds: "fldA3dt8UXrE5tpPc" },
} as const;
export interface LedgerSource { tableId: string; recordId: string }
export interface LedgerReference { rule: string; key: string; datetime: string; id: string }
export interface LedgerLinks { postings: LedgerReference[]; journalEntryIds: string[]; reversalJournalEntryIds: string[] }
interface WritebackFailure { operation: "PATCH" | "GET" | "DATABASE"; status: number | null; attempt: number; reason: "http" | "network" | "timeout" | "budget" | "invalid_response" | "mismatch" | "database"; databaseCode?: string }
class AirtableRequestError extends Error {
  readonly details: WritebackFailure;
  constructor(details: WritebackFailure) {
    super("Airtable ledger request failed.");
    this.details = details;
  }
}
export class LedgerWritebackError extends Error {
  readonly outcome: "rolled_back" | "unconfirmed";
  readonly details?: WritebackFailure;
  constructor(outcome: "rolled_back" | "unconfirmed" = "unconfirmed", details?: WritebackFailure) {
    const message = outcome === "rolled_back" ? "Airtable did not save the journal links. New journals were rolled back; this source can be retried." :
      "Ledger writeback or rollback could not be confirmed. Check this source before retrying.";
    super(message + (details ? ` ${details.operation === "DATABASE" ? "Database" : "Airtable " + details.operation}: status=${details.status ?? "none"}, attempt=${details.attempt}, reason=${details.reason}${details.databaseCode ? ", databaseCode=" + details.databaseCode : ""}.` : ""));
    this.outcome = outcome;
    this.details = details;
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
  let failure: WritebackFailure | undefined;
  try { result = await sql.begin(async tx => {
    await tx`set local role service_role`;
    await tx`set local statement_timeout='15s'`;
    await lockLedgerSource(tx, source);
    const links = await readLedgerLinks(tx, source);
    if (!links.journalEntryIds.length) return { links, rolledBack: false };
    const values = {
      [fields.postings]: JSON.stringify(links.postings),
      [fields.ids]: JSON.stringify(links.journalEntryIds),
      [fields.reversalIds]: JSON.stringify(links.reversalJournalEntryIds),
      ...("posted" in fields ? { [fields.posted]: true } : {}),
    };
    const verification = await writeAndRead(source, values, token, fetcher, deadline);
    const saved = verification.fields;
    failure = verification.failure;
    if (Object.entries(values).every(([id, value]) => saved[id] === value)) return { links, rolledBack: false };
    // Never delete prior journals or IDs which Airtable may already reference, even in a partial save.
    if (!newJournalIds.length || ("posted" in fields && saved[fields.posted] === true) || newJournalIds.some(id => Object.values(saved).some(value => String(value).includes(id)))) throw new LedgerWritebackError("unconfirmed", failure);
    const deleted = await tx`delete from public.journal_entries
      where id=any(${newJournalIds}::uuid[]) and source_system='airtable'
        and source_table=${source.tableId} and source_record_id=${source.recordId}
        and reverses_entry_id is null
      returning id`;
    if (deleted.length !== newJournalIds.length) throw new LedgerWritebackError();
    return { links, rolledBack: true };
  }); } catch (error) {
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" && /^[A-Z0-9_]{1,40}$/.test(error.code) ? error.code : undefined;
    const requestFailure = error instanceof AirtableRequestError || error instanceof LedgerWritebackError ? error.details : failure;
    const details: WritebackFailure | undefined = code ? { ...(requestFailure ?? { operation: "DATABASE", status: null, attempt: 1, reason: "database" }), databaseCode: code } : requestFailure;
    console.error("Airtable ledger writeback or rollback outcome is unconfirmed.", { tableId: source.tableId, recordId: source.recordId, outcome: "unconfirmed", ...details });
    throw new LedgerWritebackError("unconfirmed", details);
  }
  // Throw after COMMIT so the compensating delete is not itself rolled back.
  if (result.rolledBack) {
    console.error("Airtable ledger links were not saved; new journals were rolled back.", { tableId: source.tableId, recordId: source.recordId, outcome: "rolled_back", ...failure });
    throw new LedgerWritebackError("rolled_back", failure);
  }
  return result.links;
}

async function writeAndRead(source: LedgerSource, values: Record<string, string | boolean>, token: string, fetcher: typeof fetch, deadline: number): Promise<{ fields: Record<string, unknown>; failure?: WritebackFailure }> {
  const url = `https://api.airtable.com/v0/${FIN_BASE}/${source.tableId}`;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const params = new URLSearchParams({ filterByFormula: `RECORD_ID()=${JSON.stringify(source.recordId)}`, returnFieldsByFieldId: "true", maxRecords: "1" });
  Object.keys(values).forEach(id => params.append("fields[]", id));
  let snapshot: { fields: Record<string, unknown>; failure?: WritebackFailure } = { fields: {} };
  for (let attempt = 0; ; attempt++) {
    // Reserve a complete PATCH and verification GET before another write.
    if (attempt && Date.now() + 30_000 >= deadline) return snapshot;
    let failure: WritebackFailure | undefined;
    try {
      await request(url, { method: "PATCH", headers, body: JSON.stringify({ records: [{ id: source.recordId, fields: values }] }) }, fetcher, deadline, 1);
    } catch (error) {
      if (!(error instanceof AirtableRequestError)) throw error;
      failure = { ...error.details, attempt: attempt + 1 };
      console.error("Airtable ledger metadata PATCH requires verification.", { tableId: source.tableId, recordId: source.recordId, outcome: "unconfirmed", ...failure });
      if (failure.reason === "budget") throw new AirtableRequestError(failure);
      if (failure.status === 429) {
        if (Date.now() + 30_000 + 15_000 >= deadline) throw new AirtableRequestError({ ...failure, reason: "budget" });
        await new Promise(resolve => setTimeout(resolve, 30_000));
      }
    }
    // A lost PATCH response may already have saved; verify before retrying the same snapshot.
    const saved = await request(`${url}?${params}`, { headers }, fetcher, deadline);
    if (!Array.isArray(saved.records)) throw new LedgerWritebackError("unconfirmed", { operation: "GET", status: 200, attempt: attempt + 1, reason: "invalid_response" });
    const record = saved.records.find((row: { id: string }) => row.id === source.recordId);
    if (record && (!record.fields || typeof record.fields !== "object" || Array.isArray(record.fields))) throw new LedgerWritebackError("unconfirmed", { operation: "GET", status: 200, attempt: attempt + 1, reason: "invalid_response" });
    const fields = record?.fields ?? {};
    if (Object.entries(values).every(([id, value]) => fields[id] === value)) return { fields };
    snapshot = { fields, failure: failure ?? { operation: "GET", status: 200, attempt: attempt + 1, reason: "mismatch" } };
    if (attempt >= 2 || !failure || (failure.reason !== "network" && failure.reason !== "timeout" && failure.status !== 429 && (failure.status === null || failure.status < 500))) return snapshot;
    const delay = failure.status === 429 ? 0 : 500 * 2 ** attempt;
    if (Date.now() + delay + 30_000 >= deadline) return snapshot;
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
  }
}

async function request(url: string, options: RequestInit, fetcher: typeof fetch, deadline: number, attempts = 3) {
  const operation = options.method === "PATCH" ? "PATCH" : "GET";
  for (let attempt = 0; ; attempt++) {
    if (Date.now() + 15_000 >= deadline) throw new AirtableRequestError({ operation, status: null, attempt: attempt + 1, reason: "budget" });
    let response: Response | undefined;
    try { response = await fetcher(url, { ...options, signal: AbortSignal.timeout(15_000) }); }
    catch (error) {
      const reason = error instanceof Error && error.name === "BudgetExceeded" ? "budget" : error instanceof Error && error.name === "TimeoutError" ? "timeout" : "network";
      if (reason === "budget" || attempt + 1 >= attempts) throw new AirtableRequestError({ operation, status: null, attempt: attempt + 1, reason });
    }
    if (response?.ok) {
      try { return await response.json(); }
      catch { throw new AirtableRequestError({ operation, status: response.status, attempt: attempt + 1, reason: "invalid_response" }); }
    }
    if (response && response.status !== 429 && response.status < 500) throw new AirtableRequestError({ operation, status: response.status, attempt: attempt + 1, reason: "http" });
    if (attempt + 1 >= attempts) throw new AirtableRequestError({ operation, status: response?.status ?? null, attempt: attempt + 1, reason: "http" });
    const delay = response?.status === 429 ? 30_000 : 500 * 2 ** attempt;
    if (Date.now() + delay + 15_000 >= deadline) throw new AirtableRequestError({ operation, status: response?.status ?? null, attempt: attempt + 1, reason: "budget" });
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
