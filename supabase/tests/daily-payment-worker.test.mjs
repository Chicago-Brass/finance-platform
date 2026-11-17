import test,{after}from 'node:test';
import assert from 'node:assert/strict';
import postgres from 'postgres';
import {DatabaseLedgerStore,DatabaseRunStore}from '../functions/ledger-daily/store.ts';
import {initialState}from '../functions/ledger-daily/runner.ts';
import {postPayment}from '../functions/ledger-payment/ledger.ts';
import {invoiceWorkerFields as F}from '../functions/ledger-daily/definitions.ts';
import {createCategoryEvaluator}from '../functions/ledger-daily/categories/index.ts';
import {INVOICE_CATEGORIES}from '../functions/ledger-daily/rules/invoice-entry.ts';
const url=process.env.LEDGER_TEST_DATABASE_URL;if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Use the disposable ledger test runner.');
const sql=postgres(url,{prepare:false,max:4,onnotice(){}});after(()=>sql.end());
const event=(id,rule='PAY-09',amount='10.00')=>({paymentRecordId:id,eventType:'sent',entryDate:'2026-11-01',categories:[{ruleCode:rule,transactionType:'Daily payment test',postings:[{debitAccount:{number:'211.100'},creditAccount:{number:'112.100'},amount}]}]});
test('daily scope can add a category while old webhook scope and existing posted values remain strict',async()=>{
 const original=event('recDailyAdditional');await postPayment(sql,original);const next=event('recDailyAdditional','PAY-08');
 await assert.rejects(()=>postPayment(sql,next),e=>e.code==='23505');const result=await postPayment(sql,next,{allowAdditionalCategories:true});assert.equal(result.postedCount,1);
 assert.equal((await postPayment(sql,original,{allowAdditionalCategories:true})).duplicateCount,1);
 await assert.rejects(()=>postPayment(sql,event('recDailyAdditional','PAY-09','11.00'),{allowAdditionalCategories:true}),e=>e.code==='23505');
 const rows=await sql`select * from public.journal_entries where source_record_id='recDailyAdditional'`;assert.equal(rows.length,2);
});
test('daily metadata preserves per-journal rule/key/UTC time and bulk-checks an empty source',async()=>{
 const ledger=new DatabaseLedgerStore(sql,"not-used-in-read-check");await ledger.prepareSources('tblR61NG9i0giid28',['recDailyAdditional','missing']);const refs=[...await ledger.findCategory('tblR61NG9i0giid28','recDailyAdditional','PAY-09'),...await ledger.findCategory('tblR61NG9i0giid28','recDailyAdditional','PAY-08')];assert.equal(refs.length,2);assert(refs.every(r=>/T.*Z$/.test(r.datetime)&&r.key===''));
 assert.equal((await ledger.findCategory('tblR61NG9i0giid28','recDailyAdditional','PAY-09')).length,1);assert.equal((await ledger.findCategory('tblR61NG9i0giid28','missing','PAY-09')).length,0);assert.equal(await ledger.hasReversals('tblR61NG9i0giid28','missing'),false);
});
test('run lease prevents concurrent workers and resumes saved discovery state',async()=>{
 const runs=new DatabaseRunStore(sql),state=initialState(['PAY-09'],true);const claims=await Promise.all([runs.claim('test-daily-lease',state),runs.claim('test-daily-lease',state)]);assert.equal(claims.filter(Boolean).length,1);const job=claims.find(Boolean);job.state.recordIds=['candidate'];job.state.offset='next';await runs.save(job);await runs.release(job);
 const resumed=await runs.claim('test-daily-lease',state);assert.deepEqual(resumed.state.recordIds,['candidate']);assert.equal(resumed.state.offset,'next');resumed.state.done=true;await runs.save(resumed);await runs.release(resumed);
 await assert.rejects(()=>runs.claim('test-daily-lease',initialState(['PAY-08'],true)),/different category scope/);
 await assert.rejects(()=>runs.claim('test-daily-lease',initialState(['PAY-09'],true,{tableId:'tblR61NG9i0giid28',recordId:'rec00000000000001'})),RangeError);
});
test('run checkpoints are private to the backend service role',async()=>{
 await assert.rejects(()=>sql.begin(async tx=>{await tx`set local role authenticated`;return tx`select * from public.ledger_daily_runs`}),e=>e.code==='42501');
});

test('targeted and date-scoped runs survive JSONB checkpoint storage and resume',async()=>{
 const runs=new DatabaseRunStore(sql),state=initialState(['EXP-05'],false,{tableId:'tblV26TC0f6CKDneL',recordId:'rec00000000000001'},{from:'2026-01-01',to:'2026-11-12'});
 const job=await runs.claim('test-targeted-checkpoint',state);assert(job);
 job.state.done=true;await runs.save(job);await runs.release(job);
 const resumed=await runs.claim('test-targeted-checkpoint',state);assert(resumed.state.done);await runs.release(resumed);
});

test('two payments against the same five invoices post only their allocated cash and deduplicate',async()=>{
 const {TABLES:T,INVOICE_FIELDS:I,PAYMENT_FIELDS:P,ACCOUNT_FIELDS:A}=F,rows=new Map(),id=n=>'rec'+String(n).padStart(14,'0');
 const put=(tableId,recordId,fields)=>{const row={tableId,id:recordId,name:recordId,value:f=>fields[f]??null,text:f=>{const v=fields[f];return v==null?'':Array.isArray(v)?v.map(x=>x.name??x).join(', '):typeof v==='object'?v.name:String(v);}};rows.set(tableId+'/'+recordId,row);return row;};
 const invoices=[0,1,2,3,4].map(n=>put(T.invoices,id(5100+n),{[I.type]:{name:'AR'},[I.vendorTypeAR]:{name:'AR - Product'},[I.kind]:{name:n<3?'Deposit Invoice':'Full Invoice'},[I.amount]:100,[I.paymentProportion]:0.2,[I.date]:'2026-11-01',[I.branch]:{name:'Chicago'}}));
 const account=put(T.accounts,id(5300),{[A.number]:'112.100'});
 const client={async readRecord(t,n){return rows.get(t+'/'+n)??null;},async readRecords(t,ids){return ids.map(n=>{const row=rows.get(t+'/'+n);assert(row);return row;});}};
 const evaluate=createCategoryEvaluator(client),paymentIds=[];
 for(const [index,amount]of [200,300].entries()){
  const payment=put(T.payments,id(5200+index),{[P.amount]:amount,[P.sent]:true,[P.recordType]:{name:'Regular Payment'},[P.date]:'2026-11-02',[P.invoices]:invoices.map(i=>({id:i.id})),[P.accounts]:[{id:account.id}]});paymentIds.push(payment.id);
  for(const code of ['INV-13','INV-16']){
   const event=await evaluate(INVOICE_CATEGORIES.find(c=>c.code===code),payment);assert(event);
   assert.equal((await postPayment(sql,event,{allowAdditionalCategories:true})).postedCount,1);
   assert.equal((await postPayment(sql,event,{allowAdditionalCategories:true})).duplicateCount,1);
  }
 }
 const entries=await sql`select id from public.journal_entries where source_record_id in ${sql(paymentIds)}`;assert.equal(entries.length,4);
 const totals=await sql`select l.account_code,sum(l.debit)::text debit,sum(l.credit)::text credit from public.journal_lines l join public.journal_entries e on e.id=l.entry_id where e.source_record_id in ${sql(paymentIds)} group by l.account_code`;
 assert.equal(Number(totals.find(x=>x.account_code==='112.100').debit),500);assert.equal(Number(totals.find(x=>x.account_code==='121.100').credit),500);
});
