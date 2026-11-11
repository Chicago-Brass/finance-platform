import assert from "node:assert/strict";
import test, { after } from "node:test";
import postgres from "postgres";
import { postAndSync } from "../functions/ledger-payment/service.ts";
import { reverseAndSync } from "../functions/ledger-reversal/service.ts";
import { postPayment } from "../functions/ledger-payment/ledger.ts";
import { syncLedgerLinks, LINK_FIELDS } from "../functions/_shared/ledger-links.ts";
import { handleRequest } from "../functions/ledger-payment/handler.ts";
import { DatabaseLedgerStore } from "../functions/ledger-daily/store.ts";

const databaseUrl = process.env.LEDGER_TEST_DATABASE_URL;
if (!databaseUrl || !["127.0.0.1", "localhost"].includes(new URL(databaseUrl).hostname)) throw new Error("Use the disposable ledger test runner.");
const sql = postgres(databaseUrl, { prepare: false, max: 4, onnotice() {} });
after(() => sql.end());
const P = "tblR61NG9i0giid28", I = "tbldQXuqNEp8G5pfs", token = "synthetic-airtable-token";
const id = n => `rec${String(n).padStart(14, "0")}`;
const category = (code = "PAY-07", key = "") => ({ ruleCode: code, entryKey: key, transactionType: "Link test", postings: [{ debitAccount: { number: "211.100" }, creditAccount: { number: "112.100" }, amount: "10.00" }] });
const payment = n => ({ paymentRecordId: id(n), eventType: "sent", entryDate: "2026-11-01", categories: [category()] });
const count = async recordId => Number((await sql`select count(*) as n from public.journal_entries where source_record_id=${recordId}`)[0].n);

function airtable() {
  const records = new Map(), calls = [];
  const fetcher = async (url, options) => {
    assert.equal(options.headers.Authorization, `Bearer ${token}`);
    const parsed = new URL(url), tableId = parsed.pathname.split("/").at(-1);
    assert.equal(parsed.hostname, "api.airtable.com");
    calls.push({ tableId, method: options.method || "GET" });
    if (options.method === "PATCH") {
      const body = JSON.parse(options.body);
      assert.equal(body.records.length, 1);
      for (const record of body.records) records.set(`${tableId}/${record.id}`, record.fields);
      return Response.json({ records: body.records });
    }
    const recordId = JSON.parse(parsed.searchParams.get("filterByFormula").slice("RECORD_ID()=".length));
    return Response.json({ records: [{ id: recordId, fields: records.get(`${tableId}/${recordId}`) }] });
  };
  return { records, calls, fetcher };
}

test("original payment webhook writes complete structured links and independently verifies them", async () => {
  const a = airtable(), event = payment(9301);
  event.categories.push(category("PAY-08", "231.100"));
  const result = await postAndSync(sql, event, token, a.fetcher);
  assert.equal(result.postedCount, 2);
  assert.deepEqual(a.calls.map(c => c.method), ["PATCH", "GET"]);
  const fields = LINK_FIELDS[P], saved = a.records.get(`${P}/${event.paymentRecordId}`);
  assert.deepEqual(JSON.parse(saved[fields.postings]), result.ledgerPostings);
  assert.equal(result.ledgerPostings.length, 2);
  assert(result.ledgerPostings.every(p => /^\d{4}-.*T.*Z$/.test(p.datetime) && p.id));
  assert.deepEqual(result.ledgerPostings.map(p => [p.rule, p.key]), [["PAY-07", ""], ["PAY-08", "231.100"]]);
  assert.deepEqual(JSON.parse(saved[fields.reversalIds]), []);
  a.records.clear();
  const retried = await postAndSync(sql, event, token, a.fetcher);
  assert.equal(retried.duplicateCount, 2); assert.equal(await count(event.paymentRecordId), 2);
  assert.equal(JSON.parse(a.records.get(`${P}/${event.paymentRecordId}`)[fields.ids]).length, 2);
});

test("native invoice creation and payment-triggered invoice packets update the invoice, not the payment", async () => {
  for (const n of [9302, 9303]) {
    const a = airtable(), invoiceId = id(n);
    const event = n === 9302 ? { invoiceRecordId: invoiceId, eventType: "entry_requested", entryDate: "2026-11-01", categories: [category("EXP-11")] } :
      { ...payment(9403), source: { tableId: I, recordId: invoiceId }, categories: [category("PAY-11")] };
    event.categories[0].postings[0].invoiceRecordId = invoiceId;
    const result = await postAndSync(sql, event, token, a.fetcher);
    assert.equal(result.postedCount, 1); assert(a.calls.every(c => c.tableId === I));
    assert(a.records.has(`${I}/${invoiceId}`)); assert(!a.records.has(`${P}/${id(9403)}`));
  }
});

test("writeback keeps prior event categories and restores the entire source journal set", async () => {
  const a = airtable(), event = payment(9304);
  await postAndSync(sql, event, token, a.fetcher);
  const later = { ...event, eventType: "reconciled", categories: [category("PAY-26")] };
  const result = await postAndSync(sql, later, token, a.fetcher);
  assert.equal(result.journalEntryIds.length, 1, "existing response still describes the submitted event");
  assert.equal(result.ledgerPostings.length, 2, "Airtable receives all source-owned original journals");
  assert.equal(JSON.parse(a.records.get(`${P}/${event.paymentRecordId}`)[LINK_FIELDS[P].ids]).length, 2);
});

test("unreadable Airtable retains journals and reports an unconfirmed outcome", async t => {
  const event = payment(9305), a = airtable(), env = { databaseUrl, webhookSecret: "test-secret" };
  t.mock.method(console, "error", () => {});
  const request = () => new Request("https://example.test/ledger-payment", { method: "POST", headers: { "x-ledger-secret": env.webhookSecret }, body: JSON.stringify(event) });
  const failed = await handleRequest(request(), env, value => postAndSync(sql, value, token, async () => new Response("private permission error", { status: 403 })));
  assert.equal(failed.status, 503); assert.equal(await count(event.paymentRecordId), 1);
  const body = await failed.json(); assert.equal(body.code, "airtable_writeback_failed"); assert.equal(body.outcome, "unconfirmed");
  assert(!JSON.stringify(body).includes("private permission error"));
  const repaired = await postAndSync(sql, event, token, a.fetcher);
  assert.equal(repaired.postedCount, 0); assert.equal(repaired.duplicateCount, 1); assert.equal(await count(event.paymentRecordId), 1);
});

test("lost PATCH response is resolved by one targeted GET; stale readback never reports success", async () => {
  const event = payment(9306), a = airtable(); let patches = 0;
  const uncertain = async (url, options) => {
    const result = await a.fetcher(url, options);
    if (options.method === "PATCH" && ++patches === 1) throw new Error("connection lost after server saved fields");
    return result;
  };
  await postAndSync(sql, event, token, uncertain);
  assert.equal(patches, 1); assert.equal(await count(event.paymentRecordId), 1);
  await assert.rejects(() => postAndSync(sql, event, token, async (url, options) => options.method === "PATCH" ? a.fetcher(url, options) : Response.json({ records: [] })), /could not be confirmed/);
  assert.equal(await count(event.paymentRecordId), 1);
});

test("lost PATCH response without a save rolls back every new journal and its lines", async () => {
  const event = payment(9320), calls = [];
  event.categories.push(category("PAY-08"));
  const fetcher = async (url, options) => {
    calls.push(options.method || "GET");
    if (options.method === "PATCH") throw new Error("Connection lost before save");
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("maxRecords"), "1");
    assert.equal(parsed.searchParams.get("filterByFormula"), `RECORD_ID()="${event.paymentRecordId}"`);
    assert.deepEqual(parsed.searchParams.getAll("fields[]").sort(), Object.values(LINK_FIELDS[P]).sort());
    return Response.json({ records: [{ id: event.paymentRecordId, fields: {} }] });
  };
  await assert.rejects(() => postAndSync(sql, event, token, fetcher), error => error.outcome === "rolled_back");
  assert.deepEqual(calls, ["PATCH", "GET"]);
  assert.equal(await count(event.paymentRecordId), 0);
  assert.equal(Number((await sql`select count(*) as n from public.journal_lines where airtable_record_id=${event.paymentRecordId}`)[0].n), 0);
  const retry = await postAndSync(sql, event, token, airtable().fetcher);
  assert.equal(retry.postedCount, 2); assert.equal(retry.duplicateCount, 0);
});

test("confirmed rejection deletes only new journals, preserving duplicate and unrelated journals", async () => {
  const event = payment(9321), a = airtable();
  await postAndSync(sql, event, token, a.fetcher);
  const original = await sql`select id::text from public.journal_entries where source_record_id=${event.paymentRecordId}`;
  event.categories.push(category("PAY-08"));
  const denied = (url, options) => options.method === "PATCH" ? new Response("private rejection", { status: 403 }) : a.fetcher(url, options);
  await assert.rejects(() => postAndSync(sql, event, token, denied, { allowAdditionalCategories: true }), error => error.outcome === "rolled_back");
  assert.deepEqual(await sql`select id::text from public.journal_entries where source_record_id=${event.paymentRecordId}`, original);
  assert.equal(Number((await sql`select count(*) as n from public.journal_lines where entry_id=${original[0].id}::uuid`)[0].n), 2);
  assert.equal(await count(id(9301)), 2, "unrelated source remains untouched");
});

test("a partial save containing a new ID never deletes its journals", async t => {
  t.mock.method(console, "error", () => {});
  const event = payment(9322), a = airtable();
  const partial = async (url, options) => {
    const response = await a.fetcher(url, options);
    if (options.method === "PATCH") {
      const saved = a.records.get(`${P}/${event.paymentRecordId}`);
      delete saved[LINK_FIELDS[P].postings];
      throw new Error("Partial save; response lost");
    }
    return response;
  };
  await assert.rejects(() => postAndSync(sql, event, token, partial), error => error.outcome === "unconfirmed");
  assert.equal(await count(event.paymentRecordId), 1);
  const saved = a.records.get(`${P}/${event.paymentRecordId}`);
  assert.equal(JSON.parse(saved[LINK_FIELDS[P].ids]).length, 1);
});

test("lost PATCH and GET responses never authorize deletion", async t => {
  t.mock.method(console, "error", () => {});
  const event = payment(9323), a = airtable(); let reads = 0;
  const unavailable = async (url, options) => {
    if (options.method !== "PATCH") { reads++; return new Response("unavailable", { status: 503 }); }
    await a.fetcher(url, options);
    throw new Error("Saved but response lost");
  };
  await assert.rejects(() => postAndSync(sql, event, token, unavailable), error => error.outcome === "unconfirmed");
  assert.equal(reads, 3); assert.equal(await count(event.paymentRecordId), 1);
});

test("daily posting uses the same writeback and rollback flow without a second PATCH", async () => {
  const event = payment(9324), a = airtable(), daily = new DatabaseLedgerStore(sql, token, a.fetcher);
  const result = await daily.post(event);
  assert.equal(result.postedCount, 1); assert.deepEqual(a.calls.map(c => c.method), ["PATCH", "GET"]);
  const bad = payment(9325);
  const rejected = new DatabaseLedgerStore(sql, token, async (url, options) => options.method === "PATCH" ? new Response("rejected", { status: 422 }) :
    Response.json({ records: [{ id: bad.paymentRecordId, fields: {} }] }));
  await assert.rejects(() => rejected.post(bad), error => error.outcome === "rolled_back");
  assert.equal(await count(bad.paymentRecordId), 0);
});

test("a failed compensating delete is not reported as a successful rollback", async t => {
  t.mock.method(console, "error", () => {});
  const event = payment(9327);
  await sql`create function public.test_reject_rollback() returns trigger language plpgsql as $$
    begin raise exception 'synthetic rollback failure'; end $$`;
  await sql`create trigger test_reject_rollback before delete on public.journal_entries
    for each row when (old.source_record_id='rec00000000009327') execute function public.test_reject_rollback()`;
  try {
    const fetcher = async (url, options) => options.method === "PATCH" ? new Response("denied", { status: 403 }) :
      Response.json({ records: [{ id: event.paymentRecordId, fields: {} }] });
    await assert.rejects(() => postAndSync(sql, event, token, fetcher), error => error.outcome === "unconfirmed");
    assert.equal(await count(event.paymentRecordId), 1);
  } finally {
    await sql`drop trigger test_reject_rollback on public.journal_entries`;
    await sql`drop function public.test_reject_rollback()`;
  }
});

test("database failure performs no Airtable write", async () => {
  const event = payment(9326), a = airtable();
  event.categories[0].postings[0].creditAccount.number = "missing-account";
  await assert.rejects(() => postAndSync(sql, event, token, a.fetcher));
  assert.equal(a.calls.length, 0); assert.equal(await count(event.paymentRecordId), 0);
});

test("reversal refreshes metadata and both ID arrays for all journals, and retries repair lost links", async () => {
  for (const n of [9307, 9308]) {
    const a = airtable(), tableId = n === 9307 ? P : I, recordId = id(n);
    const event = tableId === P ? payment(n) : { invoiceRecordId: recordId, eventType: "entry_requested", entryDate: "2026-11-01", categories: [category("EXP-07", "005.101"), category("EXP-07", "005.003")] };
    if (tableId === P) event.categories.push(category("PAY-08"));
    await postAndSync(sql, event, token, a.fetcher);
    const request = { source: { tableId, recordId }, journalEntryIds: [], reversalDate: "2026-11-09" };
    await assert.rejects(() => reverseAndSync(sql, request, token, async () => new Response("denied", { status: 403 })));
    assert.equal(await count(recordId), 4, "reversal committed before the failed cache update");
    const result = await reverseAndSync(sql, request, token, a.fetcher);
    assert.equal(result.reversedCount, 0); assert.equal(result.duplicateCount, 2);
    const saved = a.records.get(`${tableId}/${recordId}`), fields = LINK_FIELDS[tableId];
    assert.deepEqual(JSON.parse(saved[fields.postings]), result.ledgerPostings);
    assert.deepEqual(JSON.parse(saved[fields.ids]), result.journalEntryIds);
    assert.deepEqual(JSON.parse(saved[fields.reversalIds]), result.reversalJournalEntryIds);
    assert.equal(result.ledgerPostings.length, 2, "only originals belong in the posted-category cache");
    await reverseAndSync(sql, request, token, a.fetcher); assert.equal(await count(recordId), 4);
  }
});

test("missing writeback credentials prevent payment/invoice posting or reversal before financial changes", async () => {
  const event = payment(9309);
  await assert.rejects(() => postAndSync(sql, event, ""), /could not be confirmed/); assert.equal(await count(event.paymentRecordId), 0);
  await postPayment(sql, event);
  await assert.rejects(() => reverseAndSync(sql, { source: { tableId: P, recordId: event.paymentRecordId }, journalEntryIds: [], reversalDate: "2026-11-09" }, ""), /could not be confirmed/);
  assert.equal(await count(event.paymentRecordId), 1);
});

test("invalid source ownership cannot write Airtable, and no-journal sources cause no mutation", async () => {
  const a = airtable(), event = { ...payment(9310), source: { tableId: P, recordId: id(9999) } };
  await assert.rejects(() => postAndSync(sql, event, token, a.fetcher)); assert.equal(a.calls.length, 0);
  await assert.rejects(() => syncLedgerLinks(sql, { tableId: "toString", recordId: id(9310) }, token, a.fetcher), /Unsupported/);
  const result = await reverseAndSync(sql, { source: { tableId: I, recordId: id(9311) }, journalEntryIds: [], reversalDate: "2026-11-09" }, token, a.fetcher);
  assert.equal(result.reversedCount, 0); assert.equal(a.calls.length, 0);
});

test("concurrent metadata syncs serialize by source and preserve both event categories", async () => {
  const a = airtable(), event = payment(9312);
  await postPayment(sql, event);
  await postPayment(sql, { ...event, eventType: "reconciled", categories: [category("PAY-26")] });
  await Promise.all([syncLedgerLinks(sql, { tableId: P, recordId: event.paymentRecordId }, token, a.fetcher), syncLedgerLinks(sql, { tableId: P, recordId: event.paymentRecordId }, token, a.fetcher)]);
  assert.deepEqual(a.calls.map(c => c.method), ["PATCH", "GET", "PATCH", "GET"]);
  assert.equal(JSON.parse(a.records.get(`${P}/${event.paymentRecordId}`)[LINK_FIELDS[P].postings]).length, 2);
});

test("daily writeback shares the native source lock and complete verified journal lists", async () => {
  const a = airtable(), event = payment(9315);
  await postPayment(sql, event);
  await postPayment(sql, { ...event, eventType: "reconciled", categories: [category("PAY-26")] });
  const daily = new DatabaseLedgerStore(sql, token, a.fetcher);
  const [refs] = await Promise.all([
    daily.syncLinks(P, event.paymentRecordId),
    syncLedgerLinks(sql, { tableId: P, recordId: event.paymentRecordId }, token, a.fetcher),
  ]);
  assert.equal(refs.length, 2);
  assert.deepEqual(a.calls.map(c => c.method), ["PATCH", "GET", "PATCH", "GET"]);
  const saved = a.records.get(`${P}/${event.paymentRecordId}`), fields = LINK_FIELDS[P];
  assert.equal(JSON.parse(saved[fields.ids]).length, 2);
  assert.deepEqual(JSON.parse(saved[fields.reversalIds]), []);
  assert.equal(await count(event.paymentRecordId), 2);
});

test("depreciation, prepaid and shipping records write to their own source fields and retain their posting contracts", async () => {
  for (const [n, field, rule, debit, credit, tableId] of [[9313, "depreciationRecordId", "EXP-10", "009.101", "161.000", "tblC0dbO5UMXzHma9"], [9314, "prepayLogRecordId", "EXP-04", "006.002", "135.000", "tbl1LgiUYt7Gc492d"], [9370, "shippingRecordId", "INV-14", "221.100", "004.001", "tblAxlsdmJN0X0sQs"]]) {
    if (rule === "INV-14") await sql`update public.ledger_rules set enabled=true where rule_code='INV-14'`;
    const a = airtable();
    const event = { [field]: id(n), eventType: "created", entryDate: "2026-11-01", categories: [{ ruleCode: rule, transactionType: "Existing log entry", postings: [{ debitAccount: { number: debit }, creditAccount: { number: credit }, amount: "1.00" }] }] };
    await assert.rejects(() => postAndSync(sql, event, ""), /could not be confirmed/); assert.equal(await count(id(n)), 0);
    const result = await postAndSync(sql, event, token, a.fetcher);
    assert.equal(result.postedCount, 1); assert.equal(result[field], id(n)); assert.equal(await count(id(n)), 1);
    assert.deepEqual(a.calls.map(call => [call.tableId, call.method]), [[tableId, "PATCH"], [tableId, "GET"]]);
    const saved = a.records.get(`${tableId}/${id(n)}`), fields = LINK_FIELDS[tableId];
    assert.deepEqual(JSON.parse(saved[fields.postings]), result.ledgerPostings);
    assert.deepEqual(JSON.parse(saved[fields.ids]), result.journalEntryIds);
    const reversed = await reverseAndSync(sql, { source: { tableId, recordId: id(n) }, journalEntryIds: [], reversalDate: "2026-11-09" }, token, a.fetcher);
    assert.equal(reversed.reversedCount, 1); assert(a.calls.every(call => call.tableId === tableId));
    assert.deepEqual(JSON.parse(a.records.get(`${tableId}/${id(n)}`)[fields.reversalIds]), reversed.reversalJournalEntryIds);
    if (rule === "INV-14") await sql`update public.ledger_rules set enabled=false where rule_code='INV-14'`;
  }
});

test("an inferred invoice-line source posts, replays and reverses only its own metadata", async () => {
  const a = airtable(), tableId = "tblV26TC0f6CKDneL", recordId = id(9341), invoiceId = id(9342);
  const event = { invoiceLineRecordId: recordId, eventType: "entry_requested", entryDate: "2026-11-01", categories: [category("EXP-06")] };
  event.categories[0].postings[0].invoiceRecordId = invoiceId;
  event.categories[0].postings[0].sourceRecordId = recordId;
  const result = await postAndSync(sql, event, token, a.fetcher);
  assert.equal(result.invoiceLineRecordId, recordId); assert.equal(result.postedCount, 1);
  assert.deepEqual(a.calls.map(call => call.method), ["PATCH", "GET"]); assert(a.calls.every(call => call.tableId === tableId));
  assert(!a.records.has(`${I}/${invoiceId}`));
  const replay = await postAndSync(sql, event, token, a.fetcher); assert.equal(replay.duplicateCount, 1); assert.equal(await count(recordId), 1);
  const fields = LINK_FIELDS[tableId], saved = a.records.get(`${tableId}/${recordId}`);
  assert.deepEqual(JSON.parse(saved[fields.postings]), result.ledgerPostings);
  const reversed = await reverseAndSync(sql, { source: { tableId, recordId }, journalEntryIds: [], reversalDate: "2026-11-09" }, token, a.fetcher);
  assert.equal(reversed.reversedCount, 1); assert.equal(await count(recordId), 2);
  assert.deepEqual(JSON.parse(a.records.get(`${tableId}/${recordId}`)[fields.reversalIds]), reversed.reversalJournalEntryIds);
});

test("confirmed invoice-line writeback failure rolls back only its new journal", async () => {
  const tableId = "tblV26TC0f6CKDneL", recordId = id(9343);
  const event = { invoiceLineRecordId: recordId, eventType: "entry_requested", entryDate: "2026-11-01", categories: [category("EXP-06")] };
  const calls = [], fetcher = async (_url, options) => {
    calls.push(options.method || "GET");
    return options.method === "PATCH" ? new Response("denied", { status: 403 }) : Response.json({ records: [{ id: recordId, fields: {} }] });
  };
  await assert.rejects(() => postAndSync(sql, event, token, fetcher), error => error.outcome === "rolled_back");
  assert.deepEqual(calls, ["PATCH", "GET"]); assert.equal(await count(recordId), 0);
});
