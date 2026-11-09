import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseLedgerStore} from './store.ts';
import {AirtableClient} from './airtable.ts';
import {writeBack,WritebackError} from './writeback.ts';
import {LINK_FIELDS} from '../_shared/ledger-links.ts';

const table='tblR61NG9i0giid28',id='rec'+'A'.repeat(14),fields=LINK_FIELDS[table];
const originals=[
 {rule:'PAY-07',key:'',datetime:'2026-11-09T00:00:00.000000Z',id:'journal-a',reversal_id:'reversal-a'},
 {rule:'PAY-26',key:'difference',datetime:'2026-11-09T00:00:01.000000Z',id:'journal-b',reversal_id:null},
];
function fixture({stale=false,maxRequests=80}={}){
 const calls=[];let saved;
 const tx=async(strings,...values)=>{
  const query=strings.join('?');
  if(query.includes('pg_advisory_xact_lock')){calls.push('lock');assert.equal(values[0],'FIN payment:'+id);}
  if(query.includes('select o.rule_code')){calls.push('read');assert.equal(calls[0],'lock');return originals;}
  return[];
 };
 const sql={async begin(fn){return fn(tx);}};
 const fetcher=async(url,options)=>{
  calls.push(options?.method??'GET');assert.equal(options.headers.Authorization,'Bearer test-token');
  if(options.method==='PATCH'){saved=JSON.parse(options.body).records[0].fields;return Response.json({records:[{id,fields:saved}]});}
  return Response.json({records:[{id,fields:stale?{}:saved}]});
 };
 const deadline=Date.now()+60000;
 const client=new AirtableClient('test-token',deadline,fetcher,{maxRequests});
 const ledger=new DatabaseLedgerStore(sql,'test-token',client.fetch.bind(client),deadline);
 return{client,ledger,calls,get saved(){return saved;}};
}

test('daily writeback reuses the source lock, full three-field snapshot and independent verification',async()=>{
 const f=fixture();const refs=await writeBack(f.ledger,table,id);
 assert.deepEqual(f.calls,['lock','read','PATCH','GET']);assert.equal(f.client.requests,2);
 assert.deepEqual(refs,originals.map(({reversal_id,...row})=>row));
 assert.deepEqual(JSON.parse(f.saved[fields.postings]),refs);
 assert.deepEqual(JSON.parse(f.saved[fields.ids]),['journal-a','journal-b']);
 assert.deepEqual(JSON.parse(f.saved[fields.reversalIds]),['reversal-a']);
});

test('daily writeback rejects stale readback so the runner must retry the same source',async t=>{
 t.mock.method(console,'error',()=>{});
 const f=fixture({stale:true});
 await assert.rejects(()=>writeBack(f.ledger,table,id),WritebackError);
 assert.deepEqual(f.calls,['lock','read','PATCH','GET']);
});

test('verification cannot bypass the daily network request budget',async t=>{
 t.mock.method(console,'error',()=>{});
 const f=fixture({maxRequests:1});
 await assert.rejects(()=>writeBack(f.ledger,table,id),WritebackError);
 assert.equal(f.client.requests,1);assert.deepEqual(f.calls,['lock','read','PATCH']);
});

test('the shared transport preserves test-mode write blocking',async()=>{
 let calls=0;const client=new AirtableClient('test-token',Date.now()+60000,async()=>{calls++;return Response.json({});},{readOnly:true});
 await assert.rejects(()=>client.fetch('https://api.airtable.com/v0/test',{method:'PATCH'}),/Read-only/);
 assert.equal(calls,0);assert.equal(client.requests,0);
});


test('posting reserves verification requests and time before creating any journal',()=>{
 const short=new AirtableClient('test-token',Date.now()+30000,async()=>Response.json({}));
 assert.throws(()=>short.requireWritebackBudget(),/Reserve time/);
 const limited=new AirtableClient('test-token',Date.now()+60000,async()=>Response.json({}),{maxRequests:3});
 assert.throws(()=>limited.requireWritebackBudget(),/Reserve time/);
 const ready=new AirtableClient('test-token',Date.now()+60000,async()=>Response.json({}),{maxRequests:4});
 assert.doesNotThrow(()=>ready.requireWritebackBudget());
});
