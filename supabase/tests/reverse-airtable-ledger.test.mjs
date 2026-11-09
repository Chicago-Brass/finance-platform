import assert from "node:assert/strict";
import { after, test } from "node:test";
import postgres from "postgres";
import { postPayment } from "../functions/ledger-payment/ledger.ts";
import { reverseJournals } from "../functions/ledger-reversal/reversal.ts";

const url = process.env.LEDGER_TEST_DATABASE_URL;
if (!url || !["127.0.0.1", "localhost"].includes(new URL(url).hostname)) throw new Error("Use the disposable check-payment-posting.sh runner.");
const sql = postgres(url, { prepare: false, max: 4, connect_timeout: 5, onnotice: () => {} });
const PAYMENTS = "tblR61NG9i0giid28", INVOICES = "tbldQXuqNEp8G5pfs";
const id = n => "rec" + String(n).padStart(14, "0");
const posting = amount => ({ debitAccount: { number: "211.100" }, creditAccount: { number: "112.100" }, amount,
  vendorRecordIds: ["recVendorA", "recVendorB"], stateRecordIds: ["recStateA"], sourceRecordIds: ["recLineA", "recLineB"], branch: "Chicago" });
const event = (recordId, amounts = ["10.00"], invoice = false) => ({
  ...(invoice ? { invoiceRecordId: recordId } : { paymentRecordId: recordId }),
  eventType: invoice ? "entry_requested" : "sent", entryDate: "2026-10-29",
  categories: amounts.map((amount, i) => ({ ruleCode: "PAY-07", entryKey: String(i), transactionType: "Reversal test", postings: [posting(amount)] })),
});
const request = (recordId, invoice = false, journalEntryIds = []) => ({ source: { tableId: invoice ? INVOICES : PAYMENTS, recordId }, journalEntryIds, reversalDate: "2026-11-09" });
const journals = recordId => sql`select * from public.journal_entries where source_record_id=${recordId} order by entry_number`;

test("reverses every account journal and preserves all stored metadata and signed lines", async () => {
  const recordId = id(9001);
  const posted = await postPayment(sql, event(recordId, ["10.00", "-2.50", "6.00"]));
  const before = await journals(recordId);
  const result = await reverseJournals(sql, request(recordId, false, posted.journalEntryIds.slice(0, 1)));
  assert.equal(result.reversedCount, 3); assert.equal(result.duplicateCount, 0);
  assert.equal(result.journalEntryIds.length, 3); assert.equal(result.reversalJournalEntryIds.length, 3);
  const after = await journals(recordId);
  assert.deepEqual(after.filter(j => !j.reverses_entry_id), Array.from(before), "posted originals remain immutable");
  for (const row of result.results) {
    const [original] = after.filter(j => j.id === row.journalEntryId);
    const [reversed] = after.filter(j => j.id === row.reversalJournalEntryId);
    assert.equal(reversed.reverses_entry_id, original.id); assert.equal(reversed.source_entry_key, original.source_entry_key);
    assert.equal(reversed.transaction_type, original.transaction_type); assert.equal(reversed.source_event_type, "reversed");
    assert.equal(reversed.entry_date.toISOString().slice(0, 10), "2026-11-09"); assert.equal(reversed.audit_link, original.audit_link);
    const oldLines = await sql`select * from public.journal_lines where entry_id=${original.id} order by line_no`;
    const newLines = await sql`select * from public.journal_lines where entry_id=${reversed.id} order by line_no`;
    assert.equal(newLines.length, oldLines.length);
    for (let i = 0; i < oldLines.length; i++) {
      const { id: _oldId, entry_id: _oldEntry, created_at: _oldCreated, debit, credit, ...refs } = oldLines[i];
      const { id: _newId, entry_id: _newEntry, created_at: _newCreated, ...actual } = newLines[i];
      assert.deepEqual(actual, { ...refs, debit: credit, credit: debit });
    }
  }
});

test("concurrent retries reuse one reversal per journal", async () => {
  const recordId = id(9002); await postPayment(sql, event(recordId, ["3.00", "4.00"]));
  const results = await Promise.all([reverseJournals(sql, request(recordId)), reverseJournals(sql, request(recordId))]);
  assert.equal(results.reduce((n, r) => n + r.reversedCount, 0), 2);
  assert.equal(results.reduce((n, r) => n + r.duplicateCount, 0), 2);
  assert.deepEqual(results[0].reversalJournalEntryIds, results[1].reversalJournalEntryIds);
  assert.equal((await journals(recordId)).length, 4);
  await assert.rejects(reverseJournals(sql, { ...request(recordId), reversalDate: "2026-11-10" }), /different date/);
  assert.equal((await journals(recordId)).length, 4);
});

test("invoice reversal stays invoice-owned and does not touch linked payment journals", async () => {
  const invoiceId = id(9003), paymentId = id(9004);
  const invoice = event(invoiceId, ["7.00"], true);
  invoice.categories[0].postings[0].invoiceRecordId = invoiceId;
  await postPayment(sql, invoice);
  const payment = event(paymentId); payment.categories[0].postings[0].invoiceRecordId = invoiceId;
  await postPayment(sql, payment);
  const result = await reverseJournals(sql, request(invoiceId, true));
  assert.equal(result.reversedCount, 1); assert.equal((await journals(paymentId)).length, 1);
  assert.ok((await journals(invoiceId)).every(j => j.source_table === INVOICES));
});

test("mixed completed and pending reversals return the complete ID set", async () => {
  const recordId = id(9005); await postPayment(sql, event(recordId));
  await reverseJournals(sql, request(recordId));
  const anotherEvent = event(recordId, ["2.00"]); anotherEvent.eventType = "reconciled"; anotherEvent.categories[0].ruleCode = "PAY-26";
  await postPayment(sql, anotherEvent);
  const result = await reverseJournals(sql, request(recordId));
  assert.equal(result.reversedCount, 1); assert.equal(result.duplicateCount, 1);
  assert.equal(result.reversalJournalEntryIds.length, 2); assert.equal((await journals(recordId)).length, 4);
});

test("wrong ownership, deferred sources and invalid requests cannot create reversals", async () => {
  const recordId = id(9006), otherId = id(9007);
  const posted = await postPayment(sql, event(recordId)); await postPayment(sql, event(otherId));
  const bad = [
    request(otherId, false, posted.journalEntryIds),
    { ...request(recordId), source: { tableId: "tblC0dbO5UMXzHma9", recordId } },
    { ...request(recordId), source: { tableId: PAYMENTS, recordId: "bad" } },
    { ...request(recordId), reversalDate: "2026-02-30" },
    { ...request(recordId), journalEntryIds: ["not-uuid"] },
  ];
  for (const value of bad) await assert.rejects(reverseJournals(sql, value));
  assert.equal((await journals(recordId)).length, 1); assert.equal((await journals(otherId)).length, 1);
  const empty = await reverseJournals(sql, request(id(9099)));
  assert.deepEqual(empty.journalEntryIds, []); assert.equal(empty.reversedCount, 0);
});

test("closed periods retain pending reversals and nonreversible rules stay protected", async () => {
  const recordId = id(9008); await postPayment(sql, event(recordId, ["1.00", "2.00"]));
  const blocked = { ...request(recordId), reversalDate: "2098-01-15" };
  await sql`insert into public.accounting_periods (period_month,status) values ('2098-01-01','closed') on conflict(period_month) do update set status='closed'`;
  assert.equal((await reverseJournals(sql,blocked)).status,"pending_review");
  assert.equal((await journals(recordId)).length, 2);
  const [rule] = await sql`select reversible from public.ledger_rules where rule_code='PAY-07'`;
  await sql`update public.ledger_rules set reversible=false where rule_code='PAY-07'`;
  try {
    await assert.rejects(reverseJournals(sql, request(recordId)), /reversible/);
    assert.equal((await journals(recordId)).length, 2);
  } finally {
    await sql`update public.ledger_rules set reversible=${rule.reversible} where rule_code='PAY-07'`;
  }
});

test("a blocked later journal rolls back an earlier reversal in the same request", async () => {
  const recordId = id(9009), value = event(recordId, ["1.00", "2.00"]);
  value.categories[1].ruleCode = "PAY-26";
  await postPayment(sql, value);
  const rows = await sql`select rule_code from public.journal_entries where source_record_id=${recordId} order by id`;
  const blockedRule = rows.at(-1).rule_code;
  const [rule] = await sql`select reversible from public.ledger_rules where rule_code=${blockedRule}`;
  await sql`update public.ledger_rules set reversible=false where rule_code=${blockedRule}`;
  try {
    await assert.rejects(reverseJournals(sql, request(recordId)), /reversible/);
    assert.equal((await journals(recordId)).length, 2);
  } finally {
    await sql`update public.ledger_rules set reversible=${rule.reversible} where rule_code=${blockedRule}`;
  }
});

after(async () => { await sql.end(); });
