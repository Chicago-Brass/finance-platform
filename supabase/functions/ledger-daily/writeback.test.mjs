import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseLedgerStore} from './store.ts';
import {AirtableClient} from './airtable.ts';
import {writeBack,WritebackError} from './writeback.ts';
import {CATEGORIES,candidateFormula} from './queries.ts';
import {LINK_FIELDS,serializeLedgerReferences} from '../_shared/ledger-links.ts';

const table='tblR61NG9i0giid28',id='rec'+'A'.repeat(14),fields=LINK_FIELDS[table];
const originals=[
 {rule:'PAY-07',key:'',datetime:'2026-11-09T00:00:00.000000Z',id:'journal-a',reversal_id:'reversal-a',reversal_date:'2026-11-10'},
 {rule:'PAY-26',key:'difference',datetime:'2026-11-09T00:00:01.000000Z',id:'journal-b',reversal_id:null},
];
function fixture({stale=false,maxRequests=80,currentReference}={}){
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
  return Response.json({records:[{id,fields:stale?{}:saved??currentReference??{}}]});
 };
 const deadline=Date.now()+60000;
 const client=new AirtableClient('test-token',deadline,fetcher,{maxRequests});
 const ledger=new DatabaseLedgerStore(sql,'test-token',client.fetch.bind(client),deadline);
 return{client,ledger,calls,get saved(){return saved;}};
}

test('daily writeback reuses the source lock, unified reference snapshot and independent verification',async()=>{
 const f=fixture();const refs=await writeBack(f.ledger,table,id);
 assert.deepEqual(f.calls,['lock','read','GET','PATCH','GET']);assert.equal(f.client.requests,3);
 assert.deepEqual(refs,originals.map(({reversal_id,reversal_date,...row})=>row));
 assert.deepEqual(Object.keys(f.saved),[fields.reference]);
 assert.deepEqual(JSON.parse(f.saved[fields.reference]),JSON.parse(serializeLedgerReferences(originals)));
});

test('daily writeback rejects stale readback so the runner must retry the same source',async t=>{
 t.mock.method(console,'error',()=>{});
 const f=fixture({stale:true});
 await assert.rejects(()=>writeBack(f.ledger,table,id),WritebackError);
 assert.deepEqual(f.calls,['lock','read','GET','PATCH','GET']);
});

test('verification cannot bypass the daily network request budget',async t=>{
 t.mock.method(console,'error',()=>{});
 const f=fixture({maxRequests:1});
 await assert.rejects(()=>writeBack(f.ledger,table,id),WritebackError);
 assert.equal(f.client.requests,1);assert.deepEqual(f.calls,['lock','read','GET']);
});

test('the shared transport preserves test-mode write blocking',async()=>{
 let calls=0;const client=new AirtableClient('test-token',Date.now()+60000,async()=>{calls++;return Response.json({});},{readOnly:true});
 await assert.rejects(()=>client.fetch('https://api.airtable.com/v0/test',{method:'PATCH'}),/Read-only/);
 assert.equal(calls,0);assert.equal(client.requests,0);
});


test('posting reserves verification requests and time before creating any journal',()=>{
 const short=new AirtableClient('test-token',Date.now()+30000,async()=>Response.json({}));
 assert.throws(()=>short.requireWritebackBudget(),/Reserve time/);
 const limited=new AirtableClient('test-token',Date.now()+60000,async()=>Response.json({}),{maxRequests:11});
 assert.throws(()=>limited.requireWritebackBudget(),/Reserve time/);
 const ready=new AirtableClient('test-token',Date.now()+60000,async()=>Response.json({}),{maxRequests:12});
 assert.doesNotThrow(()=>ready.requireWritebackBudget());
});

test('unified references keep one exact environment/rule token after reversal',()=>{
 const parsed=JSON.parse(serializeLedgerReferences(originals));
 assert.deepEqual(parsed.postedKeys,['main:PAY-07','main:PAY-26']);
 assert.deepEqual(parsed.entries.map(({environment,kind,id,reverses})=>[environment,kind,id,reverses]),[
  ['main','journal','journal-a',undefined],['main','reversal','reversal-a','journal-a'],
  ['main','journal','journal-b',undefined],
 ]);
});

test('configured sources use only the unified field and preserve other environment entries', async () => {
 const {reference}=fields;
 const other={id:'staging-journal',rule:'PAY-09',key:'',date:'2026-10-10',environment:'staging',kind:'journal'};
 const replaced={...other,id:'retired-main',environment:'main'};
 const f=fixture({currentReference:{[reference]:JSON.stringify({version:1,entries:[other,replaced]})}});
 await writeBack(f.ledger,table,id);
 assert.deepEqual(f.calls,['lock','read','GET','PATCH','GET']);
 assert.deepEqual(Object.keys(f.saved),[reference]);
 const payload=JSON.parse(f.saved[reference]);
 assert.deepEqual(payload.postedKeys,['main:PAY-07','main:PAY-26','staging:PAY-09']);
 assert.deepEqual(payload.entries[0],other);
 assert(!payload.entries.some(entry=>entry.id==='retired-main'));
 const query={field:(_table,field)=>'{'+field+'}',eq:(_table,field,value)=>'{'+field+'}='+JSON.stringify(value)};
 const rule=CATEGORIES.find(row=>row.id==='PAY-09');
 const formula=candidateFormula(rule,query);
 assert(formula.includes(reference)&&formula.includes('main:PAY-09'));
 assert(!candidateFormula(rule,query,undefined,id).includes(reference));
});
