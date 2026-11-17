import assert from 'node:assert/strict';
import test from 'node:test';
import {syncLedgerLinks,LINK_FIELDS,LedgerWritebackError} from './ledger-links.ts';
import {BudgetExceeded} from '../ledger-daily/retry.ts';

const source={tableId:'tblR61NG9i0giid28',recordId:'rec00000000000001',recordName:'private record label'},fields=LINK_FIELDS[source.tableId];
function fixture(t,{status=503,failures=1,lostAfterSave=false,stale=false,getStatus,getFailures=Infinity,invalidRead=false,databaseCode}={}){
 const calls=[],delays=[],logs=[],deleted=[];let saved={},now=1000000,patches=0,gets=0;
 const original={rule:'PAY-08',key:'',id:'original',datetime:'2026-11-17T19:00:00.000000Z',reversal_id:'reversal'};
 t.mock.method(console,'error',(...args)=>logs.push(args));
 t.mock.method(Date,'now',()=>now);
 t.mock.method(globalThis,'setTimeout',(resolve,delay)=>{delays.push(delay);now+=delay;queueMicrotask(resolve);return 0;});
 const tx=async(strings,...values)=>{
  if(databaseCode)throw Object.assign(Error('private database connection'),{code:databaseCode});
  const query=strings.join('?');
  if(query.includes('select o.rule_code'))return [original];
  if(query.includes('delete from public.journal_entries')){deleted.push(...values[0]);return values[0].map(id=>({id}));}
  return [];
 };
 const sql={begin:async fn=>fn(tx)};
 const fetcher=async(_url,options)=>{
  const method=options.method??'GET';calls.push({method,at:now-1000000});
  if(method==='PATCH'){
   const fail=++patches<=failures;
   if(!fail||lostAfterSave)saved=JSON.parse(options.body).records[0].fields;
   if(fail){if(status==='budget')throw new BudgetExceeded('private budget detail');if(status===null)throw Error('private transport detail');if(status==='timeout'){const error=Error('private timeout detail');error.name='TimeoutError';throw error;}return new Response('private response body',{status});}
   return Response.json({});
  }
  if(++gets<=getFailures&&getStatus){if(getStatus==='budget')throw new BudgetExceeded('private budget detail');return new Response('private GET body',{status:getStatus});}
  return Response.json({records:invalidRead?'invalid':[{id:source.recordId,fields:stale?{}:saved}]});
 };
 return {calls,delays,logs,deleted,run:(duration=90000,newIds=[])=>syncLedgerLinks(sql,source,'private-token',fetcher,Date.now()+duration,newIds),get saved(){return saved;}};
}
const methods=f=>f.calls.map(call=>call.method);

for(const status of [503,429,null,'timeout'])test('transient PATCH is verified before retry: '+status,async t=>{
 const f=fixture(t,{status});
 const result=await f.run();
 assert.deepEqual(methods(f),['PATCH','GET','PATCH','GET']);
 assert.deepEqual(f.delays,[status===429?30000:500]);
 assert.equal(f.calls[1].at,status===429?30000:0,'429 cools down before any verification GET');
 assert.deepEqual(result.reversalJournalEntryIds,['reversal']);
 assert.deepEqual(JSON.parse(f.saved[fields.reversalIds]),['reversal']);
 assert.equal(f.logs[0][1].status,typeof status==='number'?status:null);assert.equal(f.logs[0][1].operation,'PATCH');
 assert(!JSON.stringify(f.logs).includes('private'));
});

for(const newIds of [[],['original']])test('three PATCH attempts recover two transient failures, new journals='+newIds.length,async t=>{
 const f=fixture(t,{failures:2});
 await f.run(90000,newIds);
 assert.deepEqual(methods(f),['PATCH','GET','PATCH','GET','PATCH','GET']);
 assert.deepEqual(f.delays,[500,1000]);assert.deepEqual(f.deleted,[]);
});

test('lost successful PATCH response is verified without another PATCH',async t=>{
 const f=fixture(t,{status:null,lostAfterSave:true});
 assert.deepEqual((await f.run()).reversalJournalEntryIds,['reversal']);
 assert.deepEqual(methods(f),['PATCH','GET']);assert.deepEqual(f.delays,[]);
});

test('three failed metadata PATCH attempts return exact safe diagnostics',async t=>{
 const f=fixture(t,{failures:Infinity});
 await assert.rejects(()=>f.run(),error=>{
  assert(error instanceof LedgerWritebackError);assert.equal(error.outcome,'unconfirmed');
  assert.deepEqual(error.details,{operation:'PATCH',status:503,attempt:3,reason:'http'});
  assert(error.message.includes('status=503'));assert(!error.message.includes('private'));return true;
 });
 assert.deepEqual(methods(f),['PATCH','GET','PATCH','GET','PATCH','GET']);assert.deepEqual(f.delays,[500,1000]);
});

test('repeated 429 waits before each GET and stops within its 90-second budget',async t=>{
 const f=fixture(t,{status:429,failures:Infinity});
 await assert.rejects(()=>f.run(),error=>error.outcome==='unconfirmed'&&error.details.status===429&&error.details.attempt===2);
 assert.deepEqual(f.calls,[{method:'PATCH',at:0},{method:'GET',at:30000},{method:'PATCH',at:30000},{method:'GET',at:60000}]);
 assert.deepEqual(f.delays,[30000,30000]);
});

for(const status of [403,422])test('permanent PATCH rejection does not retry: '+status,async t=>{
 const f=fixture(t,{status});
 await assert.rejects(()=>f.run(),error=>error.details.operation==='PATCH'&&error.details.status===status&&error.details.attempt===1);
 assert.deepEqual(methods(f),['PATCH','GET']);assert.deepEqual(f.delays,[]);
});

test('insufficient rate-limit cooldown budget makes no immediate GET or unsafe rollback',async t=>{
 const f=fixture(t,{status:429});
 await assert.rejects(()=>f.run(45000,['original']),error=>error.outcome==='unconfirmed'&&error.details.status===429&&error.details.reason==='budget');
 assert.deepEqual(methods(f),['PATCH']);assert.deepEqual(f.deleted,[]);assert.deepEqual(f.delays,[]);
});

test('persistent verification failure retains journals and identifies GET status/attempt',async t=>{
 const f=fixture(t,{failures:0,getStatus:503});
 await assert.rejects(()=>f.run(90000,['original']),error=>error.outcome==='unconfirmed'&&error.details.operation==='GET'&&error.details.status===503&&error.details.attempt===3);
 assert.deepEqual(methods(f),['PATCH','GET','GET','GET']);assert.deepEqual(f.deleted,[]);
});

test('GET rate limiting waits between reads without repeating the saved PATCH',async t=>{
 const f=fixture(t,{failures:0,getStatus:429,getFailures:2});
 await f.run();
 assert.deepEqual(methods(f),['PATCH','GET','GET','GET']);assert.deepEqual(f.delays,[30000,30000]);
 assert.deepEqual(f.calls.map(c=>c.at),[0,0,30000,60000]);
});

test('new-posting failure rolls back only after the final verified failed attempt',async t=>{
 const f=fixture(t,{failures:Infinity});
 await assert.rejects(()=>f.run(90000,['original']),error=>error.outcome==='rolled_back'&&error.details.status===503&&error.details.attempt===3);
 assert.deepEqual(methods(f),['PATCH','GET','PATCH','GET','PATCH','GET']);assert.deepEqual(f.deleted,['original']);
});

test('acknowledged PATCH with stale readback does not retry an unexplained mismatch',async t=>{
 const f=fixture(t,{failures:0,stale:true});
 await assert.rejects(()=>f.run(),error=>error.details.operation==='GET'&&error.details.reason==='mismatch');
 assert.deepEqual(methods(f),['PATCH','GET']);assert.deepEqual(f.delays,[]);
});

test('invalid verification response remains unconfirmed without another write',async t=>{
 const f=fixture(t,{failures:0,invalidRead:true});
 await assert.rejects(()=>f.run(90000,['original']),error=>error.outcome==='unconfirmed'&&error.details.reason==='invalid_response');
 assert.deepEqual(methods(f),['PATCH','GET']);assert.deepEqual(f.deleted,[]);
});

test('metadata SQL failures retain a safe database code without pretending Airtable failed',async t=>{
 const f=fixture(t,{databaseCode:'57014'});
 await assert.rejects(()=>f.run(),error=>{
  assert.deepEqual(error.details,{operation:'DATABASE',status:null,attempt:1,reason:'database',databaseCode:'57014'});
  assert(error.message.includes('databaseCode=57014'));return true;
 });
 assert.deepEqual(f.calls,[]);assert(!JSON.stringify(f.logs).includes('private'));
});

for(const operation of ['PATCH','GET'])test('local '+operation+' budget exhaustion is not retried as a network error',async t=>{
 const f=fixture(t,operation==='PATCH'?{status:'budget'}:{failures:0,getStatus:'budget'});
 await assert.rejects(()=>f.run(90000,['original']),error=>error.outcome==='unconfirmed'&&error.details.operation===operation&&error.details.attempt===1&&error.details.reason==='budget');
 assert.deepEqual(methods(f),operation==='PATCH'?['PATCH']:['PATCH','GET']);
 assert.deepEqual(f.delays,[]);assert.deepEqual(f.deleted,[]);assert(!JSON.stringify(f.logs).includes('private'));
});
