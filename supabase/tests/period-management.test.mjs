import assert from "node:assert/strict";
import { test, after } from "node:test";
import postgres from "postgres";
import { postPayment } from "../functions/ledger-payment/ledger.ts";
import { reverseJournals } from "../functions/ledger-reversal/reversal.ts";
import {
  changePeriod,
  reviewRequest,
  completeWriteback,
} from "../functions/ledger-periods/service.ts";
const url = process.env.LEDGER_TEST_DATABASE_URL;
if (!url || !["127.0.0.1", "localhost"].includes(new URL(url).hostname))
  throw Error("Use the disposable database runner.");
const sql = postgres(url, { prepare: false, max: 6, onnotice: () => {} });
const manager = "period-manager@example.test",
  viewer = "period-viewer@example.test";
await sql`insert into public.app_users(email,role,can_manage_periods) values (${manager},'finance',true),(${viewer},'admin',false)`;
const id = (n) => "rec" + String(n).padStart(14, "0");
const event = (n, date = "2097-05-15") => ({
  paymentRecordId: id(n),
  eventType: "sent",
  entryDate: date,
  categories: [
    {
      ruleCode: "PAY-07",
      transactionType: "Period test",
      postings: [
        {
          debitAccount: { number: "211.100" },
          creditAccount: { number: "112.100" },
          amount: "12.34",
        },
      ],
    },
  ],
});
const month = "2097-05-01";
await sql`insert into public.accounting_periods(period_month,status) values (${month},'closed') on conflict(period_month) do update set status='closed'`;

test("closed-period requests persist without journals; reopening and exact retries do not approve them", async () => {
  const e = event(9701);
  const a = await postPayment(sql, e);
  assert.equal(a.status, "pending_review");
  const b = await postPayment(sql, e);
  assert.equal(a.requestId, b.requestId);
  assert.equal(
    (
      await sql`select * from public.journal_entries where source_record_id=${e.paymentRecordId}`
    ).length,
    0,
  );
  await changePeriod(sql, manager, "open", month, "Review late entries");
  const c = await postPayment(sql, e);
  assert.equal(c.status, "pending_review");
  assert.equal(c.requestId, a.requestId);
  const approved = await reviewRequest(
    sql,
    manager,
    a.requestId,
    "approve",
    "Reviewed source and accounts",
  );
  assert.equal(approved.journalEntryIds.length, 1);
  const retry = await reviewRequest(
    sql,
    manager,
    a.requestId,
    "approve",
    "Retry approval",
  );
  assert.equal(retry.duplicate, true);
  assert.deepEqual(approved.journalEntryIds, retry.journalEntryIds);
  assert.equal((await postPayment(sql, e)).duplicateCount, 1);
});

test("one exception posts while closed; other requests and period status stay unchanged", async () => {
  await changePeriod(
    sql,
    manager,
    "close",
    month,
    "Closing after review",
    true,
  );
  const a = await postPayment(sql, event(9702));
  const b = await postPayment(sql, event(9703));
  await reviewRequest(
    sql,
    manager,
    a.requestId,
    "approve",
    "Approved individual exception",
  );
  const [p] =
    await sql`select status from public.accounting_periods where period_month=${month}`;
  assert.equal(p.status, "closed");
  const [q] =
    await sql`select status from public.ledger_posting_requests where id=${b.requestId}`;
  assert.equal(q.status, "pending");
  const rows =
    await sql`select * from public.journal_entries where posting_request_id=${a.requestId}`;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].source_date.toISOString().slice(0, 10), "2097-05-15");
  await reviewRequest(sql, manager, b.requestId, "reject", "Wrong source");
  assert.equal((await postPayment(sql, event(9703))).status, "rejected");
});

test("permissions require the boolean even for admins; the user cannot self-enable it", async () => {
  await assert.rejects(
    () => changePeriod(sql, viewer, "open", month, "Unauthorized"),
    (e) => e.code === "42501",
  );
  const r = await postPayment(sql, event(9704));
  await assert.rejects(
    () => reviewRequest(sql, viewer, r.requestId, "approve", "Unauthorized"),
    (e) => e.code === "42501",
  );
  await assert.rejects(() =>
    sql.begin(async (tx) => {
      await tx`set local role authenticated`;
      await tx`select set_config('request.jwt.claims',${JSON.stringify({ email: viewer, role: "authenticated" })},true)`;
      await tx`update public.app_users set can_manage_periods=true where email=${viewer}`;
    }),
  );
});

test("changed packets need fresh review and supersede old pending packets", async () => {
  const e = event(9705);
  const a = await postPayment(sql, e);
  e.categories[0].postings[0].amount = "14.00";
  const b = await postPayment(sql, e);
  assert.notEqual(a.requestId, b.requestId);
  await assert.rejects(
    () => reviewRequest(sql, manager, a.requestId, "approve", "Old request"),
    /no longer/,
  );
  await reviewRequest(
    sql,
    manager,
    b.requestId,
    "approve",
    "Updated amount reviewed",
  );
});

test("closed-period reversal waits for review, posts once and preserves original targets", async () => {
  const e = event(9706, "2097-06-15");
  await changePeriod(sql, manager, "open", "2097-06-01", "Open June");
  await postPayment(sql, e);
  const req = {
    source: { tableId: "tblR61NG9i0giid28", recordId: e.paymentRecordId },
    journalEntryIds: [],
    reversalDate: "2097-05-20",
  };
  const held = await reverseJournals(sql, req);
  assert.equal(held.status, "pending_review");
  await reviewRequest(
    sql,
    manager,
    held.requestId,
    "approve",
    "Reversal exception reviewed",
  );
  const retry = await reverseJournals(sql, req);
  assert.equal(retry.reversedCount, 0);
  assert.equal(retry.duplicateCount, 1);
});

test("missing periods queue instead of implicitly opening, and close history is append-only", async () => {
  const r = await postPayment(sql, event(9707, "2197-05-15"));
  assert.equal(r.status, "pending_review");
  await changePeriod(sql, manager, "open", "2197-05-01", "Explicit opening");
  assert.equal(
    (await postPayment(sql, event(9707, "2197-05-15"))).status,
    "pending_review",
  );
  await assert.rejects(
    () =>
      changePeriod(sql, manager, "close", "2197-05-01", "Pending unresolved"),
    /Resolve the pending/,
  );
  await changePeriod(
    sql,
    manager,
    "close",
    "2197-05-01",
    "Explicitly deferred",
    true,
  );
  await assert.rejects(
    () =>
      sql`update public.ledger_period_history set reason='rewrite' where period_month='2197-05-01'`,
    /append-only/,
  );
  await assert.rejects(
    () =>
      sql`delete from public.ledger_period_history where period_month='2197-05-01'`,
    /append-only/,
  );
});

test("approval rollback cannot leak a closed-period bypass or an approved status", async () => {
  const r = await postPayment(sql, event(9708));
  await sql`update public.accounts set is_postable=false where code='211.100'`;
  try {
    await assert.rejects(() =>
      reviewRequest(
        sql,
        manager,
        r.requestId,
        "approve",
        "Account became blocked",
      ),
    );
  } finally {
    await sql`update public.accounts set is_postable=true where code='211.100'`;
  }
  const [request] =
    await sql`select status from public.ledger_posting_requests where id=${r.requestId}`;
  assert.equal(request.status, "pending");
  assert.equal(
    (
      await sql`select id from public.journal_entries where posting_request_id=${r.requestId}`
    ).length,
    0,
  );
});

test("concurrent approvals create one journal; concurrent close/post never loses a request", async () => {
  const r = await postPayment(sql, event(9709));
  const both = await Promise.all([
    reviewRequest(sql, manager, r.requestId, "approve", "A"),
    reviewRequest(sql, manager, r.requestId, "approve", "B"),
  ]);
  assert.equal(both.filter((x) => x.duplicate).length, 1);
  assert.equal(
    (
      await sql`select id from public.journal_entries where posting_request_id=${r.requestId}`
    ).length,
    1,
  );
  const m = "2197-07-01";
  await changePeriod(sql, manager, "open", m, "Race test");
  const e = event(9710, "2197-07-10");
  const [, posted] = await Promise.all([
    changePeriod(sql, manager, "close", m, "Race close", true),
    postPayment(sql, e),
  ]);
  assert.ok(posted.status === "pending_review" || posted.postedCount === 1);
  const [p] =
    await sql`select status from public.accounting_periods where period_month=${m}`;
  assert.equal(p.status, "closed");
  assert.equal(
    (await postPayment(sql, event(9711, "2197-07-11"))).status,
    "pending_review",
  );
});

test("writeback failures are repairable without creating more journals", async () => {
  const r = await postPayment(sql, event(9712));
  const approved = await reviewRequest(
    sql,
    manager,
    r.requestId,
    "approve",
    "Writeback test",
  );
  const result = await completeWriteback(
    sql,
    approved,
    "test",
    async () => new Response("denied", { status: 403 }),
  );
  assert.equal(result.writebackPending, true);
  const retried = await reviewRequest(
    sql,
    manager,
    r.requestId,
    "approve",
    "Repair only",
  );
  assert.equal(retried.duplicate, true);
  assert.equal(
    (
      await sql`select id from public.journal_entries where posting_request_id=${r.requestId}`
    ).length,
    1,
  );
});
test("direct/manual posting cannot bypass a pending review after reopening",async()=>{
 const e=event(9713,"2197-08-15");const held=await postPayment(sql,e);
 await changePeriod(sql,manager,"open","2197-08-01","Review pending entry");
 await assert.rejects(()=>sql.begin(async tx=>{
   const [entry]=await tx`insert into public.journal_entries(entry_date,source_system,source_table,source_record_id,source_event_type,rule_code,description)
     values ('2197-08-15','airtable','tblR61NG9i0giid28',${e.paymentRecordId},'sent','PAY-07','Manual bypass attempt') returning id`;
   await tx`insert into public.journal_lines(entry_id,line_no,account_code,debit,credit) values (${entry.id},1,'211.100',12.34,0),(${entry.id},2,'112.100',0,12.34)`;
   await tx`update public.journal_entries set status='posted' where id=${entry.id}`;
 }),/explicit review/);
 await reviewRequest(sql,manager,held.requestId,"approve","Approved through review service");
});
after(() => sql.end({ timeout: 2 }));
