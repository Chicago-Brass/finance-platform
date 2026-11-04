const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, mocks) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,file),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(name=>name in mocks ? mocks[name] : require(name),module,module.exports);
  return module.exports;
}

test('Report reads share one Auth check per request, read fresh data and stop when signed out', async () => {
  let actor='one', request=0, reads=0, authChecks=0, denied=false;
  const session=load('report-session.ts',{
    react:{cache:fn=>{const requests=new Map();return ()=>{if(!requests.has(request)) requests.set(request,fn());return requests.get(request);};}},
    '@/lib/supabase/server':{createClient:async()=>({actor,auth:{getUser:async()=>{authChecks++;return {data:{user:denied?null:{id:actor}},error:null};}}})},
  });
  const read=async client=>{reads++;return client.actor;};
  assert.deepEqual(await Promise.all([session.ledgerRead(read),session.ledgerRead(read),session.reportUser()]),['one','one',{id:'one'}]);
  assert.equal(authChecks,1);
  assert.equal(reads,2);
  actor='two';request++;
  assert.equal(await session.ledgerRead(read),'two');
  assert.equal(reads,3,'A new request reads the ledger again instead of reusing a cached result');
  denied=true;request++;
  await assert.rejects(()=>session.ledgerRead(read),/Sign in/);
  await assert.rejects(()=>session.reportUser(),/Sign in/);
  assert.equal(reads,3);
});

test('Ledger requests 100 rows plus one lookahead with stable line ordering', async () => {
  const calls=[];
  let count=101;
  const query={};
  for(const name of ['select','gte','lte','order','range']) query[name]=(...args)=>{calls.push([name,...args]);return query;};
  query.then=(resolve)=>resolve({data:Array.from({length:count},(_,index)=>({line_id:`line-${index}`})),error:null});
  const ledger=load('ledger.ts',{
    '@/lib/supabase/server':{},
    './report-session':{ledgerRead:async fn=>fn({from:()=>query})},
  });
  const page=await ledger.getGeneralLedger('2026-01-01','2026-07-31',2);
  assert.equal(page.rows.length,100);
  assert.equal(page.hasNext,true);
  assert.equal(page.page,2);
  assert.deepEqual(calls.find(call=>call[0]==='range'),['range',100,200]);
  assert.deepEqual(calls.filter(call=>call[0]==='order').map(call=>call[1]),['date','entry_number','line_no']);
  count=100;calls.length=0;
  const last=await ledger.getGeneralLedger('2026-01-01','2026-07-31',-5);
  assert.equal(last.page,1);
  assert.equal(last.hasNext,false);
  assert.deepEqual(calls.find(call=>call[0]==='range'),['range',0,100]);
});

test('Ledger account filters narrow the database query', async () => {
  const calls=[];
  const query={};
  for(const name of ['select','gte','lte','eq','order','range']) query[name]=(...args)=>{calls.push([name,...args]);return query;};
  query.then=(resolve)=>resolve({data:[],error:null});
  const ledger=load('ledger.ts',{
    '@/lib/supabase/server':{},
    './report-session':{ledgerRead:async fn=>fn({from:()=>query})},
  });
  await ledger.getGeneralLedger('2026-01-01','2026-07-31',1,{account:'112.300',offset:'211.100'});
  assert.deepEqual(calls.filter(call=>call[0]==='eq'),[['eq','account_number','112.300'],['eq','offsetting_account_number','211.100']]);
  calls.length=0;
  await ledger.getGeneralLedger('2026-01-01','2026-07-31',1,{offset:'211.100'});
  assert.deepEqual(calls.filter(call=>call[0]==='eq'),[['eq','offsetting_account_number','211.100']]);
});
