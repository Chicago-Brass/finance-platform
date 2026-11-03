// FIN journal service: Airtable supplies final debit/credit pairs; this service validates and writes them atomically.
import type { Sql, TransactionSql } from "npm:postgres@3.4.9";
import { PostingError } from "./errors.ts";
export { PostingError } from "./errors.ts";

interface AccountReference { recordId?: string; number?: string }
interface LedgerSource { tableId: string; recordId: string; recordName?: string }
export interface LedgerPosting {
  debitAccount: AccountReference;
  creditAccount: AccountReference;
  amount: string;
  invoiceRecordId?: string;
  debitInvoiceRecordId?: string;
  creditInvoiceRecordId?: string;
  vendorRecordId?: string;
  clientRecordId?: string;
  staffRecordId?: string;
  transactionRecordId?: string;
  poRecordId?: string;
  sourceRecordId?: string;
  stateCode?: string;
  notes?: string;
  branch?: string | string[];
  [key: string]: unknown;
}
export interface LedgerPaymentEvent {
  paymentRecordId?: string;
  invoiceRecordId?: string;
  source?: LedgerSource;
  eventType: "sent" | "cancelled" | "returned" | "reconciled" | "created" | "entry_requested";
  entryDate: string;
  paymentName?: string;
  referenceNumber?: string;
  paymentAmount?: string | null;
  paymentAccount?: AccountReference | null;
  categories: { ruleCode: string; transactionType: string; postings: LedgerPosting[]; notes?: string }[];
  [key: string]: unknown;
}
export interface PostingResult {
  paymentRecordId?: string;
  invoiceRecordId?: string;
  eventType: string;
  results: { ruleCode: string; status: "posted" | "duplicate" | "noop"; journalEntryId?: string; reason?: string }[];
  journalEntryIds: string[];
  postedCount: number;
  duplicateCount: number;
}


interface Account { code: string; airtable_record_id: string | null; active: boolean; is_postable: boolean }
interface Rule { rule_code: string }
interface Catalog { accounts: Map<string, Account>; sourceAccounts: Map<string, Account>; rules: Map<string, Rule> }
interface JournalHeader {
  id?: string;
  entry_date: string;
  rule_code: string | null;
  transaction_type: string | null;
  source_event_type: string | null;
  description: string;
  notes: string | null;
  audit_link: string | null;
  source_system: string;
  source_table: string;
  source_record_id: string;
  external_ref: string | null;
  status?: string;
  reverses_entry_id?: string | null;
}
interface JournalLine {
  account_code: string;
  offset_account_code: string | null;
  debit: string;
  credit: string;
  notes: string | null;
  audit_link: string | null;
  vendor_ref: string | null;
  customer_ref: string | null;
  order_ref: string | null;
  po_ref: string | null;
  invoice_ref: string | null;
  employee_ref: string | null;
  state_code: string | null;
  airtable_record_id: string | null;
}

const PAYMENT_TABLE = "tblR61NG9i0giid28";
const INVOICE_TABLE = "tbldQXuqNEp8G5pfs";
const FIN_URL = "https://airtable.com/app0Q1UMEdUeWl538";
const LINE_COLUMNS = ["entry_id", "line_no", "account_code", "offset_account_code", "debit", "credit", "notes", "audit_link", "vendor_ref", "customer_ref", "order_ref", "po_ref", "invoice_ref", "employee_ref", "state_code", "airtable_record_id"] as const;

// ==================== SERVICE ====================

/** Airtable owns category decisions and final account pairs. This transaction stores its complete event. */
export async function postPayment(sql: Sql, event: LedgerPaymentEvent): Promise<PostingResult> {
  const paymentId = optionalText(event.paymentRecordId);
  const invoiceId = optionalText(event.invoiceRecordId);
  const invoiceEvent = event.eventType === "created" || event.eventType === "entry_requested";
  if (invoiceEvent) {
    if (!invoiceId) throw new PostingError("invoiceRecordId is required for an invoice event.");
    if (paymentId) throw new PostingError("An invoice event must not supply paymentRecordId.");
  } else {
    if (!paymentId) throw new PostingError("paymentRecordId is required.");
    if (invoiceId) throw new PostingError("Use source for a payment-triggered invoice packet; invoiceRecordId is reserved for invoice events.");
  }
  validateDate(event.entryDate);
  if (!["sent", "cancelled", "returned", "reconciled", "created", "entry_requested"].includes(event.eventType)) throw new PostingError("Unsupported ledger event type.");
  if (!Array.isArray(event.categories)) throw new PostingError("categories must be an array.");
  const source = resolveSource(event, invoiceEvent ? invoiceId! : paymentId!, invoiceEvent);
  const auditLink = `${FIN_URL}/${invoiceEvent ? INVOICE_TABLE : PAYMENT_TABLE}/${invoiceEvent ? invoiceId : paymentId}`;

  return await sql.begin(async (tx) => {
    await tx`set local role service_role`;
    const lockKey = source.tableId === PAYMENT_TABLE ? "FIN payment:" + source.recordId : "FIN invoice:" + source.recordId;
    await tx`select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(${lockKey}, 0))`;
    const accounts = await tx<Account[]>`select code, airtable_record_id, active, is_postable from public.accounts`;
    const rules = await tx<Rule[]>`select rule_code from public.ledger_rules`;
    const catalog: Catalog = {
      accounts: new Map(accounts.map((account) => [account.code, account])),
      sourceAccounts: new Map(accounts.filter((account) => account.airtable_record_id).map((account) => [account.airtable_record_id!, account])),
      rules: new Map(rules.map((rule) => [rule.rule_code, rule])),
    };
    // Historical reversal links remain read-only replay guards; new events only insert supplied pairs.
    const headers = await tx<JournalHeader[]>`select e.id::text, e.entry_date::text, e.rule_code, e.transaction_type, e.source_event_type,
      e.description, e.notes, e.audit_link, e.status, e.reverses_entry_id::text,
      e.source_system, e.source_table, e.source_record_id, e.external_ref
      from public.journal_entries e where
      (e.source_system='airtable' and e.source_table=${source.tableId} and e.source_record_id=${source.recordId})
      or e.reverses_entry_id in (select o.id from public.journal_entries o where
        o.source_system='airtable' and o.source_table=${source.tableId} and o.source_record_id=${source.recordId} and o.reverses_entry_id is null)`;
    const seen = new Set<string>();
    for (const category of event.categories) {
      const ruleCode = optionalText(category?.ruleCode);
      if (!ruleCode || seen.has(ruleCode)) throw new PostingError("Each category must have a distinct ruleCode.");
      if (!catalog.rules.has(ruleCode)) throw new PostingError(`Unknown journal rule ${ruleCode}.`);
      if (!optionalText(category.transactionType)?.trim()) throw new PostingError("transactionType must be nonempty text.");
      if (!Array.isArray(category.postings)) throw new PostingError("postings must be an array.");
      seen.add(ruleCode);
    }
    const result: PostingResult = { ...(invoiceEvent ? { invoiceRecordId: invoiceId! } : { paymentRecordId: paymentId! }), eventType: event.eventType, results: [], journalEntryIds: [], postedCount: 0, duplicateCount: 0 };
    const originals = headers.filter((header) => !header.reverses_entry_id && header.source_system === "airtable" && header.source_table === source.tableId && header.source_record_id === source.recordId);
    if (originals.some((header) => !header.source_event_type)) throw new PostingError("Existing source journals lack lifecycle metadata; review them before replaying this event.", "23505");
    const priorRules = originals.filter((header) => header.source_event_type === event.eventType).map((header) => header.rule_code).sort();
    const plans: { header: JournalHeader; lines: JournalLine[] }[] = [];
    const currentRules: string[] = [];
    for (const category of event.categories) {
      const ruleCode = category.ruleCode;
      const lines = expandPostings(source, category.postings, catalog, auditLink);
      const existing = originals.find((header) => header.rule_code === ruleCode);
      if (!lines.length) {
        if (existing) throw new PostingError("Source journal already exists; a zero replay cannot remove posted activity.", "23505");
        result.results.push({ ruleCode, status: "noop", reason: "zero_amount" });
        continue;
      }
      currentRules.push(ruleCode);
      const header: JournalHeader = {
        entry_date: event.entryDate, rule_code: ruleCode, transaction_type: category.transactionType, source_event_type: event.eventType,
        description: category.transactionType + (source.recordName ? " - " + source.recordName : "") + (source.tableId === INVOICE_TABLE && paymentId ? ` - Trigger payment ${paymentId}` : ""),
        notes: optionalText(category.notes), audit_link: auditLink,
        source_system: "airtable", source_table: source.tableId, source_record_id: source.recordId,
        external_ref: source.tableId === INVOICE_TABLE ? source.recordId : optionalText(event.referenceNumber),
      };
      if (existing) {
        if (existing.status !== "posted" || headers.some((reversal) => reversal.reverses_entry_id === existing.id && reversal.status === "posted")) {
          throw new PostingError("Source journal is draft or historically reversed; review the source before posting a correction.", "23505");
        }
        assertReplay(existing, header, await readLines(tx, existing.id!), lines);
        result.results.push({ ruleCode, status: "duplicate", journalEntryId: existing.id! });
        result.journalEntryIds.push(existing.id!);
        result.duplicateCount++;
      } else {
        validateLines(lines, catalog);
        plans.push({ header, lines });
      }
    }
    if (priorRules.length && JSON.stringify(priorRules) !== JSON.stringify(currentRules.sort())) {
      throw new PostingError("Source event already exists with different categories; review the changed event.", "23505");
    }
    if (plans.length) await assertOpenPeriod(tx, event.entryDate);
    for (const plan of plans) {
      const id = await createEntry(tx, plan.header, plan.lines);
      result.results.push({ ruleCode: plan.header.rule_code!, status: "posted", journalEntryId: id });
      result.journalEntryIds.push(id);
      result.postedCount++;
    }
    return result;
  });
}

// ==================== ACCOUNT MAPPING ====================

function expandPostings(source: LedgerSource, postings: LedgerPosting[], catalog: Catalog, auditLink: string): JournalLine[] {
  const lines: JournalLine[] = [];
  for (const posting of postings) {
    const amount = parseCents(posting?.amount);
    if (amount < 0n) throw new PostingError("Posting amounts must not be negative.");
    if (amount === 0n) continue;
    const debit = resolveAccount(catalog, posting.debitAccount);
    const credit = resolveAccount(catalog, posting.creditAccount);
    const invoice = optionalText(posting.invoiceRecordId) ?? (source.tableId === INVOICE_TABLE ? source.recordId : null);
    const debitInvoice = optionalText(posting.debitInvoiceRecordId) ?? invoice;
    const creditInvoice = optionalText(posting.creditInvoiceRecordId) ?? invoice;
    if (source.tableId === INVOICE_TABLE && debitInvoice !== source.recordId && creditInvoice !== source.recordId) throw new PostingError("The invoice source must appear on a posting leg.");
    const context = {
      offset_account_code: null, notes: optionalText(posting.notes), audit_link: auditLink,
      vendor_ref: optionalText(posting.vendorRecordId), customer_ref: optionalText(posting.clientRecordId),
      order_ref: optionalText(posting.transactionRecordId), po_ref: optionalText(posting.poRecordId),
      employee_ref: optionalText(posting.staffRecordId), state_code: optionalText(posting.stateCode),
      airtable_record_id: optionalText(posting.sourceRecordId),
    };
    const magnitude = formatCents(amount);
    // Branch travels with each pair and will be stored when its field is added.
    lines.push(
      { ...context, invoice_ref: debitInvoice, account_code: debit, debit: magnitude, credit: "0.00" },
      { ...context, invoice_ref: creditInvoice, account_code: credit, debit: "0.00", credit: magnitude },
    );
  }
  return lines;
}

function resolveAccount(catalog: Catalog, reference: AccountReference | null | undefined): string {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) throw new PostingError("Each posting must identify its debit and credit accounts.");
  const recordId = optionalText(reference.recordId);
  let code = recordId ? catalog.sourceAccounts.get(recordId)?.code : undefined;
  if (!code && recordId && catalog.accounts.has(recordId)) code = recordId;
  code ??= optionalText(reference.number) ?? undefined;
  if (code === "0747") code = "112.300"; // FIN Nickel identity -> ledger Nickel identity.
  const account = code ? catalog.accounts.get(code) : undefined;
  if (!account?.active || !account.is_postable) throw new PostingError(`No active/postable ledger account maps to ${recordId ?? "(empty)"} (${reference.number ?? "(empty)"}).`);
  return account.code;
}

// ==================== DATABASE ====================

async function createEntry(tx: TransactionSql, header: JournalHeader, lines: JournalLine[]): Promise<string> {
  const [created] = await tx<{ id: string }[]>`insert into public.journal_entries
    (entry_date, rule_code, transaction_type, source_event_type, description, notes, audit_link, source_system, source_table, source_record_id, external_ref)
    values (${header.entry_date}::date, ${header.rule_code}, ${header.transaction_type}, ${header.source_event_type}, ${header.description}, ${header.notes}, ${header.audit_link},
      ${header.source_system}, ${header.source_table}, ${header.source_record_id}, ${header.external_ref})
    returning id::text`;
  const rows = lines.map((line, index) => ({ entry_id: created.id, line_no: index + 1, ...line }));
  await tx`insert into public.journal_lines ${tx(rows, ...LINE_COLUMNS)}`;
  await tx`update public.journal_entries set status='posted' where id=${created.id}::uuid`;
  return created.id;
}

async function readLines(tx: TransactionSql, entryId: string): Promise<JournalLine[]> {
  return await tx<JournalLine[]>`select account_code, offset_account_code, debit::text, credit::text,
    notes, audit_link, vendor_ref, customer_ref, order_ref, po_ref, invoice_ref, employee_ref, state_code, airtable_record_id
    from public.journal_lines where entry_id=${entryId}::uuid order by line_no`;
}

// ==================== VALIDATION ====================

function resolveSource(event: LedgerPaymentEvent, triggerId: string, invoiceEvent: boolean): LedgerSource {
  if (event.source === undefined) return { tableId: invoiceEvent ? INVOICE_TABLE : PAYMENT_TABLE, recordId: triggerId, recordName: invoiceEvent ? undefined : event.paymentName };
  if (!event.source || typeof event.source !== "object" || Array.isArray(event.source)) throw new PostingError("source must identify a FIN source table and record.");
  const tableId = optionalText(event.source.tableId), recordId = optionalText(event.source.recordId);
  if (!tableId || ![PAYMENT_TABLE, INVOICE_TABLE].includes(tableId) || !recordId) throw new PostingError("source must identify a FIN Payments or Invoices record.");
  if (invoiceEvent && (tableId !== INVOICE_TABLE || recordId !== triggerId)) throw new PostingError("An invoice source must match its FIN invoiceRecordId.");
  if (!invoiceEvent && tableId === PAYMENT_TABLE && recordId !== triggerId) throw new PostingError("A payment source must match paymentRecordId.");
  return { tableId, recordId, recordName: optionalText(event.source.recordName) ?? (tableId === PAYMENT_TABLE ? event.paymentName : undefined) };
}

function assertReplay(existing: JournalHeader, expected: JournalHeader, actualLines: JournalLine[], expectedLines: JournalLine[]): void {
  // The trigger's audit URL is metadata; a different payment must not repost an invoice total.
  if (existing.entry_date !== expected.entry_date || existing.rule_code !== expected.rule_code || existing.transaction_type !== expected.transaction_type ||
      existing.source_event_type !== expected.source_event_type || existing.external_ref !== expected.external_ref ||
      existing.notes !== expected.notes ||
      existing.source_system !== expected.source_system || existing.source_table !== expected.source_table || existing.source_record_id !== expected.source_record_id ||
      canonicalLines(actualLines) !== canonicalLines(expectedLines)) {
    throw new PostingError("Source journal already exists with different data; review the changed event.", "23505");
  }
}

function validateLines(lines: JournalLine[], catalog: Catalog): void {
  if (lines.length < 2) throw new PostingError("A journal requires at least two lines.");
  let balance = 0n;
  for (const line of lines) {
    const account = catalog.accounts.get(line.account_code);
    if (!account?.active || !account.is_postable) throw new PostingError(`Account ${line.account_code} is inactive or not postable.`);
    const debit = parseCents(line.debit), credit = parseCents(line.credit);
    if (debit < 0n || credit < 0n || (debit > 0n) === (credit > 0n)) throw new PostingError("Each journal line needs exactly one positive debit or credit.");
    if (line.state_code && !/^[A-Z]{2}$/.test(line.state_code)) throw new PostingError("stateCode must contain two uppercase letters.");
    balance += debit - credit;
  }
  if (balance !== 0n) throw new PostingError("Journal debits and credits must balance exactly.");
}

async function assertOpenPeriod(tx: TransactionSql, entryDate: string): Promise<void> {
  const [period] = await tx<{ status: string }[]>`select status from public.accounting_periods where period_month=${entryDate.slice(0, 7) + "-01"}::date`;
  if (period?.status === "closed") throw new PostingError(`Period ${entryDate.slice(0, 7)} is closed.`);
}

function canonicalLines(lines: JournalLine[]): string {
  return JSON.stringify(lines.map((line) => [line.account_code, line.offset_account_code, formatCents(parseCents(line.debit)), formatCents(parseCents(line.credit)),
    line.notes, line.vendor_ref, line.customer_ref, line.order_ref, line.po_ref, line.invoice_ref, line.employee_ref, line.state_code, line.airtable_record_id]).map((line) => JSON.stringify(line)).sort());
}

function parseCents(value: unknown): bigint {
  if (typeof value !== "string" || !/^-?[0-9]+(\.[0-9]{1,2})?$/.test(value)) throw new PostingError("Posting amount must be a finite decimal string expressed in cents.");
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = (negative ? value.slice(1) : value).split(".");
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (cents > 999999999999999999n) throw new PostingError("Posting amount exceeds numeric(18,2).");
  return negative ? -cents : cents;
}

function formatCents(cents: bigint): string {
  const absolute = cents < 0n ? -cents : cents;
  return `${cents < 0n ? "-" : ""}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`;
}

function optionalText(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new PostingError("Reference and note values must be strings.");
  return value;
}

function validateDate(value: unknown): asserts value is string {
  if (typeof value !== "string" || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) || value.startsWith("0000-")) throw new PostingError("entryDate must be a finite ISO calendar date.");
  const date = new Date(value + "T00:00:00.000Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new PostingError("entryDate must be a valid calendar date.");
}
