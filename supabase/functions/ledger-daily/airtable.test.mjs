import test from 'node:test';
import assert from 'node:assert/strict';
import {AirtableClient}from './airtable.ts';
import {BudgetExceeded}from './retry.ts';
const schema={tables:[{id:'payments',primaryFieldId:'name',fields:[{id:'name',name:'Payment Name',type:'singleLineText'},{id:'type',name:'Renamed Invoice Type',type:'singleSelect'},{id:'links',name:'Accounts',type:'multipleRecordLinks',options:{linkedTableId:'accounts'}}]},{id:'accounts',primaryFieldId:'label',fields:[{id:'label',name:'GL Account',type:'singleLineText'}]}]};
const json=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
test('REST reads resolve current field names, normalize selects/links and reuse a bounded cache',async()=>{
 const calls=[];const fetcher=async(url,options)=>{calls.push({url,options});if(url.includes('/meta/'))return json(schema);if(url.includes('/accounts?'))return json({records:[{id:'bank',fields:{label:'112.100: Bank'}}]});return json({records:[{id:'pay',fields:{name:'Test payment',type:'AP',links:['bank']}}]})};
 const client=new AirtableClient('test-only',Date.now()+60000,fetcher);await client.initialize();assert.equal(client.eq('payments','type','AP'),'{Renamed Invoice Type}="AP"');
 const record=await client.readRecord('payments','pay',['type','links']);assert.equal(record.name,'Test payment');assert.deepEqual(record.value('type'),{name:'AP'});await client.readRecord('payments','pay',['type']);assert.equal(calls.length,2);
 await client.loadLinkNames([record],['links']);assert.equal(record.value('links')[0].name,'112.100: Bank');assert.equal(calls.length,3);assert(calls[1].url.includes('fields%5B%5D=name'));
});
test('single-source invalidation refreshes source flags, retains linked records and full clear still flushes both',async()=>{
 const tables=structuredClone(schema);tables.tables[0].fields.push({id:'sent',name:'Sent',type:'checkbox'});
 let sourceReads=0,accountReads=0;
 const fetcher=async url=>{
  if(url.includes('/meta/'))return json(tables);
  if(url.includes('/accounts?')){accountReads++;return json({records:[{id:'bank',fields:{label:'112.100: Bank'}}]})}
  sourceReads++;return json({records:[{id:'pay',fields:{name:'Test payment',sent:sourceReads===1,links:['bank']}}]});
 };
 const client=new AirtableClient('test-only',Date.now()+60000,fetcher);
 await client.initialize();
 const first=await client.readRecord('payments','pay',['sent','links']);await client.loadLinkNames([first],['links']);
 assert.equal(first.value('sent'),true);assert.equal(accountReads,1);
 client.clearRecordCache({tableId:'payments',recordId:'pay'});
 const refreshed=await client.readRecord('payments','pay',['sent','links']);await client.loadLinkNames([refreshed],['links']);
 assert.equal(refreshed.value('sent'),false);assert.equal(sourceReads,2);assert.equal(accountReads,1);
 assert.deepEqual(refreshed.value('links'),first.value('links'));
 client.clearRecordCache();
 const cleared=await client.readRecord('payments','pay',['sent','links']);await client.loadLinkNames([cleared],['links']);
 assert.equal(sourceReads,3);assert.equal(accountReads,2);assert.deepEqual(cleared.value('links'),refreshed.value('links'));
});
test('Airtable 429 pauses for resume when its required delay does not fit the budget',async()=>{
 const client=new AirtableClient('test-only',Date.now()+25000,async()=>new Response('{}',{status:429}));await assert.rejects(()=>client.initialize(),BudgetExceeded);assert.equal(client.requests,1);
});
test('permanent API permission errors are not retried',async()=>{
 const client=new AirtableClient('test-only',Date.now()+60000,async()=>new Response('{"error":"permission"}',{status:403}));await assert.rejects(()=>client.initialize(),/403/);assert.equal(client.requests,1);
});
test('request batch budget pauses before another network call',async()=>{
 let fetched=false;const client=new AirtableClient('test-only',Date.now()+60000,async()=>{fetched=true;return json(schema)});client.requests=80;await assert.rejects(()=>client.initialize(),BudgetExceeded);assert.equal(fetched,false);
});
