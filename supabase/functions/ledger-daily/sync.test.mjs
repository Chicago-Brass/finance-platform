import test from 'node:test';
import assert from 'node:assert/strict';
import {CATEGORIES,candidateFormula} from './queries.ts';
import {syncDateRange,inSyncDateRange} from './scope.ts';
import {CHART} from './rules/chart.ts';
import {SyncBusyError} from './run-lock.ts';
import {initialState} from './runner.ts';
import {handleDailyRequest} from './handler.ts';
import {AirtableClient} from './airtable.ts';
import {POSTING_FIELDS,paymentSentFields as F,expenseWorkerFields as E} from './definitions.ts';
const fake={field:(t,f)=>`{${f}}`,eq:(t,f,v)=>`{${f}}=${JSON.stringify(v)}`,includes:(t,f,v)=>`FIND(${JSON.stringify(v)},{${f}})>0`};
test('all supported chart rows are registered once, while deferred rows have no active path',()=>{
 const deferredExpenses=['EXP-12','EXP-22','EXP-24','EXP-25'];
 const expected=Object.entries(CHART).filter(([code,r])=>code.startsWith('EXP-')?!deferredExpenses.includes(code):r.status?.toLowerCase()!=='not yet').map(([code])=>code).sort();
 const active=[...new Set(CATEGORIES.filter(c=>c.status!=='deferred').map(c=>c.code))].sort();
 assert.deepEqual(active,expected);
 for(const c of CATEGORIES.filter(c=>c.status!=='deferred')){
  const formula=candidateFormula(c,fake);assert(formula);
  if(POSTING_FIELDS[c.tableId])assert(formula.includes(c.code));
 }
 assert(!initialState([],true).categoryIds.includes('PAY-14'));
 for(const code of deferredExpenses)assert(!initialState([],true).categoryIds.includes(code));
});
test('webhook may be invoked at any time and reports active work as HTTP409',async()=>{
 const env={databaseUrl:'test',airtableToken:'test',webhookSecret:'secret'};
 const req=()=>new Request('https://example.test/sync',{method:'POST',headers:{'x-ledger-secret':'secret'},body:JSON.stringify({scheduled:true,categoryCodes:['EXP-06','INV-12']})});
 const result=await handleDailyRequest(req(),env,async options=>{assert(options.state.categoryIds.includes('EXP-06'));return{done:true};});assert.equal(result.status,200);
 const busy=await handleDailyRequest(req(),env,async()=>{throw new SyncBusyError('active');});assert.equal(busy.status,409);assert.equal((await busy.json()).runKey,'active');
});
test('read-only Airtable mode blocks a mutation before contacting the API',async()=>{
 let calls=0;const client=new AirtableClient('test',Date.now()+60000,async()=>{calls++;return new Response('{}');},{readOnly:true});
 await assert.rejects(()=>client.update('table',[{id:'record',fields:{name:'changed'}}]),/Read-only/);assert.equal(calls,0);
});

test('database claim uses the global transaction lock before inserting a run and rejects another unfinished run',async()=>{
 const {DatabaseRunStore}=await import('./store.ts');
 const calls=[];let unfinished='other';
 const tx=async(strings,...values)=>{
  const query=strings.join('?');calls.push(query);
  if(query.includes('pg_try_advisory_xact_lock'))return[{acquired:true}];
  if(query.includes('select run_key'))return unfinished?[{run_key:unfinished}]:[];
  if(query.includes('returning id::text'))return[{id:'job',state:values.find(v=>v&&typeof v==='object'&&'dryRun'in v)??initialState(['PAY-07'],true)}];
  return[];
 };
 tx.json=x=>x;
 const sql={begin:fn=>fn(tx)};
 await assert.rejects(()=>new DatabaseRunStore(sql).claim('new',initialState(['PAY-07'],true)),error=>error instanceof SyncBusyError&&error.runKey==='other');
 assert(!calls.some(q=>q.includes('insert into')));
 assert(calls.findIndex(q=>q.includes('pg_try_advisory_xact_lock'))<calls.findIndex(q=>q.includes('select run_key')));
 unfinished='';calls.length=0;
 assert(await new DatabaseRunStore(sql).claim('new',initialState(['PAY-07'],true)));
 assert(calls.some(q=>q.includes('insert into')));
});

test('bank-transfer query and related filters use the same account IDs as its handler',()=>{
 const transfer=CATEGORIES.find(c=>c.code==='PAY-19');
 assert(transfer.related);assert(candidateFormula(transfer,fake).includes('PAY-19'));
 assert(transfer.related.filter(fake).includes('0747'));
 const tax=CATEGORIES.find(c=>c.code==='EXP-13');assert(tax.filter(fake).includes('923100'));assert(tax.filter(fake).includes('923300'));
 for(const oldCode of ['242.100','242.200','011.001','011.002'])assert(!tax.filter(fake).includes(oldCode));
});

test('Expense source tables match the chart instead of inheriting the old invoice entry point',()=>{
 const roots={
  [F.TABLES.invoices]:['EXP-01','EXP-03','EXP-11','EXP-15'],
  [F.TABLES.lines]:['EXP-05','EXP-06','EXP-07','EXP-09','EXP-13'],
  [F.TABLES.payments]:['EXP-02','EXP-14','EXP-16','EXP-17','EXP-18','EXP-19','EXP-20','EXP-21','EXP-23','EXP-26','EXP-27'],
 };
 for(const [table,codes]of Object.entries(roots))for(const code of codes){
  const category=CATEGORIES.find(c=>c.code===code);assert(category,code);assert.equal(category.tableId,table,code);assert.equal(category.module,'expenses',code);
 }
});

test('Expense queries retain the five W2 accounts, offshore-only scope and AP Assets prepaid filter',()=>{
 const query=code=>CATEGORIES.find(c=>c.code===code).filter(fake);
 for(const code of ['005.001','005.002','005.003','005.005','005.006'])assert(query('EXP-06').includes(code));
 assert(!query('EXP-06').includes('005.101'));
 assert(query('EXP-07').includes('005.101'));assert(!query('EXP-07').includes('005.001'));assert(!query('EXP-07').includes('005.003'));
 assert(query('EXP-03').includes('AP - Assets'));assert(query('EXP-03').includes(E.INVOICE_FIELDS.prepaid));
 const card=CATEGORIES.find(c=>c.code==='EXP-02');assert(card.related.filter(fake).includes(E.INVOICE_FIELDS.noVendorBill));assert.equal(card.status,'implemented');
});

test('line-based Expense settlements do not require nonzero Payments.Amount',()=>{
 for(const code of ['EXP-18','EXP-19','EXP-20','EXP-21','EXP-23','EXP-26']){
  const category=CATEGORIES.find(c=>c.code===code);const query=candidateFormula(category,fake);
  assert(!query.includes(`{${F.PAYMENT_FIELDS.amount}}!=0`),code);
  assert(query.includes(F.PAYMENT_FIELDS.sent),code);
 }
});

test('rolling cutoff uses source accounting dates and linked Payment Date for invoice-owned settlements',()=>{
 const {from,to}=syncDateRange();
 const query=code=>candidateFormula(CATEGORIES.find(c=>c.code===code),fake);
 assert(query('PAY-07').includes(`{fld0mYG8IMrDaNzdE}>=DATETIME_PARSE("${from}")`));
 assert(query('PAY-06').includes(`{fldsRLo5cO8fSdut8}>=DATETIME_PARSE("${from}")`));
 assert(query('PAY-26').includes(`{fldnw5Y6ATOWrhNJq}>=DATETIME_PARSE("${from}")`));
 assert(query('INV-12').includes(`{fldSungTQU5nIEIvi}>=DATETIME_PARSE("${from}")`));
 assert(query('EXP-10').includes(`{fldQ299tE4wJB4SmH}>=DATETIME_PARSE("${from}")`));
 assert(query('EXP-04').includes(`{fldXoWjXIrS76p84x}>=DATETIME_PARSE("${from}")`));
 const interest=CATEGORIES.find(c=>c.code==='PAY-25');
 assert(interest.related.filter(fake).includes(`{fld0mYG8IMrDaNzdE}>=DATETIME_PARSE("${from}")`));
 assert(!query('PAY-25').includes('fldSungTQU5nIEIvi'));
 assert(query('PAY-07').includes(`DATEADD(DATETIME_PARSE("${to}"),1,'days')`));
});

test('rolling date range covers 30 calendar days across month/year boundaries',()=>{
 assert.deepEqual(syncDateRange(Date.parse('2026-11-10T12:00:00Z')),{from:'2026-10-12',to:'2026-11-10'});
 assert.deepEqual(syncDateRange(Date.parse('2026-01-05T00:00:00Z')),{from:'2025-12-07',to:'2026-01-05'});
 const {from,to}=syncDateRange();assert(inSyncDateRange(from));assert(inSyncDateRange(to));assert(!inSyncDateRange('2000-01-01'));assert(!inSyncDateRange('9999-12-31'));
});
