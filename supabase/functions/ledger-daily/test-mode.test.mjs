import test from 'node:test';
import assert from 'node:assert/strict';
import {testLedgerSync} from './test-mode.ts';
import {handleDailyRequest} from './handler.ts';
import {paymentSentFields as F} from './definitions.ts';
const P=F.PAYMENT_FIELDS,T=F.TABLES;
const A='rec'+'A'.repeat(14),B='rec'+'B'.repeat(14),BANK='rec'+'C'.repeat(14);
function fixture(){
 let writes=0,initialized=0;
 const source=id=>({id,name:id,value(field){return field===P.sent?true:null;}});
 const client={requests:0,deadline:Date.now()+60000,
  async initialize(){initialized++;},clearRecordCache(){},
  field:(t,f)=>'{'+f+'}',eq:(t,f,v)=>'{'+f+'}='+JSON.stringify(v),includes:(t,f,v)=>'FIND('+JSON.stringify(v)+',{'+f+'})>0',
  table:id=>({name:id===T.payments?'Payments':'Chart of Accounts'}),
  async queryIds(){return{ids:[A,B],offset:null};},
  async readRecords(table,ids){return table===T.accounts?ids.map(id=>({id,text:()=> '0747'})):ids.map(source);},
  async readRecord(table,id){return source(id);},
  async update(){writes++;throw Error('Unexpected Airtable write');},
 };
 const evaluate=async(category,record)=>({paymentRecordId:record.id,eventType:'sent',entryDate:new Date().toISOString().slice(0,10),source:{tableId:T.payments,recordId:record.id},categories:[{ruleCode:category.code,entryKey:'component',transactionType:'Vendor payment',postings:[
  {debitAccount:{number:'211.100'},creditAccount:{recordId:BANK},amount:'-10.25'},
  {debitAccount:{number:'211.100'},creditAccount:{recordId:BANK},amount:'0.00'},
 ]}]});
 return{client,evaluate,get writes(){return writes;},get initialized(){return initialized;}};
}
test('test mode returns source/rule/account/amount rows, preserves signs, maps Nickel and never writes',async()=>{
 const f=fixture();const result=await testLedgerSync(f.client,{categoryCodes:['PAY-07'],maxRecords:1},f.evaluate);
 assert.equal(result.test,true);assert.equal(result.done,false);assert.equal(result.records.length,1);
 assert.deepEqual(result.records[0],{table:'Payments',tableId:T.payments,recordId:A,rule:'PAY-07',category:'Vendor payment',entryKey:'component',date:new Date().toISOString().slice(0,10),debitAccount:'211.100',creditAccount:'112.300',amount:'-10.25'});
 assert.equal(result.databaseWrites,0);assert.equal(result.airtableWrites,0);assert.equal(f.writes,0);
 assert.equal(result.stats.posted,0);assert(result.requestForResume.test);
 const resumed=await testLedgerSync(f.client,result.requestForResume,f.evaluate);
 assert.equal(resumed.done,true);assert.equal(resumed.records[0].recordId,B);assert.equal(resumed.requestForResume,null);assert.equal(f.writes,0);
});
test('test cursors cannot select a different scope, disable dry-run or inject invalid IDs',async()=>{
 const f=fixture();const first=await testLedgerSync(f.client,{categoryCodes:['PAY-07'],maxRecords:1},f.evaluate);
 for(const cursor of [{...first.requestForResume.cursor,dryRun:false},{...first.requestForResume.cursor,recordIds:['bad']},{...first.requestForResume.cursor,categoryIndex:-1}]){
  await assert.rejects(()=>testLedgerSync(f.client,{categoryCodes:['PAY-07'],maxRecords:1,cursor},f.evaluate),RangeError);
 }
 await assert.rejects(()=>testLedgerSync(f.client,{categoryCodes:['EXP-01'],maxRecords:1,cursor:first.requestForResume.cursor},f.evaluate),RangeError);
});
test('test:true takes the read-only callback even when dryRun:false and needs no database configuration',async()=>{
 const env={databaseUrl:'',airtableToken:'token',webhookSecret:'same-secret'};let previews=0,executions=0;
 const req=body=>new Request('https://example.test/sync',{method:'POST',headers:{'x-ledger-secret':'same-secret'},body:JSON.stringify(body)});
 const execute=async()=>{executions++;throw Error('Test reached writer');};
 const preview=async options=>{previews++;assert.deepEqual(options.categoryCodes,['PAY-07']);return{test:true,done:true,records:[]};};
 let response=await handleDailyRequest(req({test:true,dryRun:false,categoryCodes:['PAY-07']}),env,execute,preview);
 assert.equal(response.status,200);assert.equal((await response.json()).test,true);assert.equal(executions,0);assert.equal(previews,1);
 response=await handleDailyRequest(req({test:'true'}),env,execute,preview);assert.equal(response.status,400);
 response=await handleDailyRequest(req({test:true,categoryCodes:['PAY-07']}),env,execute);assert.equal(response.status,503);assert.equal(executions,0);
 response=await handleDailyRequest(req({test:false,dryRun:false,cursor:{}}),env,execute,preview);assert.equal(response.status,400);assert.equal(executions,0);
});
test('test mode still requires the original shared secret and reports invalid cursors as HTTP400',async()=>{
 const env={databaseUrl:'',airtableToken:'token',webhookSecret:'same-secret'};
 const request=(secret)=>new Request('https://example.test/sync',{method:'POST',headers:{'x-ledger-secret':secret},body:JSON.stringify({test:true})});
 let called=false;
 assert.equal((await handleDailyRequest(request('wrong'),env,async()=>{called=true;},async()=>{called=true;})).status,401);assert.equal(called,false);
 const response=await handleDailyRequest(request('same-secret'),env,async()=>{throw Error('Writer called');},async()=>{throw new RangeError('Invalid test cursor.');});assert.equal(response.status,400);
});

test('test output excludes older and future dates and includes the rolling window boundary',async()=>{
 const {syncDateRange}=await import('./scope.ts');
 const {from,to}=syncDateRange(), beforeDate=new Date(Date.parse(from)-86400000).toISOString().slice(0,10);
 const f=fixture();
 const before=await testLedgerSync(f.client,{categoryCodes:['PAY-07'],maxRecords:1},async(...args)=>({...await f.evaluate(...args),entryDate:beforeDate}));
 assert.equal(before.records.length,0);assert.equal(before.stats.zero,1);assert.equal(before.fromDate,from);assert.equal(before.toDate,to);
 const boundary=await testLedgerSync(f.client,before.requestForResume,async(...args)=>({...await f.evaluate(...args),entryDate:from}));
 assert.equal(boundary.records.length,1);assert.equal(boundary.records[0].date,from);assert.equal(f.writes,0);
 const future=await testLedgerSync(f.client,{categoryCodes:['PAY-07'],maxRecords:1},async(...args)=>({...await f.evaluate(...args),entryDate:'9999-12-31'}));
 assert.equal(future.records.length,0);assert.equal(future.stats.zero,1);
});


test('single-source test cursors cannot switch records or inject a second record',async()=>{
 const f=fixture(),source={tableId:T.payments,recordId:A};
 f.client.queryIds=async()=>({ids:[A],offset:null});
 const first=await testLedgerSync(f.client,{categoryCodes:['PAY-07'],source,maxRecords:1},f.evaluate);
 assert.equal(first.records.length,1);assert.equal(first.records[0].recordId,A);
 const cursor={...initialSingle(),recordIds:[B],recordIndex:0,phase:'process'};
 function initialSingle(){return{dryRun:true,source,categoryIds:['PAY-07'],categoryIndex:0,phase:'discover',offset:null,relatedIds:[],relatedIndex:0,recordIds:[],recordIndex:0,stats:{candidates:0,processed:0,matched:0,posted:0,existing:0,zero:0,errors:0},errors:[],done:false};}
 await assert.rejects(()=>testLedgerSync(f.client,{categoryCodes:['PAY-07'],source,maxRecords:1,cursor},f.evaluate),RangeError);
 await assert.rejects(()=>testLedgerSync(f.client,{categoryCodes:['PAY-07'],source:{...source,recordId:B},maxRecords:1,cursor:initialSingle()},f.evaluate),RangeError);
});

test('explicit date range permits an older sample without opening posting or writeback',async()=>{
 const f=fixture(),dateRange={from:'2025-01-01',to:'2025-12-31'};f.client.dateRange=dateRange;
 const evaluate=async(c,r)=>{const event=await f.evaluate(c,r);event.entryDate='2025-04-01';return event;};
 const result=await testLedgerSync(f.client,{categoryCodes:['PAY-07'],maxRecords:1,dateRange},evaluate);
 assert.equal(result.records.length,1);assert.equal(result.records[0].date,'2025-04-01');assert.equal(result.databaseWrites,0);assert.equal(result.airtableWrites,0);
 assert.equal(result.fromDate,dateRange.from);assert.equal(result.toDate,dateRange.to);
 assert.equal(result.requestForResume.fromDate,dateRange.from);
 const options={categoryCodes:['PAY-07'],maxRecords:1,dateRange,cursor:result.requestForResume.cursor};
 assert((await testLedgerSync(f.client,options,evaluate)).done);
 await assert.rejects(()=>testLedgerSync(f.client,{...options,dateRange:{...dateRange,to:'2026-12-31'}},evaluate),RangeError);
});
