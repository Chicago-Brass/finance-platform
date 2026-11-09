import assert from 'node:assert/strict';
import test from 'node:test';
import { runLedgerSync, initialState } from './runner.ts';
import { candidateFormula, CATEGORIES } from './queries.ts';
import { POSTING_FIELDS, paymentSentFields } from './definitions.ts';
import { BudgetExceeded, RetryableError, retry } from './retry.ts';
import { LINK_FIELDS } from '../_shared/ledger-links.ts';
import { handleDailyRequest } from './handler.ts';
const P=paymentSentFields.TABLES.payments,F=POSTING_FIELDS[P],PF=paymentSentFields.PAYMENT_FIELDS;

function setup({records=['a'],offsetPage=false,writeFailures=0,postFailures=0}={}) {
 const jobs=new Map(), metadata=new Map(),calls={updates:[],posts:0,queries:[],prepared:[]};
 const record=id=>({id,name:id,value(field){return field===PF.sent?true:null;}});
 const client={requests:0,async initialize(){},clearRecordCache(){},requireWritebackBudget(){},async queryIds(table,formula,offset){calls.queries.push({offset,updates:calls.updates.length});return offsetPage&&!offset?{ids:records.slice(0,1),offset:'next'}:{ids:offsetPage?records.slice(1):records,offset:null}},async readRecords(t,ids){return ids.map(record)},async readRecord(t,id){return record(id)},field(t,f){return'{'+f+'}'},eq(t,f,v){return this.field(t,f)+'='+JSON.stringify(v)},includes(t,f,v){return'FIND('+JSON.stringify(v)+','+this.field(t,f)+')>0'},async update(t,rows){if(writeFailures-->0)throw Error('Permission/writeback failed');calls.updates.push(...rows)}};
 const runs={async claim(key,initial){let job=jobs.get(key);if(!job){job={id:key,state:structuredClone(initial),leaseToken:'lease'};jobs.set(key,job)}return job},async save(){},async release(){}};
 const ledger={async prepareSources(t,ids){calls.prepared.push(ids)},async hasReversals(){return false},async findCategory(t,id,rule){return(metadata.get(id)||[]).filter(r=>r.rule===rule)},async syncLinks(t,id){const refs=metadata.get(id)||[];await client.update(t,[{id,fields:{[F.postings]:JSON.stringify(refs),[F.ids]:JSON.stringify(refs.map(r=>r.id)),[LINK_FIELDS[t].reversalIds]:'[]'}}]);return refs},async post(event){calls.posts++;if(postFailures-->0)throw new RetryableError('Connection lost');const rows=event.categories.map((c,i)=>({rule:c.ruleCode,key:c.entryKey||'',datetime:'2026-11-01T00:00:00Z',id:'journal-'+event.source.recordId+'-'+i}));metadata.set(event.source.recordId,rows);try{await this.syncLinks(event.source.tableId,event.source.recordId)}catch(error){metadata.delete(event.source.recordId);throw error}return{postedCount:rows.length,duplicateCount:0}}};
 const evaluate=async(category,source)=>({paymentRecordId:source.id,eventType:'sent',source:{tableId:P,recordId:source.id},entryDate:new Date().toISOString().slice(0,10),categories:[{ruleCode:category.code,transactionType:'Test',postings:[{amount:'10.00',debitAccount:{number:'211.100'},creditAccount:{number:'112.100'}}]}]});
 const deps={client,runs,ledger,evaluate,deadline:Date.now()+120000,log(){}};return{deps,calls,jobs,metadata};
}

test('registry covers all 27 payment categories; query excludes exact rule and reversed sources',()=>{
 assert.equal(new Set(CATEGORIES.filter(c=>c.code.startsWith("PAY-")).map(c=>c.code)).size,27);assert.equal(CATEGORIES.filter(c=>c.status==='deferred').length,1);
 const {deps}=setup();const formula=candidateFormula(CATEGORIES.find(c=>c.code==='PAY-07'),deps.client);
 assert(formula.includes('"\\"PAY-07\\""'));assert(formula.includes(F.reverse));assert(formula.includes(PF.sent));
 const invoiceRule=CATEGORIES.find(c=>c.id==='PAY-04:underpaid');assert.equal(invoiceRule.tableId,'tbldQXuqNEp8G5pfs');assert(candidateFormula(invoiceRule,deps.client).includes('fld2K7xKmNnLoi4u6'));
});

test('discovers every page before writing markers, and posts distinct sources once',async()=>{
 const t=setup({records:['a','b'],offsetPage:true});const result=await runLedgerSync('test',initialState(['PAY-07'],false),t.deps,25);
 assert.equal(t.calls.posts,2);assert.deepEqual(t.calls.queries.map(q=>q.updates),[0,0]);assert.equal(result.done,true);assert.equal(t.calls.updates.length,2);
 for(const update of t.calls.updates){const refs=JSON.parse(update.fields[F.postings]);assert.deepEqual(Object.keys(refs[0]),['rule','key','datetime','id']);assert.deepEqual(JSON.parse(update.fields[F.ids]),refs.map(r=>r.id));}
});

test('one rolled-back source does not stop the other 99; a later run can retry it',async()=>{
 const records=Array.from({length:100},(_,i)=>String(i+1));
 const t=setup({records});const post=t.deps.ledger.post;let failed=false;
 t.deps.ledger.post=async function(event){if(event.source.recordId==='10'&&!failed){failed=true;throw Error('Airtable did not save links. New journals were rolled back.')}return post.call(this,event)};
 let result;
 do {result=await runLedgerSync('batch',initialState(['PAY-07'],false),t.deps,25)}while(!result.done);
 assert.equal(result.stats.errors,1);assert.equal(result.stats.posted,99);assert.equal(result.stats.processed,100);
 assert.equal(result.errors[0].recordId,'10');assert(!t.metadata.has('10'));assert(t.metadata.has('90'));
 result=await runLedgerSync('tomorrow',initialState(['PAY-07'],false),t.deps,100);
 assert.equal(result.stats.errors,0);assert.equal(result.stats.posted,1);assert.equal(t.metadata.size,100);
});

test('failed writeback rolls back that source without counting it as posted',async()=>{
 const t=setup({records:['bad','good'],writeFailures:1});
 const result=await runLedgerSync('rollback',initialState(['PAY-07'],false),t.deps);
 assert.equal(result.done,true);assert.equal(result.stats.posted,1);assert.equal(result.stats.errors,1);
 assert(!t.metadata.has('bad'));assert(t.metadata.has('good'));
});

test('exhausted database retries report that source and continue',async()=>{
 const t=setup({records:['bad','good'],postFailures:3});
 const result=await runLedgerSync('database-error',initialState(['PAY-07'],false),t.deps);
 assert.equal(result.stats.errors,1);assert.equal(result.stats.posted,1);assert.equal(t.calls.posts,4);assert(t.metadata.has('good'));
});

test('unconfirmed writeback is reported while later sources still finish',async()=>{
 const t=setup({records:['unknown','good']});const post=t.deps.ledger.post;
 t.deps.ledger.post=async function(event){if(event.source.recordId==='unknown')throw Error('Ledger writeback or rollback could not be confirmed. Check this source before retrying.');return post.call(this,event)};
 const result=await runLedgerSync('unknown',initialState(['PAY-07'],false),t.deps);
 assert.equal(result.done,true);assert.equal(result.stats.errors,1);assert.equal(result.stats.posted,1);
 assert.equal(result.errors[0].recordId,'unknown');assert.match(result.errors[0].message,/could not be confirmed/);
 assert(t.metadata.has('good'));
});

test('dry run calculates but never posts or patches Airtable, and maxRecords resumes',async()=>{
 const t=setup({records:['a','b']});let result=await runLedgerSync('preview',initialState(['PAY-07'],true),t.deps,1);
 assert.equal(result.done,false);assert.equal(result.preview.length,1);assert.equal(t.calls.posts,0);assert.equal(t.calls.updates.length,0);
 result=await runLedgerSync('preview',initialState(['PAY-07'],true),t.deps,5);assert.equal(result.done,true);assert.equal(result.stats.processed,2);
});

test('a failed category does not block other sources and does not acquire a posted marker',async()=>{
 const t=setup({records:['bad','good']});const evaluate=t.deps.evaluate;t.deps.evaluate=(category,source)=>{if(source.id==='bad')throw Error('Not yet implemented: missing split');return evaluate(category,source)};
 const result=await runLedgerSync('blocked',initialState(['PAY-07'],false),t.deps);assert.equal(result.stats.errors,1);assert.equal(t.calls.posts,1);assert.equal(t.calls.updates[0].id,'good');
});

test('historically reversed source is not posted; future restore remains deferred',async()=>{
 const t=setup();t.deps.ledger.hasReversals=async()=>true;const result=await runLedgerSync('reversed',initialState(['PAY-07'],false),t.deps);assert.equal(result.stats.errors,1);assert.equal(t.calls.posts,0);
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
 assert.equal((await handleDailyRequest(req({categoryCodes:['PAY-07']}),env,execute)).status,200);assert.equal(called,1);
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
 const state=initialState([],true);assert(!state.categoryIds.includes('PAY-14'));assert(initialState(['PAY-14'],true).categoryIds.includes('PAY-14'));
});

test('finishing exactly at the source limit does not require an empty resume call',async()=>{
 const t=setup();const result=await runLedgerSync('exact-limit',initialState(['PAY-07'],true),t.deps,1);assert.equal(result.done,true);assert.equal(result.resume,null);
});


test('writeback budget pauses before posting and does not double count the match on resume',async()=>{
 const t=setup();let checks=0;
 t.deps.client.requireWritebackBudget=()=>{if(checks++===0)throw new BudgetExceeded('Reserve verification budget')};
 let result=await runLedgerSync('budget',initialState(['PAY-07'],false),t.deps);
 assert.equal(result.done,false);assert.equal(result.paused,true);assert.equal(t.calls.posts,0);assert.equal(result.stats.matched,0);
 result=await runLedgerSync('budget',initialState(['PAY-07'],false),t.deps);
 assert.equal(result.done,true);assert.equal(result.stats.matched,1);assert.equal(result.stats.posted,1);
});
