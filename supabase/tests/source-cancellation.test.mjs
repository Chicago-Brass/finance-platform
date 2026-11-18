import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, test } from "node:test";
import postgres from "postgres";
import { postPayment } from "../functions/ledger-payment/ledger.ts";
import { reverseJournals } from "../functions/ledger-reversal/reversal.ts";
import { reverseAndSync } from "../functions/ledger-reversal/service.ts";
import { reviewRequest } from "../functions/ledger-periods/service.ts";
import { holdForReview } from "../functions/_shared/period-review.ts";
import { MANUAL_TABLE } from "../functions/_shared/manual-journal.ts";

const url = process.env.LEDGER_TEST_DATABASE_URL;
if (!url || !["127.0.0.1", "localhost"].includes(new URL(url).hostname)) throw Error("Use the disposable ledger test runner.");
const sql = postgres(url, { prepare: false, max: 6, onnotice() {} });
const manager = "cancellation-manager@example.test";
await sql`insert into public.app_users(email,role,can_manage_periods) values (${manager},'finance',true)`;
await sql`insert into public.accounting_periods(period_month,status) values ('2096-09-01','closed') on conflict(period_month) do update set status='closed'`;
const sources = [
  ["tblR61NG9i0giid28", "paymentRecordId", "sent", "PAY-09"],
  ["tbldQXuqNEp8G5pfs", "invoiceRecordId", "entry_requested", "EXP-01"],
  ["tblV26TC0f6CKDneL", "invoiceLineRecordId", "entry_requested", "EXP-06"],
  ["tblC0dbO5UMXzHma9", "depreciationRecordId", "created", "EXP-10"],
  ["tbl1LgiUYt7Gc492d", "prepayLogRecordId", "created", "EXP-04"],
  ["tblrnXm1HN9y6HPxY", "shippingRecordId", "created", "INV-14"],
  [MANUAL_TABLE, "manualJournalRecordId", "entry_requested", "MAN-01"],
];
const [shippingRule] = await sql`select enabled from public.ledger_rules where rule_code='INV-14'`;
await sql`update public.ledger_rules set enabled=true where rule_code='INV-14'`;
after(async () => { await sql`update public.ledger_rules set enabled=${shippingRule.enabled} where rule_code='INV-14'`; await sql.end(); });
const id = n => "rec" + String(n).padStart(14, "0");
function event(n, fixture = sources[0], date = "2026-10-29") {
  const [tableId, field, eventType, ruleCode] = fixture;
  return { [field]: id(n), source: { tableId, recordId: id(n) }, eventType, entryDate: date,
    categories: [{ ruleCode, transactionType: "Cancellation test", postings: [
      { debitAccount: { number: "211.100" }, creditAccount: { number: "112.100" }, amount: "12.34" },
    ] }] };
}
const request = e => ({ source: e.source, reversalDate: "2026-11-09" });
const marker = e => sql`select * from ledger_private.ledger_source_cancellations where source_table=${e.source.tableId} and source_record_id=${e.source.recordId}`;
const journals = e => sql`select * from public.journal_entries where source_table=${e.source.tableId} and source_record_id=${e.source.recordId}`;

test("an empty reversal durably prevents stale first posting for every supported source", async () => {
  for (let i = 0; i < sources.length; i++) {
    const e = event(15000 + i, sources[i]);
    assert.equal((await reverseJournals(sql, request(e))).reversedCount, 0);
    assert.equal((await marker(e)).length, 1);
    await assert.rejects(postPayment(sql, e), /cancelled or historically reversed/);
    assert.equal((await journals(e)).length, 0);
    assert.equal((await reverseJournals(sql, request(e))).reversedCount, 0);
    assert.equal((await marker(e)).length, 1);
  }
});

test("cancellation withdraws all source-owned pending postings and approval cannot revive them", async () => {
  for (let i = 0; i < sources.length; i++) {
    const e = event(15010 + i, sources[i], "2096-09-15");
    const held = await postPayment(sql, e);
    assert.equal(held.status, "pending_review");
    await reverseJournals(sql, request(e));
    const [saved] = await sql`select status,review_reason from public.ledger_posting_requests where id=${held.requestId}::uuid`;
    assert.equal(saved.status, "rejected");
    assert.equal(saved.review_reason, "Source cancelled in Airtable");
    await assert.rejects(reviewRequest(sql, manager, held.requestId, "approve", "Attempt cancelled approval"), /no longer awaiting review/);
    await assert.rejects(postPayment(sql, e), /cancelled or historically reversed/);
    assert.equal((await journals(e)).length, 0);
  }
});

test("source locks serialize both posting-first and reversal-first orderings", async () => {
  for (const reverseFirst of [true, false]) {
    const e = event(reverseFirst ? 15020 : 15021);
    let ready, release;
    const started = new Promise(resolve => { ready = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    const first = sql.begin(async tx => {
      const result = reverseFirst
        ? await reverseJournals(sql, request(e), { transaction: tx })
        : await postPayment(sql, e, { transaction: tx });
      ready();
      await gate;
      return result;
    });
    await started;
    const second = reverseFirst ? postPayment(sql, e) : reverseJournals(sql, request(e));
    const verified = reverseFirst ? assert.rejects(second, /cancelled or historically reversed/) : second;
    release();
    await first;
    await verified;
    const rows = await journals(e);
    assert.equal(rows.length, reverseFirst ? 0 : 2);
    if (!reverseFirst) {
      const [{ balance }] = await sql`select sum(l.debit-l.credit)::text as balance from public.journal_lines l where l.entry_id in (select id from public.journal_entries where source_record_id=${e.source.recordId})`;
      assert.equal(Number(balance), 0);
    }
  }
});

test("pending reversal preserves cancellation while exact existing replay and reversal approval remain valid", async () => {
  const e = event(15022);
  await postPayment(sql, e);
  const reversal = { ...request(e), reversalDate: "2096-09-20" };
  const held = await reverseJournals(sql, reversal);
  assert.equal(held.status, "pending_review");
  assert.equal((await marker(e)).length, 1);
  assert.equal((await postPayment(sql, e)).duplicateCount, 1, "existing replay can repair links without creating anything");
  const changed = structuredClone(e);
  changed.categories[0].ruleCode = "PAY-13";
  await assert.rejects(postPayment(sql, changed, { allowAdditionalCategories: true }), /cancelled or historically reversed/);
  const approved = await reviewRequest(sql, manager, held.requestId, "approve", "Reviewed cancellation");
  assert.equal(approved.journalEntryIds.length, 1);
  assert.equal((await reverseJournals(sql, reversal)).duplicateCount, 1);
  assert.equal((await journals(e)).length, 2);
});

test("failed reversal writeback cannot erase cancellation intent", async t => {
  t.mock.method(console, "error", () => {});
  const e = event(15023);
  await postPayment(sql, e);
  await assert.rejects(reverseAndSync(sql, request(e), "synthetic", async () => new Response("forbidden", { status: 403 })), /could not be confirmed/);
  assert.equal((await marker(e)).length, 1);
  await assert.rejects(postPayment(sql, e), /historically reversed/);
  assert.equal((await journals(e)).length, 2);
});

test("cancellation metadata is not exposed or mutable by browser roles", async () => {
  for (const role of ["anon", "authenticated"]) {
    for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
      const [{ allowed }] = await sql`select has_table_privilege(${role},'ledger_private.ledger_source_cancellations',${privilege}) as allowed`;
      assert.equal(allowed, false);
    }
  }
  const [{ rls }] = await sql`select relrowsecurity as rls from pg_class where oid='ledger_private.ledger_source_cancellations'::regclass`;
  assert.equal(rls, true);
  const [{ canDelete, canUpdate }] = await sql`select has_table_privilege('service_role','ledger_private.ledger_source_cancellations','DELETE') as "canDelete",has_table_privilege('service_role','ledger_private.ledger_source_cancellations','UPDATE') as "canUpdate"`;
  assert.equal(canDelete, false);
  assert.equal(canUpdate, false);
});

test("upgrade backfills historical reversals and withdraws their legacy pending posting reviews", async () => {
  const e = event(15024);
  await postPayment(sql, e);
  await reverseJournals(sql, request(e));
  const migration = await readFile(new URL("../migrations/20261118000240_persist_source_cancellations.sql", import.meta.url), "utf8");
  const rollback = Error("Rollback migration fixture");
  await assert.rejects(sql.begin(async tx => {
    await tx`set local role service_role`;
    const held = await holdForReview(tx, { kind: "posting", source: e.source, eventType: "reconciled", date: "2096-09-15", payload: e });
    await tx`set local role postgres`;
    await tx`drop table ledger_private.ledger_source_cancellations`;
    await tx.unsafe(migration);
    const [saved] = await tx`select status from public.ledger_posting_requests where id=${held.requestId}::uuid`;
    assert.equal(saved.status, "rejected");
    const [cancelled] = await tx`select reversal_date::text from ledger_private.ledger_source_cancellations where source_table=${e.source.tableId} and source_record_id=${e.source.recordId}`;
    assert.equal(cancelled.reversal_date, "2026-11-09");
    const next = structuredClone(e);
    next.categories[0].ruleCode = "PAY-13";
    await assert.rejects(postPayment(sql, next, { transaction: tx, allowAdditionalCategories: true }), /cancelled or historically reversed/);
    throw rollback;
  }), error => error === rollback);
});
