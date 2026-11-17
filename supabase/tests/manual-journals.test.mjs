import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import postgres from 'postgres';
import {postAndSync} from '../functions/ledger-payment/service.ts';
import {reverseAndSync} from '../functions/ledger-reversal/service.ts';
import {postPayment} from '../functions/ledger-payment/ledger.ts';
import {reverseJournals} from '../functions/ledger-reversal/reversal.ts';
import {reviewRequest} from '../functions/ledger-periods/service.ts';
import {LINK_FIELDS} from '../functions/_shared/ledger-links.ts';
import {MANUAL_TABLE as T,MANUAL_FIELDS as F} from '../functions/_shared/manual-journal.ts';
const url=process.env.LEDGER_TEST_DATABASE_URL;
if(!url||!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw Error('Use the disposable database runner.');
const sql=postgres(url,{prepare:false,max:4,onnotice(){}});after(()=>sql.end());
const id=n=>'rec'+String(n).padStart(14,'0');
const pair=(debit,credit,amount,line)=>({debitAccount:{number:debit},creditAccount:{number:credit},amount,branch:'Chicago',sourceRecordId:line,sourceRecordIds:[line],invoiceRecordIds:[id(12000)],vendorRecordIds:[id(12001)]});
const event=n=>({manualJournalRecordId:id(n),eventType:'entry_requested',entryDate:'2026-11-18',categories:[{ruleCode:'MAN-01',transactionType:'Manual Journal Entry',postings:[pair('006.002','112.100','100.01',id(12002)),pair('005.001','211.100','-25.25',id(12003))]}]});
function airtable(){const records=new Map(),calls=[];return {records,calls,async fetcher(url,options={}){const u=new URL(url);assert.equal(u.pathname,`/v0/app0Q1UMEdUeWl538/${T}`);calls.push(options.method||'GET');if(options.method==='PATCH'){const body=JSON.parse(options.body);for(const r of body.records)records.set(r.id,r.fields);return Response.json(body);}const recordId=JSON.parse(u.searchParams.get('filterByFormula').slice('RECORD_ID()='.length));return Response.json({records:[{id:recordId,fields:records.get(recordId)??{}}]});}};}
const count=async record=>Number((await sql`select count(*) n from journal_entries where source_table=${T} and source_record_id=${record}`)[0].n);
test('manual entry posts one whole journal, verifies Posted Entry and reverses every line exactly once',async()=>{
 const a=airtable(),e=event(12101),posted=await postAndSync(sql,e,'synthetic',a.fetcher);assert.equal(posted.postedCount,1);assert.equal(posted.journalEntryIds.length,1);assert.equal(await count(e.manualJournalRecordId),1);
 const [header]=await sql`select source_table,source_record_id,entry_date::text,source_entry_key from journal_entries where id=${posted.journalEntryIds[0]}::uuid`;assert.equal(header.source_table,T);assert.equal(header.source_record_id,e.manualJournalRecordId);assert.equal(header.entry_date,'2026-11-18');assert.equal(header.source_entry_key,'');
 const lines=await sql`select account_code,debit::text,credit::text,branch,vendor_ref,invoice_ref,airtable_record_id from journal_lines where entry_id=${posted.journalEntryIds[0]}::uuid order by line_no`;assert.equal(lines.length,4);assert(lines.every(l=>l.branch==='Chicago'&&l.vendor_ref[0]===id(12001)&&l.invoice_ref[0]===id(12000)));assert.deepEqual(lines.map(l=>l.airtable_record_id),[id(12002),id(12002),id(12003),id(12003)]);
 const saved=a.records.get(e.manualJournalRecordId),fields=LINK_FIELDS[T];assert.equal(saved[F.posted],true);assert.deepEqual(JSON.parse(saved[fields.ids]),posted.journalEntryIds);assert.equal(JSON.parse(saved[fields.postings])[0].rule,'MAN-01');assert.deepEqual(a.calls,['PATCH','GET']);
 const replay=await postAndSync(sql,e,'synthetic',a.fetcher);assert.equal(replay.duplicateCount,1);assert.equal(await count(e.manualJournalRecordId),1);
 const request={source:{tableId:T,recordId:e.manualJournalRecordId},reversalDate:'2026-11-19'};const reversal=await reverseAndSync(sql,request,'synthetic',a.fetcher);assert.equal(reversal.reversedCount,1);assert.equal(await count(e.manualJournalRecordId),2);assert.equal(a.records.get(e.manualJournalRecordId)[F.posted],true);assert.deepEqual(JSON.parse(a.records.get(e.manualJournalRecordId)[fields.reversalIds]),reversal.reversalJournalEntryIds);
 const net=await sql`select l.account_code,sum(l.debit-l.credit)::text balance from journal_lines l join journal_entries e on e.id=l.entry_id where e.source_table=${T} and e.source_record_id=${e.manualJournalRecordId} group by l.account_code`;assert(net.every(r=>Number(r.balance)===0));assert.equal((await reverseAndSync(sql,request,'synthetic',a.fetcher)).duplicateCount,1);assert.equal(await count(e.manualJournalRecordId),2);
});
test('one invalid manual line prevents the whole entry and all Airtable writeback',async()=>{
 const a=airtable(),e=event(12102);e.categories[0].postings[1].creditAccount.number='does-not-exist';await assert.rejects(()=>postAndSync(sql,e,'synthetic',a.fetcher),/No postable ledger account/);assert.equal(await count(e.manualJournalRecordId),0);assert.equal(a.calls.length,0);
});
test('confirmed missing manual writeback rolls back the journal; a partially saved Posted Entry does not authorize deletion',async t=>{
 t.mock.method(console,'error',()=>{});
 const fail=async(_url,options={})=>options.method==='PATCH'?new Response('forbidden',{status:403}):Response.json({records:[{id:id(12103),fields:{}}]});await assert.rejects(()=>postAndSync(sql,event(12103),'synthetic',fail),e=>e.outcome==='rolled_back');assert.equal(await count(id(12103)),0);
 const partial=async(_url,options={})=>options.method==='PATCH'?Response.json({}):Response.json({records:[{id:id(12104),fields:{[F.posted]:true}}]});await assert.rejects(()=>postAndSync(sql,event(12104),'synthetic',partial),e=>e.outcome==='unconfirmed');assert.equal(await count(id(12104)),1);
});
test('cancelling an unposted manual entry withdraws its pending closed-period request',async()=>{
 const manager='manual-period-manager@example.test';await sql`insert into app_users(email,role,can_manage_periods) values(${manager},'finance',true)`;
 await sql`update accounting_periods set status='closed' where period_month='2098-04-01'`;
 const e=event(12105);e.entryDate='2098-04-18';const held=await postPayment(sql,e);assert.equal(held.status,'pending_review');assert.equal(await count(e.manualJournalRecordId),0);
 const reversed=await reverseJournals(sql,{source:{tableId:T,recordId:e.manualJournalRecordId},reversalDate:'2026-11-18'});assert.equal(reversed.reversedCount,0);
 const [request]=await sql`select status from ledger_posting_requests where id=${held.requestId}::uuid`;assert.equal(request.status,'rejected');await assert.rejects(()=>reviewRequest(sql,manager,held.requestId,'approve','Attempt after cancellation'),/no longer awaiting review/);assert.equal(await count(e.manualJournalRecordId),0);
});
