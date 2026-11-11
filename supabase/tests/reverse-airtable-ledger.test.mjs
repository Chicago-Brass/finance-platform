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

test("source and date alone reverse all owned journals without reading cached IDs", async () => {
  const recordId=id(9010);
  await postPayment(sql,event(recordId,["10.00","-2.50"]));
  const value={source:{tableId:PAYMENTS,recordId},reversalDate:"2026-11-09"};
  const first=await reverseJournals(sql,value);assert.equal(first.reversedCount,2);
  assert.equal((await reverseJournals(sql,value)).duplicateCount,2);
});

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

test("wrong ownership, unsupported sources and invalid requests cannot create reversals", async () => {
  const recordId = id(9006), otherId = id(9007);
  const posted = await postPayment(sql, event(recordId)); await postPayment(sql, event(otherId));
  const bad = [
    request(otherId, false, posted.journalEntryIds),
    { ...request(recordId), source: { tableId: "tblUnsupported000", recordId } },
    { ...request(recordId), source: { tableId: PAYMENTS, recordId: "bad" } },
    { ...request(recordId), reversalDate: "2026-02-30" },
    { ...request(recordId), journalEntryIds: ["not-uuid"] },
    { ...request(recordId), journalEntryIds: null },
  ];
  for (const value of bad) await assert.rejects(reverseJournals(sql, value));
  assert.equal((await journals(recordId)).length, 1); assert.equal((await journals(otherId)).length, 1);
  const empty = await reverseJournals(sql, request(id(9099)));
  assert.deepEqual(empty.journalEntryIds, []); assert.equal(empty.reversedCount, 0);
});

test("invoice-line posting and reversal retain line ownership and parent invoice references", async () => {
  const lineId=id(9101), invoiceId=id(9102), paymentId=id(9103), tableId="tblV26TC0f6CKDneL";
  const parent=event(invoiceId,["20.00"],true);
  parent.categories[0].postings[0].invoiceRecordId=invoiceId;
  await postPayment(sql,parent);
  const paid=event(paymentId,["20.00"]);
  paid.categories[0].postings[0].invoiceRecordId=invoiceId;
  await postPayment(sql,paid);
  const value={invoiceLineRecordId:lineId,eventType:"entry_requested",entryDate:"2026-10-29",
    source:{tableId,recordId:lineId,recordName:"Synthetic salary line"},
    categories:[{ruleCode:"EXP-06",transactionType:"Salary expense",postings:[{
      debitAccount:{number:"005.002"},creditAccount:{number:"211.100"},amount:"-7.50",
      invoiceRecordId:invoiceId,sourceRecordId:lineId,branch:"Chicago",
    }]}]};
  const posted=await postPayment(sql,value);
  assert.equal(posted.invoiceLineRecordId,lineId);assert.equal(posted.invoiceRecordId,undefined);
  assert.equal(posted.postedCount,1);
  const replay=await postPayment(sql,value);
  assert.equal(replay.duplicateCount,1);assert.deepEqual(replay.journalEntryIds,posted.journalEntryIds);
  const [header]=await journals(lineId);
  assert.equal(header.source_table,tableId);
  assert.equal(header.audit_link,`https://airtable.com/app0Q1UMEdUeWl538/${tableId}/${lineId}`);
  const lines=await sql`select invoice_ref,airtable_record_id,debit::text,credit::text from public.journal_lines where entry_id=${header.id} order by line_no`;
  assert(lines.every(line=>JSON.stringify(line.invoice_ref)===JSON.stringify([invoiceId])&&line.airtable_record_id===lineId));
  assert.equal(lines[0].debit,"-7.50");assert.equal(lines[1].credit,"-7.50");
  await assert.rejects(reverseJournals(sql,{source:{tableId:INVOICES,recordId:invoiceId},journalEntryIds:posted.journalEntryIds,reversalDate:"2026-11-09"}),/does not belong/);
  const reversal={source:{tableId,recordId:lineId},journalEntryIds:posted.journalEntryIds,reversalDate:"2026-11-09"};
  const reversed=await reverseJournals(sql,reversal);assert.equal(reversed.reversedCount,1);
  assert.equal((await reverseJournals(sql,reversal)).duplicateCount,1);
  assert.equal((await journals(invoiceId)).length,1);assert.equal((await journals(paymentId)).length,1);
  assert.equal((await journals(lineId)).length,2);
  const changed=structuredClone(value);changed.categories[0].postings[0].amount="-8.00";
  await assert.rejects(postPayment(sql,changed),/historically reversed/);
});

test("depreciation, prepaid-log and shipping reversals remain isolated to their source records", async () => {
  const fixtures=[
    {tableId:"tblC0dbO5UMXzHma9",field:"depreciationRecordId",recordId:id(9104),rule:"EXP-10",debit:"009.101",credit:"161.000"},
    {tableId:"tbl1LgiUYt7Gc492d",field:"prepayLogRecordId",recordId:id(9105),rule:"EXP-04",debit:"007.011",credit:"135.000"},
  ];
  fixtures.push({tableId:"tblAxlsdmJN0X0sQs",field:"shippingRecordId",recordId:id(9106),rule:"INV-14",debit:"221.100",credit:"004.001"});
  await sql`update public.ledger_rules set enabled=true where rule_code='INV-14'`;
  for(const f of fixtures){
    const value={[f.field]:f.recordId,eventType:"created",entryDate:"2026-10-29",
      source:{tableId:f.tableId,recordId:f.recordId},categories:[{ruleCode:f.rule,transactionType:"Synthetic recorded expense",postings:[{
        debitAccount:{number:f.debit},creditAccount:{number:f.credit},amount:"6.25",sourceRecordId:f.recordId,
      }]}]};
    const posted=await postPayment(sql,value);
    assert.equal(posted.postedCount,1);
    const reversal={source:{tableId:f.tableId,recordId:f.recordId},journalEntryIds:posted.journalEntryIds,reversalDate:"2026-11-09"};
    const result=await reverseJournals(sql,reversal);assert.equal(result.reversedCount,1);
    assert.equal((await reverseJournals(sql,reversal)).duplicateCount,1);
    const rows=await journals(f.recordId);assert.equal(rows.length,2);assert(rows.every(row=>row.source_table===f.tableId));
    assert.equal(rows[0].audit_link,`https://airtable.com/app0Q1UMEdUeWl538/${f.tableId}/${f.recordId}`);
    if(f.rule==='INV-14')await sql`update public.ledger_rules set enabled=false where rule_code='INV-14'`;
  }
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
