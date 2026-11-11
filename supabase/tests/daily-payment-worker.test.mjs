import test,{after}from 'node:test';
import assert from 'node:assert/strict';
import postgres from 'postgres';
import {DatabaseLedgerStore,DatabaseRunStore}from '../functions/ledger-daily/store.ts';
import {initialState}from '../functions/ledger-daily/runner.ts';
import {postPayment}from '../functions/ledger-payment/ledger.ts';
const url=process.env.LEDGER_TEST_DATABASE_URL;if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Use the disposable ledger test runner.');
const sql=postgres(url,{prepare:false,max:4,onnotice(){}});after(()=>sql.end());
const event=(id,rule='PAY-07',amount='10.00')=>({paymentRecordId:id,eventType:'sent',entryDate:'2026-11-01',categories:[{ruleCode:rule,transactionType:'Daily payment test',postings:[{debitAccount:{number:'211.100'},creditAccount:{number:'112.100'},amount}]}]});
test('daily scope can add a category while old webhook scope and existing posted values remain strict',async()=>{
 const original=event('recDailyAdditional');await postPayment(sql,original);const next=event('recDailyAdditional','PAY-08');
 await assert.rejects(()=>postPayment(sql,next),e=>e.code==='23505');const result=await postPayment(sql,next,{allowAdditionalCategories:true});assert.equal(result.postedCount,1);
 assert.equal((await postPayment(sql,original,{allowAdditionalCategories:true})).duplicateCount,1);
 await assert.rejects(()=>postPayment(sql,event('recDailyAdditional','PAY-07','11.00'),{allowAdditionalCategories:true}),e=>e.code==='23505');
 const rows=await sql`select * from public.journal_entries where source_record_id='recDailyAdditional'`;assert.equal(rows.length,2);
});
test('daily metadata preserves per-journal rule/key/UTC time and bulk-checks an empty source',async()=>{
 const ledger=new DatabaseLedgerStore(sql,"not-used-in-read-check");await ledger.prepareSources('tblR61NG9i0giid28',['recDailyAdditional','missing']);const refs=[...await ledger.findCategory('tblR61NG9i0giid28','recDailyAdditional','PAY-07'),...await ledger.findCategory('tblR61NG9i0giid28','recDailyAdditional','PAY-08')];assert.equal(refs.length,2);assert(refs.every(r=>/T.*Z$/.test(r.datetime)&&r.key===''));
 assert.equal((await ledger.findCategory('tblR61NG9i0giid28','recDailyAdditional','PAY-07')).length,1);assert.equal((await ledger.findCategory('tblR61NG9i0giid28','missing','PAY-07')).length,0);assert.equal(await ledger.hasReversals('tblR61NG9i0giid28','missing'),false);
});
test('run lease prevents concurrent workers and resumes saved discovery state',async()=>{
 const runs=new DatabaseRunStore(sql),state=initialState(['PAY-07'],true);const claims=await Promise.all([runs.claim('test-daily-lease',state),runs.claim('test-daily-lease',state)]);assert.equal(claims.filter(Boolean).length,1);const job=claims.find(Boolean);job.state.recordIds=['candidate'];job.state.offset='next';await runs.save(job);await runs.release(job);
 const resumed=await runs.claim('test-daily-lease',state);assert.deepEqual(resumed.state.recordIds,['candidate']);assert.equal(resumed.state.offset,'next');await runs.release(resumed);
 await assert.rejects(()=>runs.claim('test-daily-lease',initialState(['PAY-08'],true)),/different category scope/);
 await assert.rejects(()=>runs.claim('test-daily-lease',initialState(['PAY-07'],true,{tableId:'tblR61NG9i0giid28',recordId:'rec00000000000001'})),RangeError);
});
test('run checkpoints are private to the backend service role',async()=>{
 await assert.rejects(()=>sql.begin(async tx=>{await tx`set local role authenticated`;return tx`select * from public.ledger_daily_runs`}),e=>e.code==='42501');
});
