import assert from 'node:assert/strict';
import test from 'node:test';
import { runLedgerSync, initialState } from './runner.ts';
import { candidateFormula, CATEGORIES } from './queries.ts';
import { POSTING_FIELDS, paymentSentFields, expenseWorkerFields } from './definitions.ts';
import { BudgetExceeded, RetryableError, retry } from './retry.ts';
import { serializeLedgerReferences } from '../_shared/ledger-links.ts';
import { handleDailyRequest } from './handler.ts';
const P=paymentSentFields.TABLES.payments,F=POSTING_FIELDS[P],PF=paymentSentFields.PAYMENT_FIELDS;

function setup({records=['a'],offsetPage=false,writeFailures=0,postFailures=0}={}) {
 const jobs=new Map(), metadata=new Map(),calls={updates:[],posts:0,queries:[],prepared:[]};
 const record=id=>({id,name:id,value(field){return field===PF.sent?true:null;}});
 const client={requests:0,async initialize(){},async loadLinkNames(){},clearRecordCache(){},requireWritebackBudget(){},async queryIds(table,formula,offset){calls.queries.push({table,formula,offset,updates:calls.updates.length});return offsetPage&&!offset?{ids:records.slice(0,1),offset:'next'}:{ids:offsetPage?records.slice(1):records,offset:null}},async readRecords(t,ids){return ids.map(record)},async readRecord(t,id){return record(id)},field(t,f){return'{'+f+'}'},eq(t,f,v){return this.field(t,f)+'='+JSON.stringify(v)},includes(t,f,v){return'FIND('+JSON.stringify(v)+','+this.field(t,f)+')>0'},async update(t,rows){if(writeFailures-->0)throw Error('Permission/writeback failed');calls.updates.push(...rows)}};
 const runs={async claim(key,initial){let job=jobs.get(key);if(!job){job={id:key,state:structuredClone(initial),leaseToken:'lease'};jobs.set(key,job)}return job},async save(){},async release(){}};
 const ledger={async prepareSources(t,ids){calls.prepared.push(ids)},async hasReversals(){return false},async findCategory(t,id,rule){return(metadata.get(id)||[]).filter(r=>r.rule===rule)},async syncLinks(t,id){const refs=metadata.get(id)||[];await client.update(t,[{id,fields:{[F.reference]:serializeLedgerReferences(refs)}}]);return refs},async post(event){calls.posts++;if(postFailures-->0)throw new RetryableError('Connection lost');const rows=event.categories.map((c,i)=>({rule:c.ruleCode,key:c.entryKey||'',datetime:'2026-11-01T00:00:00Z',id:'journal-'+event.source.recordId+'-'+i}));metadata.set(event.source.recordId,rows);try{await this.syncLinks(event.source.tableId,event.source.recordId)}catch(error){metadata.delete(event.source.recordId);throw error}return{postedCount:rows.length,duplicateCount:0}}};
 const evaluate=async(category,source)=>({paymentRecordId:source.id,eventType:'sent',source:{tableId:P,recordId:source.id},entryDate:new Date().toISOString().slice(0,10),categories:[{ruleCode:category.code,transactionType:'Test',postings:[{amount:'10.00',debitAccount:{number:'211.100'},creditAccount:{number:'112.100'}}]}]});
 const deps={client,runs,ledger,evaluate,deadline:Date.now()+120000,log(){}};return{deps,calls,jobs,metadata};
}

test('registry covers 19 retained payment categories; query excludes exact rule and reversed sources',()=>{
 assert.equal(new Set(CATEGORIES.filter(c=>c.code.startsWith("PAY-")).map(c=>c.code)).size,19);assert.equal(CATEGORIES.filter(c=>c.status==='deferred').length,5);
 const {deps}=setup();const formula=candidateFormula(CATEGORIES.find(c=>c.code==='PAY-09'),deps.client);
 assert(formula.includes(JSON.stringify('"main:PAY-09"')));assert(formula.includes(F.reverse));assert(formula.includes(PF.sent));
 const invoiceRule=CATEGORIES.find(c=>c.id==='PAY-28');assert.equal(invoiceRule.tableId,'tbldQXuqNEp8G5pfs');assert(candidateFormula(invoiceRule,deps.client).includes('fldtVpTc9y7AtQNx0'));
});

test('loan repayment discovery requires a nonempty linked loan',()=>{
 const {deps}=setup();
 const rule=CATEGORIES.find(c=>c.code==='PAY-16');
 assert.match(rule.related.filter(deps.client), /LEN\(\{fldSLnSA4FTOm6spx\}&""\)>0/);
});

test('a credit-only receipt does not replay a nonexistent AR leg',async()=>{
 const id='rec00000000009931',t=setup({records:[id]});
 t.metadata.set(id,[{rule:'PAY-03',key:'',datetime:'2026-11-01T00:00:00Z',id:'credit-journal'}]);
 t.deps.evaluate=async()=>{throw Error('The receipt should not be re-evaluated');};
 const result=await runLedgerSync('credit-only-replay',initialState(['INV-16'],false,{tableId:P,recordId:id}),t.deps);
 assert.equal(result.stats.zero,1);
 assert.equal(result.stats.errors,0);
 assert.equal(t.calls.posts,0);
 assert.equal(t.calls.updates.length,1);
});

test('discovers every page before writing markers, and posts distinct sources once',async()=>{
 const t=setup({records:['a','b'],offsetPage:true});const result=await runLedgerSync('test',initialState(['PAY-09'],false),t.deps,25);
 assert.equal(t.calls.posts,2);assert.deepEqual(t.calls.queries.map(q=>q.updates),[0,0]);assert.equal(result.done,true);assert.equal(t.calls.updates.length,2);
 for(const update of t.calls.updates){const refs=JSON.parse(update.fields[F.reference]);assert.equal(refs.version,1);assert(refs.entries.every(row=>row.kind==='journal'&&row.environment==='main'));}
});

test('operating expense preloads distinct linked accounts once for the source batch',async()=>{
 const t=setup({records:['a','b','c']}),reads=[];
 const source=id=>({id,name:id,value:f=>f===expenseWorkerFields.INVOICE_FIELDS.accounts?[{id:id==='c'?'account-2':'account-1'}]:null});
 t.deps.client.readRecords=async(table,ids,fields,requireAll=true)=>{reads.push({table,ids,fields,requireAll});return ids.map(source);};
 t.deps.client.readRecord=async(_table,id)=>source(id);
 const result=await runLedgerSync('operating-bulk',initialState(['EXP-01'],true),t.deps);
 assert.equal(result.stats.matched,3);assert.equal(result.stats.errors,0);
 const accountReads=reads.filter(r=>r.table===expenseWorkerFields.TABLES.accounts);
 assert.equal(accountReads.length,1);assert.deepEqual(accountReads[0].ids,['account-1','account-2']);
 assert.deepEqual(accountReads[0].fields,Object.values(expenseWorkerFields.ACCOUNT_FIELDS));
 assert.equal(accountReads[0].requireAll,false);
});

test('missing prefetched account fails only its invoice while the rest of the batch continues',async()=>{
 const t=setup({records:['bad','good']}),A=expenseWorkerFields.TABLES.accounts,I=expenseWorkerFields.INVOICE_FIELDS.accounts;
 const source=id=>({id,name:id,value:f=>f===I?[{id:id==='bad'?'missing-account':'valid-account'}]:null});
 t.deps.client.readRecords=async(table,ids,_fields,requireAll=true)=>{
  if(table===A&&ids.includes('missing-account')){
   if(requireAll)throw Error('Missing linked records');
   return ids.filter(id=>id!=='missing-account').map(source);
  }
  return ids.map(source);
 };
 t.deps.client.readRecord=async(_table,id)=>source(id);
 const evaluate=t.deps.evaluate;
 t.deps.evaluate=async(category,record)=>{
  await t.deps.client.readRecords(A,record.value(I).map(link=>link.id),Object.values(expenseWorkerFields.ACCOUNT_FIELDS));
  return evaluate(category,record);
 };
 const result=await runLedgerSync('operating-missing-account',initialState(['EXP-01'],true),t.deps);
 assert.equal(result.stats.errors,1);assert.equal(result.errors[0].recordId,'bad');
 assert.equal(result.stats.matched,1);assert.equal(result.preview[0].recordId,'good');assert.equal(result.done,true);
});

test('operating payments batch linked invoices and both sides account references',async()=>{
 const t=setup({records:['pay-a','pay-b']}),E=expenseWorkerFields,reads=[];
 t.deps.client.queryRecords=async()=>({records:[{value:()=>[{id:'pay-a'},{id:'pay-b'}]}],offset:null});
 const payment=id=>({id,name:id,value:f=>f===E.PAYMENT_FIELDS.sent?true:f===E.PAYMENT_FIELDS.invoices?[{id:'inv-'+id}]:f===E.PAYMENT_FIELDS.accounts?[{id:'bank'}]:null});
 const invoice=id=>({id,name:id,value:f=>f===E.INVOICE_FIELDS.accounts?[{id:'expense-account'}]:null});
 t.deps.client.readRecords=async(table,ids,fields,requireAll=true)=>{
  reads.push({table,ids,fields,requireAll});return ids.map(table===E.TABLES.invoices?invoice:payment);
 };
 t.deps.client.readRecord=async(_table,id)=>payment(id);
 const result=await runLedgerSync('operating-paid-batch',initialState(['EXP-14'],true),t.deps);
 assert.equal(result.stats.matched,2);assert.equal(result.stats.errors,0);
 const parents=reads.filter(r=>r.table===E.TABLES.invoices),accounts=reads.filter(r=>r.table===E.TABLES.accounts);
 assert.equal(parents.length,1);assert.deepEqual(parents[0].ids,['inv-pay-a','inv-pay-b']);assert.equal(parents[0].requireAll,false);
 assert.deepEqual(parents[0].fields,Object.values(E.INVOICE_FIELDS));
 assert.equal(accounts.length,1);assert.deepEqual(accounts[0].ids,['expense-account','bank']);assert.equal(accounts[0].requireAll,false);
});

test('a missing linked invoice fails only its operating payment',async()=>{
 const t=setup({records:['bad','good']}),E=expenseWorkerFields;
 t.deps.client.queryRecords=async()=>({records:[{value:()=>[{id:'bad'},{id:'good'}]}],offset:null});
 const payment=id=>({id,name:id,value:f=>f===E.PAYMENT_FIELDS.sent?true:f===E.PAYMENT_FIELDS.invoices?[{id:id==='bad'?'missing':'present'}]:null});
 t.deps.client.readRecords=async(table,ids,_fields,requireAll=true)=>{
  if(table===E.TABLES.invoices&&ids.includes('missing')){
   if(requireAll)throw Error('Missing linked invoice');return ids.filter(id=>id!=='missing').map(payment);
  }
  return ids.map(payment);
 };
 t.deps.client.readRecord=async(_table,id)=>payment(id);
 const evaluate=t.deps.evaluate;
 t.deps.evaluate=async(category,source)=>{
  await t.deps.client.readRecords(E.TABLES.invoices,source.value(E.PAYMENT_FIELDS.invoices).map(link=>link.id),Object.values(E.INVOICE_FIELDS));
  return evaluate(category,source);
 };
 const result=await runLedgerSync('operating-missing-invoice',initialState(['EXP-14'],true),t.deps);
 assert.equal(result.stats.errors,1);assert.equal(result.errors[0].recordId,'bad');assert.equal(result.stats.matched,1);assert.equal(result.preview[0].recordId,'good');
});

test('disabled explicit category stays empty instead of falling back to all categories',async()=>{
 const t=setup();t.deps.enabledRuleCodes=new Set();
 const state=initialState(['PAY-09'],false),ids=[...state.categoryIds];
 const result=await runLedgerSync('disabled',state,t.deps);
 assert.equal(result.done,true);assert.equal(t.calls.posts,0);assert.equal(t.calls.queries.length,0);
 assert.deepEqual(t.jobs.get('disabled').state.categoryIds,ids);assert.deepEqual(result.disabledCategories,['PAY-09']);
});

test('targeted retry verifies a cached posting and restores links without reposting',async()=>{
 const id='rec00000000009931',t=setup({records:[id]});
 const marker=`FIND(${JSON.stringify('"main:PAY-09"')},{${F.reference}}&"")=0`;
 t.metadata.set(id,[{rule:'PAY-09',key:'',datetime:'2026-11-01T00:00:00Z',id:'existing-journal'}]);
 t.deps.client.queryIds=async(_table,formula)=>({ids:formula.includes(marker)?[]:[id],offset:null});
 const ordinary=await runLedgerSync('cached-full',initialState(['PAY-09'],false),t.deps);
 assert.equal(ordinary.stats.processed,0);
 const targeted=await runLedgerSync('cached-targeted',initialState(['PAY-09'],false,{tableId:P,recordId:id}),t.deps);
 assert.equal(targeted.stats.existing,1);assert.equal(targeted.stats.posted,0);assert.equal(targeted.stats.errors,0);
 assert.equal(t.calls.posts,0);assert.equal(t.calls.updates.length,1);
 assert.deepEqual(JSON.parse(t.calls.updates[0].fields[F.reference]).entries.map(row=>row.id),['existing-journal']);
 const category=CATEGORIES.find(c=>c.code==='PAY-09'),formula=candidateFormula(category,t.deps.client,undefined,id);
 assert(formula.includes(`RECORD_ID()=${JSON.stringify(id)}`));assert(!formula.includes(marker));
 assert(formula.includes(F.reverse));assert(formula.includes(F.reverseDate));assert(formula.includes(PF.sent));
});

test('daily discovery skips disabled rules and processes enabled rules in the same scope',async()=>{
 const t=setup();t.deps.enabledRuleCodes=new Set(['PAY-12']);
 const result=await runLedgerSync('enabled-subset',initialState(['PAY-09','PAY-12'],true),t.deps);
 assert.equal(result.done,true);assert.equal(t.calls.queries.length,1);
 assert.deepEqual(result.preview.map(item=>item.category),['PAY-12']);assert.deepEqual(result.disabledCategories,['PAY-09']);
});

test('a disabled rule discards its resumed candidate snapshot without changing run identity',async()=>{
 const t=setup({records:['a','b']});t.deps.enabledRuleCodes=new Set(['PAY-09']);
 let result=await runLedgerSync('disable-on-resume',initialState(['PAY-09'],false),t.deps,1);
 assert.equal(result.done,false);assert.equal(t.calls.posts,1);
 const ids=[...t.jobs.get('disable-on-resume').state.categoryIds],queries=t.calls.queries.length;
 t.deps.enabledRuleCodes=new Set();
 result=await runLedgerSync('disable-on-resume',initialState(['PAY-09'],false),t.deps,25);
 assert.equal(result.done,true);assert.equal(t.calls.posts,1);assert.equal(t.calls.queries.length,queries);
 assert.deepEqual(t.jobs.get('disable-on-resume').state.categoryIds,ids);assert.equal(result.stats.processed,1);
});

test('one rolled-back source does not stop the other 99; a later run can retry it',async()=>{
 const records=Array.from({length:100},(_,i)=>String(i+1));
 const t=setup({records});const post=t.deps.ledger.post;let failed=false;
 t.deps.ledger.post=async function(event){if(event.source.recordId==='10'&&!failed){failed=true;throw Error('Airtable did not save links. New journals were rolled back.')}return post.call(this,event)};
 let result;
 do {result=await runLedgerSync('batch',initialState(['PAY-09'],false),t.deps,25)}while(!result.done);
 assert.equal(result.stats.errors,1);assert.equal(result.stats.posted,99);assert.equal(result.stats.processed,100);
 assert.equal(result.errors[0].recordId,'10');assert(!t.metadata.has('10'));assert(t.metadata.has('90'));
 result=await runLedgerSync('tomorrow',initialState(['PAY-09'],false),t.deps,100);
 assert.equal(result.stats.errors,0);assert.equal(result.stats.posted,1);assert.equal(t.metadata.size,100);
});

test('failed writeback rolls back that source without counting it as posted',async()=>{
 const t=setup({records:['bad','good'],writeFailures:1});
 const result=await runLedgerSync('rollback',initialState(['PAY-09'],false),t.deps);
 assert.equal(result.done,true);assert.equal(result.stats.posted,1);assert.equal(result.stats.errors,1);
 assert(!t.metadata.has('bad'));assert(t.metadata.has('good'));
});

test('exhausted database retries report that source and continue',async()=>{
 const t=setup({records:['bad','good'],postFailures:3});
 const result=await runLedgerSync('database-error',initialState(['PAY-09'],false),t.deps);
 assert.equal(result.stats.errors,1);assert.equal(result.stats.posted,1);assert.equal(t.calls.posts,4);assert(t.metadata.has('good'));
});

test('unconfirmed writeback is reported while later sources still finish',async()=>{
 const t=setup({records:['unknown','good']});const post=t.deps.ledger.post;
 t.deps.ledger.post=async function(event){if(event.source.recordId==='unknown')throw Error('Ledger writeback or rollback could not be confirmed. Check this source before retrying.');return post.call(this,event)};
 const result=await runLedgerSync('unknown',initialState(['PAY-09'],false),t.deps);
 assert.equal(result.done,true);assert.equal(result.stats.errors,1);assert.equal(result.stats.posted,1);
 assert.equal(result.errors[0].recordId,'unknown');assert.match(result.errors[0].message,/could not be confirmed/);
 assert(t.metadata.has('good'));
});

test('dry run calculates but never posts or patches Airtable, and maxRecords resumes',async()=>{
 const t=setup({records:['a','b']});let result=await runLedgerSync('preview',initialState(['PAY-09'],true),t.deps,1);
 assert.equal(result.done,false);assert.equal(result.preview.length,1);assert.equal(t.calls.posts,0);assert.equal(t.calls.updates.length,0);
 result=await runLedgerSync('preview',initialState(['PAY-09'],true),t.deps,5);assert.equal(result.done,true);assert.equal(result.stats.processed,2);
});

test('a failed category does not block other sources and does not acquire a posted marker',async()=>{
 const t=setup({records:['bad','good']});const evaluate=t.deps.evaluate;t.deps.evaluate=(category,source)=>{if(source.id==='bad')throw Error('Not yet implemented: missing split');return evaluate(category,source)};
 const result=await runLedgerSync('blocked',initialState(['PAY-09'],false),t.deps);assert.equal(result.stats.errors,1);assert.equal(t.calls.posts,1);assert.equal(t.calls.updates[0].id,'good');
});

test('historically reversed source is not posted; future restore remains deferred',async()=>{
 const t=setup();t.deps.ledger.hasReversals=async()=>true;const result=await runLedgerSync('reversed',initialState(['PAY-09'],false),t.deps);assert.equal(result.stats.errors,1);assert.equal(t.calls.posts,0);
});

test('simple retry backs off transient errors only',async()=>{
 const waits=[];let calls=0;const result=await retry(async()=>{if(++calls<3)throw new RetryableError('temporary');return'ok'},{wait:async ms=>waits.push(ms)});assert.equal(result,'ok');assert.deepEqual(waits,[500,1000]);
 calls=0;await assert.rejects(()=>retry(async()=>{calls++;throw Error('invalid account')},{wait:async()=>{}}));assert.equal(calls,1);
});

test('HTTP authorizes before execution, defaults to dry-run and validates categories',async()=>{
 const env={databaseUrl:'test',webhookSecret:'secret',airtableToken:'test'};let called=0;
 const execute=async options=>{called++;assert.equal(options.state.dryRun,true);return{done:true}};
 const req=(body,secret='secret')=>new Request('https://example.test/ledger-daily',{method:'POST',headers:{'x-ledger-secret':secret,'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await handleDailyRequest(req({},'wrong'),env,execute)).status,401);assert.equal(called,0);
 assert.equal((await handleDailyRequest(req({categoryCodes:['PAY-99']}),env,execute)).status,400);
 assert.equal((await handleDailyRequest(req({categoryCodes:['PAY-09']}),env,execute)).status,200);assert.equal(called,1);
});

test('related invoice query narrows the payment IDs before category processing',async()=>{
 const t=setup({records:['a']});const owner=CATEGORIES.find(c=>c.code==='PAY-20');let relatedCalls=0;
 t.deps.client.queryRecords=async(table,formula,fields)=>{relatedCalls++;assert.equal(table,'tbldQXuqNEp8G5pfs');assert(formula.includes('316.100'));return{records:[{value(){return[{id:'a'}]}}],offset:null}};
 const query=t.deps.client.queryIds;t.deps.client.queryIds=async(table,formula,offset)=>{assert(formula.includes('RECORD_ID()="a"'));return query(table,formula,offset)};
 const result=await runLedgerSync('related',initialState([owner.code],false),t.deps);assert.equal(result.done,true);assert.equal(relatedCalls,1);assert.equal(t.calls.posts,1);
});

test('empty related query avoids reading every AP expense payment',async()=>{
 const t=setup();t.deps.client.queryRecords=async()=>({records:[],offset:null});const result=await runLedgerSync('empty',initialState(['PAY-20'],false),t.deps);assert.equal(result.done,true);assert.equal(t.calls.queries.length,0);assert.equal(t.calls.posts,0);
});

test('default runs list deferred payroll without turning it into a permanent daily error',()=>{
 const state=initialState([],true);assert(!state.categoryIds.includes('EXP-22'));assert(initialState(['EXP-22'],true).categoryIds.includes('EXP-22'));
});

test('finishing exactly at the source limit does not require an empty resume call',async()=>{
 const t=setup();const result=await runLedgerSync('exact-limit',initialState(['PAY-09'],true),t.deps,1);assert.equal(result.done,true);assert.equal(result.resume,null);
});


test('writeback budget pauses before posting and does not double count the match on resume',async()=>{
 const t=setup();let checks=0;
 t.deps.client.requireWritebackBudget=()=>{if(checks++===0)throw new BudgetExceeded('Reserve verification budget')};
 let result=await runLedgerSync('budget',initialState(['PAY-09'],false),t.deps);
 assert.equal(result.done,false);assert.equal(result.paused,true);assert.equal(t.calls.posts,0);assert.equal(result.stats.matched,0);
 result=await runLedgerSync('budget',initialState(['PAY-09'],false),t.deps);
 assert.equal(result.done,true);assert.equal(result.stats.matched,1);assert.equal(result.stats.posted,1);
});


test('single-record sync queries only its source and bypasses whole-table linked discovery',async()=>{
 const id='rec'+'S'.repeat(14),t=setup({records:[id]});
 t.deps.client.queryRecords=async()=>{throw Error('A single source must not scan related tables');};
 const source={tableId:P,recordId:id},state=initialState(['INV-13'],true,source);
 const result=await runLedgerSync('one-source',state,t.deps,25);
 assert.equal(result.done,true);assert.equal(result.stats.matched,1);assert.equal(t.calls.posts,0);
 assert.equal(t.calls.queries.length,1);assert.equal(t.calls.queries[0].table,P);
 assert(t.calls.queries[0].formula.includes('RECORD_ID()='+JSON.stringify(id)));
 assert.deepEqual(state.source,source);
 assert(initialState([],true,source).categoryIds.every(id=>CATEGORIES.find(c=>c.id===id).tableId===P));
});

test('single-record categories retain their linked cache but refresh owning flags before each evaluation',async()=>{
 const id='rec'+'S'.repeat(14),source={tableId:P,recordId:id},t=setup({records:[id]}),invalidations=[];
 const evaluate=t.deps.evaluate;let sourceReads=0,current;
 t.deps.client.clearRecordCache=value=>invalidations.push(value);
 t.deps.client.readRecords=async()=>{
  const sent=++sourceReads===1;
  current={id,name:id,value:field=>field===PF.sent?sent:null};return[current];
 };
 t.deps.client.readRecord=async()=>current;
 const result=await runLedgerSync('source-flags',initialState(['INV-13','INV-16'],true,source),t.deps);
 assert.equal(result.done,true);assert.equal(sourceReads,2);assert.equal(result.stats.matched,1);
 assert(invalidations.length>=2);for(const invalidated of invalidations)assert.deepEqual(invalidated,source);
 const expected=await evaluate(CATEGORIES.find(c=>c.code==='INV-13'),{id});
 assert.deepEqual(result.preview[0].entries,expected.categories);
});

test('webhook validates and preserves single-source scope on execution, preview and resume',async()=>{
 const source={tableId:P,recordId:'rec'+'S'.repeat(14)},env={databaseUrl:'db',airtableToken:'token',webhookSecret:'secret'};
 const request=body=>new Request('https://example.test/sync',{method:'POST',headers:{'x-ledger-secret':'secret'},body:JSON.stringify(body)});
 let calls=0;
 const execute=async options=>{calls++;assert.deepEqual(options.state.source,source);return{done:false};};
 const preview=async options=>{calls++;assert.deepEqual(options.source,source);return{done:true};};
 let response=await handleDailyRequest(request({source}),env,execute,preview);assert.equal(response.status,200);assert.deepEqual((await response.json()).requestForResume.source,source);
 response=await handleDailyRequest(request({source,test:true}),env,execute,preview);assert.equal(response.status,200);assert.equal(calls,2);
 for(const bad of [{tableId:'unknown',recordId:source.recordId},{tableId:P,recordId:'bad'},null,[source]]){response=await handleDailyRequest(request({source:bad}),env,execute,preview);assert.equal(response.status,400);}
 assert.equal(calls,2);
});

test('date overrides validate calendar dates and survive execution and resume',async()=>{
 const env={databaseUrl:'db',airtableToken:'token',webhookSecret:'secret'},range={from:'2025-01-01',to:'2025-12-31'};
 const request=body=>new Request('https://example.test/sync',{method:'POST',headers:{'x-ledger-secret':'secret'},body:JSON.stringify(body)});
 const response=await handleDailyRequest(request({fromDate:range.from,toDate:range.to}),env,async options=>{assert.deepEqual(options.state.dateRange,range);return{done:false};});
 const body=await response.json();assert.equal(body.requestForResume.fromDate,range.from);assert.equal(body.requestForResume.toDate,range.to);
 for(const bad of [{fromDate:'2025-02-30'},{fromDate:'bad'},{fromDate:'2026-02-01',toDate:'2026-01-01'},{fromDate:5}])assert.equal((await handleDailyRequest(request(bad),env,async()=>{throw Error('Invalid dates reached runner');})).status,400);
 const {deps}=setup();deps.client.dateRange=range;
 assert(candidateFormula(CATEGORIES.find(c=>c.code==='INV-12'),deps.client).includes('DATETIME_PARSE("2025-01-01")'));
});

test('creation cutoff restricts every owning source query without changing manual API defaults',async()=>{
 const cutoff='2026-11-17T06:00:00.000Z',t=setup();
 for(const category of CATEGORIES){
  const normal=candidateFormula(category,t.deps.client),guarded=candidateFormula(category,t.deps.client,cutoff);
  assert(!normal.includes('CREATED_TIME()'));
  assert(guarded.includes('CREATED_TIME()>=DATETIME_PARSE("2026-11-17T06:00:00.000Z")'));
 }
 const state=initialState(['PAY-09'],true,undefined,undefined,cutoff);
 await runLedgerSync('guarded',state,t.deps,1);
 assert(t.calls.queries.every(q=>q.formula.includes(cutoff)));
 assert.equal(t.jobs.get('guarded').state.createdFrom,cutoff);
 const env={databaseUrl:'db',airtableToken:'pat',webhookSecret:'secret'};
 const request=body=>new Request('https://example.test',{method:'POST',headers:{'x-ledger-secret':'secret'},body:JSON.stringify(body)});
 let captured;
 const exec=async options=>{captured=options;return {done:false}};
 let response=await handleDailyRequest(request({createdFrom:cutoff,categoryCodes:['PAY-09']}),env,exec);
 assert.equal(response.status,200);assert.equal(captured.state.createdFrom,cutoff);assert.equal((await response.json()).requestForResume.createdFrom,cutoff);
 response=await handleDailyRequest(request({fromDate:'2025-01-01',toDate:'2025-12-31',categoryCodes:['PAY-09']}),env,exec);
 assert.equal(response.status,200);assert.equal(captured.state.createdFrom,undefined);assert.equal(captured.state.dateRange.from,'2025-01-01');
 for(const createdFrom of ['2026-11-01','2026-02-30T00:00:00Z',false,'invalid'])assert.equal((await handleDailyRequest(request({createdFrom}),env,exec)).status,400);
});

test('fresh creation-bounded categories discover owners without scanning related tables',async()=>{
 const cutoff='2026-11-17T06:00:00.000Z';
 for(const category of CATEGORIES.filter(c=>c.status==='implemented'&&c.related)){
  const t=setup({records:['eligible','not-linked']}),evaluate=t.deps.evaluate;
  t.deps.client.queryRecords=async()=>{throw Error('Bounded discovery must not scan related history');};
  t.deps.evaluate=async(c,source)=>source.id==='eligible'?evaluate(c,source):null;
  const result=await runLedgerSync('bounded-'+category.code,initialState([category.code],true,undefined,undefined,cutoff),t.deps);
  assert.equal(result.done,true,category.code);assert.equal(result.stats.errors,0,category.code);
  assert.equal(t.calls.queries.length,1,category.code);assert.equal(t.calls.queries[0].table,category.tableId,category.code);
  assert(t.calls.queries[0].formula.includes('CREATED_TIME()>=DATETIME_PARSE("'+cutoff+'")'),category.code);
  assert.equal(result.stats.matched,1,category.code);assert.equal(result.stats.zero,1,category.code);assert.equal(t.calls.posts,0);
 }
});

test('bounded owner-first and manual related-first payment discovery post the same eligible event',async()=>{
 const executions=[];
 for(const cutoff of [undefined,'2026-11-17T06:00:00.000Z']){
  const t=setup({records:['a','b']}),evaluate=t.deps.evaluate,query=t.deps.client.queryIds,post=t.deps.ledger.post,events=[];let relatedCalls=0;
  t.deps.client.queryRecords=async()=>{relatedCalls++;return{records:[{value(){return[{id:'a'}]}}],offset:null};};
  t.deps.client.queryIds=async(table,formula,offset)=>{const page=await query(table,formula,offset);return{...page,ids:formula.includes('RECORD_ID()="a"')?['a']:page.ids};};
  t.deps.evaluate=async(c,source)=>source.id==='a'?evaluate(c,source):null;
  t.deps.ledger.post=async event=>{events.push(structuredClone(event));return post.call(t.deps.ledger,event);};
  const result=await runLedgerSync(cutoff?'bounded':'manual',initialState(['EXP-16'],false,undefined,undefined,cutoff),t.deps);
  assert.equal(result.stats.errors,0);assert.equal(t.calls.posts,1);assert.equal(relatedCalls,cutoff?0:1);
  executions.push(events);
 }
 assert.deepEqual(executions[0],executions[1]);
});

test('empty bounded owner query never scans historical parents',async()=>{
 const t=setup({records:[]});t.deps.client.queryRecords=async()=>{throw Error('Unexpected historical query');};
 const result=await runLedgerSync('bounded-empty',initialState(['EXP-16'],false,undefined,undefined,'2026-11-17T06:00:00.000Z'),t.deps);
 assert.equal(result.done,true);assert.equal(result.stats.errors,0);assert.equal(t.calls.queries.length,1);assert.equal(t.calls.posts,0);assert.equal(t.calls.prepared.length,0);
});

test('bounded owner pagination checkpoints the owner offset before any posting',async()=>{
 const t=setup({records:['a','b'],offsetPage:true}),query=t.deps.client.queryIds,cutoff='2026-11-17T06:00:00.000Z';let interrupted=false;
 t.deps.client.queryRecords=async()=>{throw Error('Unexpected historical query');};
 t.deps.client.queryIds=async(...args)=>{if(args[2]==='next'&&!interrupted){interrupted=true;throw new BudgetExceeded('Pause owner pagination');}return query(...args);};
 let result=await runLedgerSync('bounded-pages',initialState(['EXP-16'],false,undefined,undefined,cutoff),t.deps,1);
 assert.equal(result.paused,true);assert.equal(t.calls.posts,0);assert.equal(t.jobs.get('bounded-pages').state.phase,'discover');assert.equal(t.jobs.get('bounded-pages').state.offset,'next');
 result=await runLedgerSync('bounded-pages',initialState(['EXP-16'],false,undefined,undefined,cutoff),t.deps,1);
 assert.equal(result.done,false);assert.equal(t.calls.posts,1);assert.deepEqual(t.calls.queries.map(q=>q.offset),[null,'next']);assert(t.calls.queries.every(q=>q.table===P&&q.updates===0));
 result=await runLedgerSync('bounded-pages',initialState(['EXP-16'],false,undefined,undefined,cutoff),t.deps,1);
 assert.equal(result.done,true);assert.equal(result.stats.errors,0);assert.equal(t.calls.posts,2);assert.equal(t.calls.queries.length,2);
});

test('existing creation-bounded related snapshots keep their table offsets and IDs on resume',async()=>{
 for(const phase of ['related','discover']){
  const t=setup(),state=initialState(['EXP-16'],false,undefined,undefined,'2026-11-17T06:00:00.000Z'),query=t.deps.client.queryIds;let relatedCalls=0;
  state.phase=phase;state.offset=phase==='related'?'parent-next':null;state.relatedIds=phase==='discover'?['a']:[];
  t.deps.client.queryRecords=async(table,formula,fields,offset)=>{relatedCalls++;assert.equal(table,'tbldQXuqNEp8G5pfs');assert.equal(offset,'parent-next');return{records:[{value(){return[{id:'a'}]}}],offset:null};};
  t.deps.client.queryIds=async(table,formula,offset)=>{assert(formula.includes('RECORD_ID()="a"'));return query(table,formula,offset);};
  const result=await runLedgerSync('old-snapshot-'+phase,state,t.deps);
  assert.equal(result.done,true);assert.equal(result.stats.errors,0);assert.equal(t.calls.posts,1);assert.equal(relatedCalls,phase==='related'?1:0);
 }
});

test('sync telemetry queues one final source/category outcome after posting and records safe failures',async()=>{
 const t=setup({records:['bad','good']}),evaluate=t.deps.evaluate;
 t.deps.evaluate=(category,source)=>{if(source.id==='bad')throw Error('Database password=private-token@example.test');return evaluate(category,source);};
 const result=await runLedgerSync('attempts',initialState(['PAY-09'],false),t.deps);
 assert.equal(result.stats.posted,1);const attempts=t.jobs.get('attempts').attempts;assert.equal(attempts.length,2);assert.deepEqual(attempts.map(a=>[a.sourceRecordId,a.outcome]),[['bad','failed'],['good','succeeded']]);
 assert(attempts.every(a=>a.ruleCode==='PAY-09'&&a.sourceTable===P&&Number.isFinite(Date.parse(a.occurredAt))));
 assert(!attempts[0].error.includes('private-token'));assert.equal(attempts[1].error,null);
});
test('no-write runs, skipped sources and budget resumptions never create attempt telemetry',async()=>{
 const dry=setup();await runLedgerSync('dry-attempts',initialState(['PAY-09'],true),dry.deps);assert.equal(dry.jobs.get('dry-attempts').attempts,undefined);
 const zero=setup();zero.deps.evaluate=async()=>null;await runLedgerSync('zero-attempts',initialState(['PAY-09'],false),zero.deps);assert.equal(zero.jobs.get('zero-attempts').attempts,undefined);
 const budget=setup();budget.deps.client.requireWritebackBudget=()=>{throw new BudgetExceeded('Wait for next invocation');};await runLedgerSync('budget-attempts',initialState(['PAY-09'],false),budget.deps);assert.equal(budget.jobs.get('budget-attempts').attempts,undefined);
});
test('period review outcomes remain pending rather than successful posting attempts',async()=>{
 const t=setup();t.deps.ledger.post=async()=>({status:'pending_review',requestId:'review',postedCount:0,duplicateCount:0});
 const result=await runLedgerSync('review-attempts',initialState(['PAY-09'],false),t.deps);
 assert.equal(result.stats.posted,0);assert.equal(t.jobs.get('review-attempts').attempts[0].outcome,'pending');
});

test('daily sync skips empty groups and keeps exact filters for nonempty or rejected groups', async () => {
 const clock = new Date().toISOString().slice(0,10);
 const range = {from:clock,to:clock};
 for (const outcome of ["empty","match","rejected"]) {
  const empty = outcome === "empty";
  const t = setup(), originalQuery = t.deps.client.queryIds, groupQueries = [];
  t.deps.client.queryIds = async (table, formula, offset, maxRecords) => {
   if (maxRecords !== 1) return originalQuery.call(t.deps.client,table,formula,offset);
   groupQueries.push(formula);
   if (outcome === 'rejected') throw Error('Airtable GET failed (422): invalid formula');
   return {ids:empty?[]:['a'],offset:null};
  };
  const result = await runLedgerSync('daily-group',initialState(['EXP-02','EXP-14'],false,undefined,range,clock+'T00:00:00.000Z'),t.deps);
  assert.equal(groupQueries.length,1);
  assert.match(groupQueries[0], /CREATED_TIME/);
  for (const code of ['EXP-02','EXP-14']) assert(groupQueries[0].includes(JSON.stringify('"main:'+code+'"')));
  assert.equal(result.skippedDiscovery,empty?2:0);
  assert.equal(t.calls.queries.length,empty?0:2);
  assert.equal(t.calls.posts,empty?0:2);
  assert.equal(result.stats.errors,0);
  assert.equal(result.done,true);
 }
});

test('isolated history checks branch journals and ignores FIN posting markers without rewriting them', async () => {
 const t = setup();
 t.deps.client.ignorePostingMarkers = true;
 t.metadata.set('a',[{rule:'EXP-14',id:'staging-journal'}]);
 const target = {tableId:P,recordId:'rec'+'I'.repeat(14)};
 const result = await runLedgerSync('isolated-history',initialState(['EXP-14'],false,target),t.deps);
 assert.equal(result.stats.existing,1);
 assert.equal(result.stats.posted,0);
 assert.equal(result.stats.errors,0);
 assert.equal(t.calls.updates.length,0);
 const formula=candidateFormula(CATEGORIES.find(c=>c.code==='EXP-14'),t.deps.client);
 assert(!formula.includes(F.reference));
 assert(formula.includes(F.reverse));
 assert(formula.includes(F.reverseDate));
 assert(formula.includes(PF.sent));
});

test('scheduled discovery uses accounting dates on payment owners regardless of creation time', async () => {
 const t=setup();
 t.deps.client.queryRecords=async()=>{throw Error('Daily payment discovery must use its owner date');};
 const day=new Date().toISOString().slice(0,10);
 const result=await runLedgerSync('scheduled:'+day,initialState(['EXP-14'],true,undefined,{from:day,to:day}),t.deps);
 assert.equal(result.stats.matched,1);
 assert.match(t.calls.queries[0].formula,/DATETIME_PARSE/);
 assert(!t.calls.queries[0].formula.includes('CREATED_TIME'));
});

test('repost requests require an enabled gate, exactly one source and rule, and a stable retry ID', async () => {
 const env={databaseUrl:'db',airtableToken:'token',webhookSecret:'secret',repostEnabled:true};
 const source={tableId:'tbldQXuqNEp8G5pfs',recordId:'rec'+'R'.repeat(14)};
 const cycle='c9dc02b5-ce56-4b33-9607-30642f6bc290';
 const request=body=>new Request('https://example.test',{method:'POST',headers:{'x-ledger-secret':'secret'},body:JSON.stringify(body)});
 const body={source,categoryCodes:['EXP-01'],dryRun:false,repostId:cycle,runKey:cycle};
 const execute=async ({state})=>{assert.equal(state.repostId,cycle);assert.deepEqual(state.source,source);return {done:false};};
 assert.equal((await handleDailyRequest(request(body),{...env,repostEnabled:false},execute)).status,409);
 assert.equal((await handleDailyRequest(request({...body,runKey:'different'}),env,execute)).status,400);
 assert.equal((await handleDailyRequest(request({...body,source:undefined}),env,execute)).status,400);
 assert.equal((await handleDailyRequest(request({...body,categoryCodes:['EXP-14']}),env,execute)).status,400);
 const response=await handleDailyRequest(request(body),env,execute);
 assert.equal(response.status,200);
 assert.equal((await response.json()).requestForResume.repostId,cycle);
});

test('the Airtable queue accepts only invoices and loans and never invokes the posting worker', async () => {
 const env={databaseUrl:'db',airtableToken:'token',webhookSecret:'secret',repostEnabled:true};
 const makeRequest=body=>new Request('https://example.test/ledger-daily',{
  method:'POST',headers:{'x-ledger-secret':'secret'},body:JSON.stringify(body),
 });
 const recordId='rec00000000000001';
 const execute=async()=>assert.fail('Queue should never post');
 const enqueue=async source=>[{id:source.recordId,ruleCode:'EXP-01',repostOn:'2026-11-20'}];
 const body=tableId=>({enqueueRepost:true,source:{tableId,recordId}});
 for(const table of ['tbldQXuqNEp8G5pfs','tblzYDob4qF6Kha8u']){
  const res=await handleDailyRequest(makeRequest(body(table)),env,execute,undefined,undefined,enqueue);
  assert.equal(res.status,202);
  assert.equal((await res.json()).repostOn,'2026-11-20');
 }
 assert.equal((await handleDailyRequest(makeRequest(body('tblR61NG9i0giid28')),env,execute,undefined,undefined,enqueue)).status,400);
 const invoice=makeRequest(body('tbldQXuqNEp8G5pfs'));
 assert.equal((await handleDailyRequest(invoice,env,execute,undefined,undefined,async()=>[])).status,409);
});

test('receipt discovery merges paginated candidates in date and record ID order', async()=>{
 const t=setup(), records=['recZ0000000000000','recB0000000000000','recA0000000000000'];
 t.deps.client.queryRecords=async()=>({records:[],offset:null});
 t.deps.client.queryIds=async(_table,_formula,offset,_limit,_sort,dateField)=>{
  assert.equal(dateField,PF.date);
  return offset ? {ids:records.slice(1),dates:{[records[1]]:'2026-11-01',[records[2]]:'2026-11-01'},offset:null} :
   {ids:[records[0]],dates:{[records[0]]:'2026-11-02'},offset:'next'};
 };
 const result=await runLedgerSync('scheduled:receipt-order-test',initialState(['INV-16'],false,undefined,{from:'2026-11-01',to:'2026-11-30'}),t.deps);
 assert.equal(result.stats.errors,0);
 assert.deepEqual(t.calls.prepared.flat(),[records[2],records[1],records[0]]);
});
