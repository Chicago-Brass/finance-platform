// FIN journal service: Airtable supplies final debit/credit pairs; this service validates and writes them atomically.
import type { Sql, TransactionSql } from "npm:postgres@3.4.9";
import { PostingError } from "./errors.ts";
export { PostingError } from "./errors.ts";
import { holdForReview, lockLedgerSource } from "../_shared/period-review.ts";

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
  sourceRecordIds?: string[];
  vendorRecordIds?: string[];
  clientRecordIds?: string[];
  staffRecordIds?: string[];
  transactionRecordIds?: string[];
  poRecordIds?: string[];
  invoiceRecordIds?: string[];
  debitInvoiceRecordIds?: string[];
  creditInvoiceRecordIds?: string[];
  stateRecordIds?: string[];
  stateCode?: string;
  notes?: string;
  branch?: string | string[];
  [key: string]: unknown;
}
export interface LedgerPaymentEvent {
  paymentRecordId?: string;
  invoiceRecordId?: string;
  depreciationRecordId?: string;
  prepayLogRecordId?: string;
  source?: LedgerSource;
  eventType: "sent" | "cancelled" | "returned" | "reconciled" | "created" | "entry_requested" | "paid";
  entryDate: string;
  sourceDate?: string;
  paymentName?: string;
  referenceNumber?: string;
  paymentAmount?: string | null;
  paymentAccount?: AccountReference | null;
  categories: { ruleCode: string; entryKey?: string; transactionType: string; postings: LedgerPosting[]; notes?: string }[];
  [key: string]: unknown;
}
export interface PostingResult {
  status?: "pending_review" | "rejected";
  requestId?: string;
  paymentRecordId?: string;
  invoiceRecordId?: string;
  depreciationRecordId?: string;
  prepayLogRecordId?: string;
  eventType: string;
  results: { ruleCode: string; entryKey?: string; status: "posted" | "duplicate" | "noop"; journalEntryId?: string; reason?: string }[];
  journalEntryIds: string[];
  postedCount: number;
  duplicateCount: number;
}


interface Account { code: string; airtable_record_id: string | null; is_postable: boolean }
interface Rule { rule_code: string }
interface Catalog { accounts: Map<string, Account>; sourceAccounts: Map<string, Account>; rules: Map<string, Rule> }
interface JournalHeader {
  id?: string;
  entry_date: string;
  source_date?: string;
  posting_request_id?: string | null;
  rule_code: string | null;
  transaction_type: string | null;
  source_event_type: string | null;
  description: string;
  notes: string | null;
  audit_link: string | null;
  source_system: string;
  source_table: string;
  source_record_id: string;
  source_entry_key: string;
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
  vendor_ref: string[];
  customer_ref: string[];
  order_ref: string[];
  po_ref: string[];
  invoice_ref: string[];
  employee_ref: string[];
  state_ref: string[];
  state_code: string | null;
  airtable_record_id: string | null;
  airtable_record_ids: string[];
  branch: string | null;
}

const PAYMENT_TABLE = "tblR61NG9i0giid28";
const INVOICE_TABLE = "tbldQXuqNEp8G5pfs";
const DEPRECIATION_TABLE = "tblC0dbO5UMXzHma9";
const PREPAY_TABLE = "tbl1LgiUYt7Gc492d";
const FIN_URL = "https://airtable.com/app0Q1UMEdUeWl538";
const LINE_COLUMNS = ["entry_id", "line_no", "account_code", "offset_account_code", "debit", "credit", "notes", "audit_link", "vendor_ref", "customer_ref", "order_ref", "po_ref", "invoice_ref", "employee_ref", "state_ref", "state_code", "airtable_record_id", "airtable_record_ids", "branch"] as const;

// ==================== SERVICE ====================

/** Airtable owns category decisions and final account pairs. This transaction stores its complete event. */
export async function postPayment(sql: Sql, event: LedgerPaymentEvent, options: { allowAdditionalCategories?: boolean; transaction?: TransactionSql; approvalRequestId?: string } = {}): Promise<PostingResult> {
  const paymentId = optionalText(event.paymentRecordId);
  const invoiceId = optionalText(event.invoiceRecordId);
  const depreciationId = optionalText(event.depreciationRecordId);
  const prepayLogId = optionalText(event.prepayLogRecordId);
  if (depreciationId && prepayLogId) throw new PostingError("A record-created event must identify only one source record type.");
  const recordTable = depreciationId ? DEPRECIATION_TABLE : prepayLogId ? PREPAY_TABLE : null;
  const invoiceEvent = !recordTable && ["created", "entry_requested", "paid"].includes(event.eventType);
  if (recordTable) {
    if (event.eventType !== "created" || paymentId || invoiceId) throw new PostingError("A depreciation or prepay-log event requires eventType created and must not supply paymentRecordId or invoiceRecordId.");
  } else if (invoiceEvent) {
    if (!invoiceId) throw new PostingError("invoiceRecordId is required for an invoice event.");
    if (paymentId) throw new PostingError("An invoice event must not supply paymentRecordId.");
  } else {
    if (!paymentId) throw new PostingError("paymentRecordId is required.");
    if (invoiceId) throw new PostingError("Use source for a payment-triggered invoice packet; invoiceRecordId is reserved for invoice events.");
  }
  validateDate(event.entryDate);
  if (event.sourceDate) validateDate(event.sourceDate);
  if (!["sent", "cancelled", "returned", "reconciled", "created", "entry_requested", "paid"].includes(event.eventType)) throw new PostingError("Unsupported ledger event type.");
  if (!Array.isArray(event.categories)) throw new PostingError("categories must be an array.");
  const triggerId = depreciationId ?? prepayLogId ?? (invoiceEvent ? invoiceId! : paymentId!);
  const source = resolveSource(event, triggerId, invoiceEvent, recordTable);
  const auditLink = `${FIN_URL}/${recordTable ?? (invoiceEvent ? INVOICE_TABLE : PAYMENT_TABLE)}/${triggerId}`;

  const execute = async (tx: TransactionSql): Promise<PostingResult> => {
    await tx`set local role service_role`;
    if (options.allowAdditionalCategories) await tx`set local statement_timeout='15s'`;
    await lockLedgerSource(tx,source);
    const accounts = await tx<Account[]>`select code, airtable_record_id, is_postable from public.accounts`;
    const rules = await tx<Rule[]>`select rule_code from public.ledger_rules`;
    const catalog: Catalog = {
      accounts: new Map(accounts.map((account) => [account.code, account])),
      sourceAccounts: new Map(accounts.filter((account) => account.airtable_record_id).map((account) => [account.airtable_record_id!, account])),
      rules: new Map(rules.map((rule) => [rule.rule_code, rule])),
    };
    // Historical reversal links remain read-only replay guards; new events only insert supplied pairs.
    const headers = await tx<JournalHeader[]>`select e.id::text, e.entry_date::text, e.source_date::text, e.rule_code, e.transaction_type, e.source_event_type,
      e.description, e.notes, e.audit_link, e.status, e.reverses_entry_id::text,
      e.source_system, e.source_table, e.source_record_id, e.source_entry_key, e.external_ref
      from public.journal_entries e where
      (e.source_system='airtable' and e.source_table=${source.tableId} and e.source_record_id=${source.recordId})
      or e.reverses_entry_id in (select o.id from public.journal_entries o where
        o.source_system='airtable' and o.source_table=${source.tableId} and o.source_record_id=${source.recordId} and o.reverses_entry_id is null)`;
    const seen = new Set<string>();
    for (const category of event.categories) {
      const ruleCode = optionalText(category?.ruleCode);
      const entryKey = optionalText(category?.entryKey) ?? "";
      const identity = JSON.stringify([ruleCode, entryKey]);
      if (!ruleCode || seen.has(identity)) throw new PostingError("Each category must have a distinct ruleCode and entryKey pair.");
      if (entryKey && entryKey !== entryKey.trim()) throw new PostingError("entryKey must not have surrounding whitespace.");
      if (!catalog.rules.has(ruleCode)) throw new PostingError(`Unknown journal rule ${ruleCode}.`);
      if (!optionalText(category.transactionType)?.trim()) throw new PostingError("transactionType must be nonempty text.");
      if (!Array.isArray(category.postings)) throw new PostingError("postings must be an array.");
      seen.add(identity);
    }
    const result: PostingResult = { ...(depreciationId ? { depreciationRecordId: depreciationId } : prepayLogId ? { prepayLogRecordId: prepayLogId } : invoiceEvent ? { invoiceRecordId: invoiceId! } : { paymentRecordId: paymentId! }), eventType: event.eventType, results: [], journalEntryIds: [], postedCount: 0, duplicateCount: 0 };
    const originals = headers.filter((header) => !header.reverses_entry_id && header.source_system === "airtable" && header.source_table === source.tableId && header.source_record_id === source.recordId);
    if (originals.some((header) => !header.source_event_type)) throw new PostingError("Existing source journals lack lifecycle metadata; review them before replaying this event.", "23505");
    const priorRules = originals.filter((header) => header.source_event_type === event.eventType).map((header) => JSON.stringify([header.rule_code, header.source_entry_key])).sort();
    const plans: { header: JournalHeader; lines: JournalLine[] }[] = [];
    const currentRules: string[] = [];
    for (const category of event.categories) {
      const ruleCode = category.ruleCode;
      const entryKey = optionalText(category.entryKey) ?? "";
      const resultIdentity = { ruleCode, ...(entryKey ? { entryKey } : {}) };
      const lines = expandPostings(source, category.postings, catalog, auditLink);
      if (originals.some(header => header.rule_code === ruleCode && Boolean(header.source_entry_key) !== Boolean(entryKey))) throw new PostingError("Source category already exists with different entry grouping; review the posted journal before splitting or combining it.", "23505");
      const existing = originals.find((header) => header.rule_code === ruleCode && header.source_entry_key === entryKey);
      if (!lines.length) {
        if (existing) throw new PostingError("Source journal already exists; a zero replay cannot remove posted activity.", "23505");
        result.results.push({ ...resultIdentity, status: "noop", reason: "zero_amount" });
        continue;
      }
      currentRules.push(JSON.stringify([ruleCode, entryKey]));
      const header: JournalHeader = {
        entry_date: event.entryDate, source_date: event.sourceDate ?? event.entryDate, posting_request_id: options.approvalRequestId ?? null, rule_code: ruleCode, transaction_type: category.transactionType, source_event_type: event.eventType,
        description: category.transactionType + (source.recordName ? " - " + source.recordName : "") + (source.tableId === INVOICE_TABLE && paymentId ? ` - Trigger payment ${paymentId}` : ""),
        notes: optionalText(category.notes), audit_link: auditLink,
        source_system: "airtable", source_table: source.tableId, source_record_id: source.recordId, source_entry_key: entryKey,
        external_ref: source.tableId === INVOICE_TABLE ? source.recordId : optionalText(event.referenceNumber),
      };
      if (existing) {
        if (existing.status !== "posted" || headers.some((reversal) => reversal.reverses_entry_id === existing.id && reversal.status === "posted")) {
          throw new PostingError("Source journal is draft or historically reversed; review the source before posting a correction.", "23505");
        }
        assertReplay(existing, header, await readLines(tx, existing.id!), lines);
        result.results.push({ ...resultIdentity, status: "duplicate", journalEntryId: existing.id! });
        result.journalEntryIds.push(existing.id!);
        result.duplicateCount++;
      } else {
        validateLines(lines, catalog);
        plans.push({ header, lines });
      }
    }
    for (const ruleCode of new Set(event.categories.map(category => category.ruleCode))) {
      const keys = event.categories.filter(category => category.ruleCode === ruleCode).map(category => category.entryKey || "");
      if (keys.includes("") && keys.some(Boolean)) throw new PostingError("A category cannot mix whole-category and keyed entries.");
    }
    if (!options.allowAdditionalCategories && priorRules.length && JSON.stringify(priorRules) !== JSON.stringify(currentRules.sort())) {
      throw new PostingError("Source event already exists with different categories; review the changed event.", "23505");
    }
    if (plans.length) {
      const held = await holdForReview(tx,{kind:"posting",source,eventType:event.eventType,date:event.entryDate,payload:event,allowAdditionalCategories:options.allowAdditionalCategories},options.approvalRequestId);
      if (held) return {...result,...held};
    }
    for (const plan of plans) {
      const id = await createEntry(tx, plan.header, plan.lines);
      result.results.push({ ruleCode: plan.header.rule_code!, ...(plan.header.source_entry_key ? { entryKey: plan.header.source_entry_key } : {}), status: "posted", journalEntryId: id });
      result.journalEntryIds.push(id);
      result.postedCount++;
    }
    return result;
  };
  return options.transaction ? execute(options.transaction) : sql.begin(execute);
}

// ==================== ACCOUNT MAPPING ====================

function expandPostings(source: LedgerSource, postings: LedgerPosting[], catalog: Catalog, auditLink: string): JournalLine[] {
  const lines: JournalLine[] = [];
  for (const posting of postings) {
    const amount = parseCents(posting?.amount);
    if (amount === 0n) continue;
    const debit = resolveAccount(catalog, posting.debitAccount);
    const credit = resolveAccount(catalog, posting.creditAccount);
    const invoice = referenceIds(posting.invoiceRecordId, posting.invoiceRecordIds);
    if (!invoice.length && source.tableId === INVOICE_TABLE) invoice.push(source.recordId);
    const debitInvoice = posting.debitInvoiceRecordId !== undefined || posting.debitInvoiceRecordIds !== undefined ? referenceIds(posting.debitInvoiceRecordId, posting.debitInvoiceRecordIds) : invoice;
    const creditInvoice = posting.creditInvoiceRecordId !== undefined || posting.creditInvoiceRecordIds !== undefined ? referenceIds(posting.creditInvoiceRecordId, posting.creditInvoiceRecordIds) : invoice;
    if (source.tableId === INVOICE_TABLE && !debitInvoice.includes(source.recordId) && !creditInvoice.includes(source.recordId)) throw new PostingError("The invoice source must appear on a posting leg.");
    const context = {
      offset_account_code: null, notes: optionalText(posting.notes), audit_link: auditLink,
      vendor_ref: referenceIds(posting.vendorRecordId, posting.vendorRecordIds), customer_ref: referenceIds(posting.clientRecordId, posting.clientRecordIds),
      order_ref: referenceIds(posting.transactionRecordId, posting.transactionRecordIds), po_ref: referenceIds(posting.poRecordId, posting.poRecordIds),
      employee_ref: referenceIds(posting.staffRecordId, posting.staffRecordIds), state_ref: sourceRecordIds(posting.stateRecordIds), state_code: optionalText(posting.stateCode),
      airtable_record_id: optionalText(posting.sourceRecordId),
      airtable_record_ids: sourceRecordIds(posting.sourceRecordIds),
      branch: branchName(posting.branch),
    };
    const magnitude = formatCents(amount);
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
  if (!account?.is_postable) throw new PostingError(`No postable ledger account maps to ${recordId ?? "(empty)"} (${reference.number ?? "(empty)"}).`);
  return account.code;
}

// ==================== DATABASE ====================

async function createEntry(tx: TransactionSql, header: JournalHeader, lines: JournalLine[]): Promise<string> {
  const [created] = await tx<{ id: string }[]>`insert into public.journal_entries
    (entry_date, source_date, posting_request_id, rule_code, transaction_type, source_event_type, description, notes, audit_link, source_system, source_table, source_record_id, source_entry_key, external_ref)
    values (${header.entry_date}::date, ${header.source_date ?? header.entry_date}::date, ${header.posting_request_id ?? null}::uuid, ${header.rule_code}, ${header.transaction_type}, ${header.source_event_type}, ${header.description}, ${header.notes}, ${header.audit_link},
      ${header.source_system}, ${header.source_table}, ${header.source_record_id}, ${header.source_entry_key}, ${header.external_ref})
    returning id::text`;
  const rows = lines.map((line, index) => ({ entry_id: created.id, line_no: index + 1, ...line }));
  await tx`insert into public.journal_lines ${tx(rows, ...LINE_COLUMNS)}`;
  await tx`update public.journal_entries set status='posted' where id=${created.id}::uuid`;
  return created.id;
}

async function readLines(tx: TransactionSql, entryId: string): Promise<JournalLine[]> {
  return await tx<JournalLine[]>`select account_code, offset_account_code, debit::text, credit::text,
    notes, audit_link, vendor_ref, customer_ref, order_ref, po_ref, invoice_ref, employee_ref, state_ref, state_code, airtable_record_id, airtable_record_ids, branch
    from public.journal_lines where entry_id=${entryId}::uuid order by line_no`;
}

// ==================== VALIDATION ====================

function resolveSource(event: LedgerPaymentEvent, triggerId: string, invoiceEvent: boolean, recordTable: string | null): LedgerSource {
  if (event.source === undefined) return { tableId: recordTable ?? (invoiceEvent ? INVOICE_TABLE : PAYMENT_TABLE), recordId: triggerId, recordName: invoiceEvent || recordTable ? undefined : event.paymentName };
  if (!event.source || typeof event.source !== "object" || Array.isArray(event.source)) throw new PostingError("source must identify a FIN source table and record.");
  const tableId = optionalText(event.source.tableId), recordId = optionalText(event.source.recordId);
  if (!tableId || ![PAYMENT_TABLE, INVOICE_TABLE, DEPRECIATION_TABLE, PREPAY_TABLE].includes(tableId) || !recordId) throw new PostingError("source must identify a FIN Payments, Invoices, Depreciation Table or Prepay Expenses Log record.");
  if (recordTable && (tableId !== recordTable || recordId !== triggerId)) throw new PostingError("The record-created source must match its source record ID and table.");
  if (!recordTable && [DEPRECIATION_TABLE, PREPAY_TABLE].includes(tableId)) throw new PostingError("A depreciation or prepay-log source requires its record ID and eventType created.");
  if (invoiceEvent && (tableId !== INVOICE_TABLE || recordId !== triggerId)) throw new PostingError("An invoice source must match its FIN invoiceRecordId.");
  if (!invoiceEvent && tableId === PAYMENT_TABLE && recordId !== triggerId) throw new PostingError("A payment source must match paymentRecordId.");
  return { tableId, recordId, recordName: optionalText(event.source.recordName) ?? (tableId === PAYMENT_TABLE ? event.paymentName : undefined) };
}

function assertReplay(existing: JournalHeader, expected: JournalHeader, actualLines: JournalLine[], expectedLines: JournalLine[]): void {
  // The trigger's audit URL is metadata; a different payment must not repost an invoice total.
  if ((existing.source_date && existing.source_date !== expected.source_date) || existing.entry_date !== expected.entry_date || existing.rule_code !== expected.rule_code || existing.transaction_type !== expected.transaction_type ||
      existing.source_event_type !== expected.source_event_type || existing.source_entry_key !== expected.source_entry_key || existing.external_ref !== expected.external_ref ||
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
    if (!account?.is_postable) throw new PostingError(`Account ${line.account_code} is not postable.`);
    const debit = parseCents(line.debit), credit = parseCents(line.credit);
    if ((debit !== 0n) === (credit !== 0n)) throw new PostingError("Each journal line needs exactly one nonzero debit or credit.");
    if (line.state_code && !/^[A-Z]{2}$/.test(line.state_code)) throw new PostingError("stateCode must contain two uppercase letters.");
    balance += debit - credit;
  }
  if (balance !== 0n) throw new PostingError("Journal debits and credits must balance exactly.");
}

function canonicalLines(lines: JournalLine[]): string {
  return JSON.stringify(lines.map((line) => [line.account_code, line.offset_account_code, formatCents(parseCents(line.debit)), formatCents(parseCents(line.credit)),
    line.notes, sourceRecordIds(line.vendor_ref), sourceRecordIds(line.customer_ref), sourceRecordIds(line.order_ref), sourceRecordIds(line.po_ref), sourceRecordIds(line.invoice_ref), sourceRecordIds(line.employee_ref), sourceRecordIds(line.state_ref), line.state_code, line.airtable_record_id, sourceRecordIds(line.airtable_record_ids), line.branch]).map((line) => JSON.stringify(line)).sort());
}

function referenceIds(single: unknown, multiple: unknown): string[] {
  const id = optionalText(single);
  return sourceRecordIds([...(id ? [id] : []), ...sourceRecordIds(multiple)]);
}

function sourceRecordIds(value: unknown): string[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some(id => typeof id !== "string" || !id.trim())) throw new PostingError("sourceRecordIds must be an array of nonempty record IDs.");
  return [...new Set(value)].sort();
}

function branchName(value: unknown): string | null {
  if (!Array.isArray(value)) return optionalText(value);
  const values = value.map(optionalText);
  if (values.includes(null)) return null;
  const names = [...new Set(values)];
  // Aggregate payments spanning branches have no single branch attribution.
  return names.length === 1 ? names[0] : null;
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
