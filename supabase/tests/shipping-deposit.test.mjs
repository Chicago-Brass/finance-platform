import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import postgres from 'postgres';
import {postPayment} from '../functions/ledger-payment/ledger.ts';
import {postCappedShipment,readDepositBalance} from '../functions/_shared/shipping-deposit.ts';
import {reverseJournals} from '../functions/ledger-reversal/reversal.ts';
const url=process.env.LEDGER_TEST_DATABASE_URL;
if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Use the disposable ledger test runner.');
const sql=postgres(url,{prepare:false,max:4,onnotice(){}});after(()=>sql.end());
const id=n=>'recShip'+String(n).padStart(10,'0');
const funding=async(n,amount='5000.00')=>{
 const record=id(n);await postPayment(sql,{invoiceRecordId:record,eventType:'entry_requested',entryDate:'2026-11-01',categories:[{ruleCode:'INV-12',transactionType:'Synthetic deposit funding',postings:[{debitAccount:{number:'121.100'},creditAccount:{number:'221.100'},amount,invoiceRecordId:record}]}]});return record;
};
const shipment=(n,deposit,cents,amount=(cents/100).toFixed(2))=>({shippingRecordId:id(n),source:{tableId:'tblrnXm1HN9y6HPxY',recordId:id(n)},eventType:'created',entryDate:'2026-11-02',categories:[{ruleCode:'INV-14',entryKey:JSON.stringify([deposit,cents]),transactionType:'Shipment Against Customer Deposit',postings:[{debitAccount:{number:'221.100'},creditAccount:{number:'004.001'},amount,invoiceRecordId:deposit,invoiceRecordIds:[deposit],branch:'Chicago'}]}]});
test('sequential shipments release 3000 then only 2000 from one 5000 deposit, with exact replay and signed reversals',async()=>{
 const dep=await funding(1);assert.equal(await readDepositBalance(sql,dep),500000);
 const first=shipment(2,dep,300000);const a=await postCappedShipment(sql,first);assert.equal(a.postedCount,1);assert.equal(await readDepositBalance(sql,dep),200000);
 const second=shipment(3,dep,500000);const b=await postCappedShipment(sql,second);assert.equal(b.postedCount,1);assert.equal(await readDepositBalance(sql,dep),0);
 assert.equal((await postCappedShipment(sql,second)).duplicateCount,1);
 const [row]=await sql`select debit::text from public.journal_lines where entry_id=${b.journalEntryIds[0]}::uuid and account_code='221.100'`;assert.equal(Number(row.debit),2000);
 const changed=shipment(3,dep,500001);await assert.rejects(()=>postCappedShipment(sql,changed),/different deposit or shipment/);
 assert.equal((await postCappedShipment(sql,shipment(4,dep,200000))).postedCount,0);
 await reverseJournals(sql,{source:first.source,reversalDate:'2026-11-03'});assert.equal(await readDepositBalance(sql,dep),300000);
 assert.equal((await reverseJournals(sql,{source:first.source,reversalDate:'2026-11-03'})).duplicateCount,1);
 assert.equal((await postCappedShipment(sql,shipment(4,dep,200000))).postedCount,1);assert.equal(await readDepositBalance(sql,dep),100000);
 const [net]=await sql`select sum(l.debit-l.credit) as net from public.journal_lines l join public.journal_entries e on e.id=l.entry_id where e.source_table='tblrnXm1HN9y6HPxY' and l.invoice_ref @> ${[dep]}::text[]`;assert.equal(Number(net.net),0);
});
test('concurrent shipments share the funding-invoice lock and cannot overdraw the deposit',async()=>{
 const dep=await funding(10);const results=await Promise.all([postCappedShipment(sql,shipment(11,dep,400000)),postCappedShipment(sql,shipment(12,dep,400000))]);assert.equal(results.reduce((n,r)=>n+r.postedCount,0),2);assert.equal(await readDepositBalance(sql,dep),0);
 const lines=await sql`select l.debit::text from public.journal_lines l join public.journal_entries e on e.id=l.entry_id where e.source_table='tblrnXm1HN9y6HPxY' and l.account_code='221.100' and l.invoice_ref @> ${[dep]}::text[]`;assert.deepEqual(lines.map(r=>Number(r.debit)).sort((a,b)=>a-b),[1000,4000]);
});
test('deposit budgets stay isolated and negative shipments retain their sign',async()=>{
 const a=await funding(20,'25.00'),b=await funding(21,'75.00');await postCappedShipment(sql,shipment(22,a,10000));assert.equal(await readDepositBalance(sql,a),0);assert.equal(await readDepositBalance(sql,b),7500);
 await postCappedShipment(sql,shipment(23,a,-500));assert.equal(await readDepositBalance(sql,a),500);
 const invalid=shipment(24,a,500);invalid.categories[0].postings[0].creditAccount.number='004.002';await assert.rejects(()=>postCappedShipment(sql,invalid),/one deposit-linked/);
});

test('closed-period approval rechecks deposit availability instead of posting a stale cap',async()=>{
 const {reviewRequest}=await import('../functions/ledger-periods/service.ts');
 const manager='shipping-period-manager@example.test';await sql`insert into public.app_users(email,role,can_manage_periods) values (${manager},'finance',true)`;
 await sql`insert into public.accounting_periods(period_month,status) values ('2096-04-01','closed') on conflict(period_month) do update set status='closed'`;
 const dep=await funding(30),pending=shipment(31,dep,500000);pending.entryDate='2096-04-02';
 const held=await postCappedShipment(sql,pending);assert.equal(held.status,'pending_review');
 await postCappedShipment(sql,shipment(32,dep,400000));
 await assert.rejects(()=>reviewRequest(sql,manager,held.requestId,'approve','Check changed funding'),/Deposit availability changed/);
 assert.equal(await readDepositBalance(sql,dep),100000);
 const [request]=await sql`select status from public.ledger_posting_requests where id=${held.requestId}::uuid`;assert.equal(request.status,'pending');
 await reviewRequest(sql,manager,held.requestId,'reject','Funding changed; do not post the old amount');
 const second=shipment(33,dep,50000);second.entryDate='2096-04-03';
 const ready=await postCappedShipment(sql,second);assert.equal(ready.status,'pending_review');
 await reviewRequest(sql,manager,ready.requestId,'approve','Unchanged cap is valid');assert.equal(await readDepositBalance(sql,dep),50000);
});

test('confirmed shipping writeback failure rolls back its release and restores the deposit budget',async()=>{
 const {postAndSync}=await import('../functions/ledger-payment/service.ts');
 const dep=await funding(40,'50.00'),value=shipment(41,dep,5000);
 const absent=async(_url,options)=>options.method==='PATCH'?Response.json({error:'synthetic rejected save'},{status:403}):Response.json({records:[{id:value.shippingRecordId,fields:{}}]});
 await assert.rejects(()=>postAndSync(sql,value,'synthetic-token',absent),error=>error.outcome==='rolled_back');
 assert.equal(await readDepositBalance(sql,dep),5000);
 const [{count}]=await sql`select count(*) from public.journal_entries where source_record_id=${value.shippingRecordId}`;assert.equal(Number(count),0);
 assert.equal((await postCappedShipment(sql,value)).postedCount,1);assert.equal(await readDepositBalance(sql,dep),0);
});
