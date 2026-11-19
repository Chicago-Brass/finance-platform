// Airtable posting cache shared by current webhooks and the future daily worker.
import type { Sql, TransactionSql } from "npm:postgres@3.4.9";
import { lockLedgerSource } from "./period-review.ts";
import { LOAN_TABLE, LOAN_LINK_FIELDS } from "./loan-record.ts";
import { MANUAL_TABLE, MANUAL_FIELDS } from "./manual-journal.ts";

export const FIN_BASE = "app0Q1UMEdUeWl538";
export const LINK_FIELDS = {
  [LOAN_TABLE]: { reference: LOAN_LINK_FIELDS.reference },
  [MANUAL_TABLE]: { reference: MANUAL_FIELDS.reference, posted: MANUAL_FIELDS.posted },
  tblrnXm1HN9y6HPxY: { reference: "fldjKkpuYD0wdISuL" }, // Shipping Records
  tblR61NG9i0giid28: { reference: "fldpPZv5Pj6cjqC2Z" }, // Payments
  tbldQXuqNEp8G5pfs: { reference: "fld1j9TIbgYCLbBSX" }, // Invoices
  tblV26TC0f6CKDneL: { reference: "fldk9ztOCDg1VIZx8" }, // Invoice Lines
  tbl1LgiUYt7Gc492d: { reference: "fld95GSC4nPFhu1vp" }, // Prepay Expenses/Bad Debt
  tblC0dbO5UMXzHma9: { reference: "fldpEeJxfQncYjD6j" }, // Depreciation Table
} as const;
export const REVERSE_FIELDS: Readonly<Record<string, {reverse: string; reverseDate: string}>> = {
  [LOAN_TABLE]: {reverse: LOAN_LINK_FIELDS.reverse, reverseDate: LOAN_LINK_FIELDS.reverseDate},
  [MANUAL_TABLE]: {reverse: MANUAL_FIELDS.cancelled, reverseDate: MANUAL_FIELDS.reverseDate},
  tblrnXm1HN9y6HPxY: {reverse: "fld4Yt3NM58rdq8h7", reverseDate: "fldGuMWL4ZaEikHBW"},
  tblR61NG9i0giid28: {reverse: "fldNtEQiswXd8mODj", reverseDate: "fldXItbQ15eokPT0P"},
  tbldQXuqNEp8G5pfs: {reverse: "fldOZh1NZmJi9tqkb", reverseDate: "fld1SzFreZ84owLgq"},
  tblV26TC0f6CKDneL: {reverse: "fldEN2QtqnbyNjjDW", reverseDate: "fld5t7Tr5qraHGWP8"},
  tbl1LgiUYt7Gc492d: {reverse: "fldnTDkZ6w2HdA3g0", reverseDate: "fldqX6PQbMnOCbTWC"},
  tblC0dbO5UMXzHma9: {reverse: "fld421jsytudCyW6u", reverseDate: "fldroh8valB06yEvQ"},
};

export const postedKey = (rule: string) => "main:" + rule;
type LedgerReferenceEntry = {
  id: string;
  rule: string;
  key: string;
  date: string;
  environment: "main" | "staging" | "develop";
  kind: "journal" | "reversal";
  reverses?: string;
};

export function serializeLedgerReferences(
  rows: (LedgerReference & {reversal_id: string | null; reversal_date?: string | null; entry_date?: string})[],
  current?: unknown,
) {
  const entries: LedgerReferenceEntry[] = [];
  if (current != null && current !== "") {
    if (typeof current !== "string") throw new Error("Invalid Ledger References.");
    const saved = JSON.parse(current);
    if (saved?.version !== 1 || !Array.isArray(saved.entries)) throw new Error("Invalid Ledger References.");
    for (const entry of saved.entries) {
      if (entry?.environment === "main") continue;
      if ((entry?.environment !== "staging" && entry?.environment !== "develop")
        || (entry.kind !== "journal" && entry.kind !== "reversal")
        || !["id", "rule", "key", "date"].every(key => typeof entry[key] === "string")
        || (entry.kind === "reversal" && typeof entry.reverses !== "string"))
        throw new Error("Invalid Ledger References entry.");
      entries.push({ id: entry.id, rule: entry.rule, key: entry.key, date: entry.date,
        environment: entry.environment, kind: entry.kind,
        ...(entry.kind === "reversal" ? { reverses: entry.reverses } : {}) });
    }
  }
  for (const row of rows) {
    entries.push({ id: row.id, rule: row.rule, key: row.key,
      date: row.entry_date ?? row.datetime.slice(0, 10), environment: "main", kind: "journal" });
    if (row.reversal_id) {
      if (!row.reversal_date) throw new Error("Linked reversal is missing its accounting date.");
      entries.push({ id: row.reversal_id, rule: row.rule, key: row.key,
        date: row.reversal_date, environment: "main", kind: "reversal", reverses: row.id });
    }
  }
  const postedKeys = entries.flatMap(entry => entry.kind === "journal" ? [entry.environment + ":" + entry.rule] : []);
  return JSON.stringify({ version: 1, postedKeys: [...new Set(postedKeys)].sort(), entries });
}
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

async function ledgerLinkRows(tx: TransactionSql, source: LedgerSource) {
  const rows = await tx<(LedgerReference & { reversal_id: string | null; reversal_date: string | null; entry_date: string; posting_cycle: string | null })[]>`
    select o.rule_code as rule, o.source_entry_key as key, o.id::text,
      to_char(coalesce(o.posted_at,o.created_at) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as datetime,
      o.entry_date::text, r.id::text as reversal_id, r.entry_date::text as reversal_date, o.posting_cycle::text
    from ledger_private.current_airtable_journals(${source.tableId},${source.recordId}) o
    left join public.journal_entries r on r.reverses_entry_id=o.id and r.status in ('posted','pending')
    where o.source_system='airtable' and o.source_table=${source.tableId} and o.source_record_id=${source.recordId}
      and o.status in ('posted','pending') and o.reverses_entry_id is null
    order by o.rule_code, o.source_entry_key, o.id`;
  return rows;
}

function ledgerLinks(rows: Awaited<ReturnType<typeof ledgerLinkRows>>): LedgerLinks {
  return {
    postings: rows.map(({ rule, key, datetime, id }) => ({ rule, key, datetime, id })),
    journalEntryIds: rows.map(row => row.id),
    reversalJournalEntryIds: rows.flatMap(row => row.reversal_id ? [row.reversal_id] : []),
  };
}

export async function readLedgerLinks(tx: TransactionSql, source: LedgerSource): Promise<LedgerLinks> {
  return ledgerLinks(await ledgerLinkRows(tx, source));
}

// Verification and any compensating delete share the writer's source lock.
export async function syncLedgerLinks(sql: Sql, source: LedgerSource, token: string, fetcher: typeof fetch = fetch, deadline = Date.now() + 90_000, newJournalIds: string[] = [], repostId?: string, clearEmpty = false): Promise<LedgerLinks> {
  validateLinkSource(source);
  const fields = LINK_FIELDS[source.tableId as keyof typeof LINK_FIELDS];
  if (!token) throw new LedgerWritebackError();
  let result: { links: LedgerLinks; rolledBack: boolean };
  let failure: WritebackFailure | undefined;
  try { result = await sql.begin(async tx => {
    await tx`set local role service_role`;
    await tx`set local statement_timeout='15s'`;
    await lockLedgerSource(tx, source);
    const rows = await ledgerLinkRows(tx, source);
    const links = ledgerLinks(rows);
    const repostRows = repostId ? rows.filter(row => row.posting_cycle === repostId) : [];
    if (repostId && (!repostRows.length || repostRows.some(row => row.reversal_id))) throw new LedgerWritebackError();
    const [cancellation] = repostId ? await tx<{older: boolean}[]>`select c.created_at <= (
      select min(e.posted_at) from ledger_private.current_airtable_journals(${source.tableId},${source.recordId}) e
      where e.posting_cycle=${repostId}::uuid
    ) as older from ledger_private.ledger_source_cancellations c
    where c.source_table=${source.tableId} and c.source_record_id=${source.recordId}` : [];
    const resetReversal = cancellation?.older === true;
    const { reference } = fields;
    const reverse = REVERSE_FIELDS[source.tableId];
    if (!links.journalEntryIds.length && !clearEmpty) return { links, rolledBack: false };
    const priorReference = await readLinkFields(source, [reference], token, fetcher, deadline);
    if (!priorReference) throw new LedgerWritebackError("unconfirmed", { operation: "GET", status: 200, attempt: 1, reason: "invalid_response" });
    const values = {
      [reference]: serializeLedgerReferences(rows, priorReference[reference]),
      ...("posted" in fields ? { [fields.posted]: links.journalEntryIds.length > 0 } : {}),
      ...(resetReversal ? { [reverse.reverse]: false, [reverse.reverseDate]: null } : {}),
    };
    const verification = await writeAndRead(source, values, token, fetcher, deadline);
    const saved = verification.fields;
    failure = verification.failure;
    if (fieldsMatch(values, saved)) {
      if (resetReversal) await tx`select ledger_private.finish_airtable_repost(${source.tableId},${source.recordId},${repostId ?? null}::uuid)`;
      return { links, rolledBack: false };
    }
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

function fieldsMatch(values: Record<string, string | boolean | null>, actual: Record<string, unknown>) {
  return Object.entries(values).every(([id, value]) =>
    value === null || value === false ? (actual[id] ?? value) === value : actual[id] === value);
}

async function readLinkFields(source: LedgerSource, fields: string[], token: string, fetcher: typeof fetch, deadline: number) {
  const url = `https://api.airtable.com/v0/${FIN_BASE}/${source.tableId}`;
  const params = new URLSearchParams({ filterByFormula: `RECORD_ID()=${JSON.stringify(source.recordId)}`, returnFieldsByFieldId: "true", maxRecords: "1" });
  fields.forEach(id => params.append("fields[]", id));
  const saved = await request(`${url}?${params}`, { headers: { Authorization: "Bearer " + token } }, fetcher, deadline);
  const invalid = () => new LedgerWritebackError("unconfirmed", { operation: "GET", status: 200, attempt: 1, reason: "invalid_response" });
  if (!Array.isArray(saved.records)) throw invalid();
  const record = saved.records.find((row: { id: string }) => row.id === source.recordId);
  if (record && (!record.fields || typeof record.fields !== "object" || Array.isArray(record.fields))) throw invalid();
  return record?.fields as Record<string, unknown> | undefined;
}

async function writeAndRead(source: LedgerSource, values: Record<string, string | boolean | null>, token: string, fetcher: typeof fetch, deadline: number): Promise<{ fields: Record<string, unknown>; failure?: WritebackFailure }> {
  const url = `https://api.airtable.com/v0/${FIN_BASE}/${source.tableId}`;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
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
    const fields = await readLinkFields(source, Object.keys(values), token, fetcher, deadline) ?? {};
    if (fieldsMatch(values, fields)) return { fields };
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
