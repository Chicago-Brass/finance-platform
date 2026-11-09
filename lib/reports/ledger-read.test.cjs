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

test('Ledger filter choices read only account metadata, with no balance RPC or active-flag filtering', async () => {
  const calls = [], query = {};
  for (const name of ['select', 'order']) query[name] = (...args) => { calls.push([name, ...args]); return query; };
  query.then = resolve => resolve({ data: [{ account_number: '112.100', account_name: 'Operating bank', account_type: 'asset' }], error: null });
  const ledger = load('ledger.ts', { './report-session': { ledgerRead: fn => fn({ from: table => { calls.push(['from', table]); return query; } }) } });
  assert.equal((await ledger.getLedgerAccounts())[0].account_number, '112.100');
  assert.deepEqual(calls, [['from', 'accounts'], ['select', 'account_number:code,account_name:name,account_type'], ['order', 'code']]);
});

test('Report reads share one verified-claims check per request, read fresh data and stop when signed out', async () => {
  let actor='one', request=0, reads=0, authChecks=0, denied=false, badSignature=false;
  const session=load('report-session.ts',{
    react:{cache:fn=>{const requests=new Map();return ()=>{if(!requests.has(request)) requests.set(request,fn());return requests.get(request);};}},
    '@/lib/supabase/server':{createClient:async()=>({actor,auth:{getClaims:async()=>{authChecks++;return {data:denied?null:{claims:{sub:actor}},error:badSignature?new Error('Invalid signature'):null};}}})},
  });
  const read=async client=>{reads++;return client.actor;};
  assert.deepEqual(await Promise.all([session.ledgerRead(read),session.ledgerRead(read),session.reportUser()]),['one','one',{id:'one',email:undefined}]);
  assert.equal(authChecks,1);
  assert.equal(reads,2);
  actor='two';request++;
  assert.equal(await session.ledgerRead(read),'two');
  assert.equal(reads,3,'A new request reads the ledger again instead of reusing a cached result');
  denied=true;request++;
  await assert.rejects(()=>session.ledgerRead(read),/Sign in/);
  await assert.rejects(()=>session.reportUser(),/Sign in/);
  assert.equal(reads,3);
  denied=false; badSignature=true; request++;
  await assert.rejects(()=>session.ledgerRead(read),/Sign in/);
  assert.equal(reads,3,'invalid JWT signatures never reach a ledger query');
});

test('Ledger applies every filter in one caller-scoped RPC before paging, including global search', async () => {
  const calls=[], query={}; let count=101, failure=null;
  query.select=columns=>{calls.push(['select',columns]);return query;};
  query.then=resolve=>resolve({data:Array.from({length:count},(_,index)=>({line_id:String(index)})),error:failure});
  const ledger=load('ledger.ts',{'./report-session':{ledgerRead:fn=>fn({rpc:(name,args)=>{calls.push(['rpc',name,args]);return query;}})}});
  const literal="O'Brien, 25%_fee\\settlement";
  const page=await ledger.getGeneralLedger('2026-01-01','2026-07-31',2,{account:'211.100',offset:'112.100',query:` ${literal} `,side:'debit',accountType:'liability',category:'PAY-08',min:0,max:123.45});
  assert.equal(page.rows.length,100);assert.equal(page.hasNext,true);assert.equal(page.page,2);
  assert.deepEqual(calls[0],['rpc','filter_ledger',{p_branch:null,p_from:'2026-01-01',p_to:'2026-07-31',p_query:literal,p_account:'211.100',p_offset:'112.100',p_side:'debit',p_account_type:'liability',p_category:'PAY-08',p_min:0,p_max:123.45,p_skip:100,p_take:101}]);
  calls.length=0;count=100;
  const last=await ledger.getGeneralLedger('2026-01-01','2026-07-31',-5);
  assert.equal(last.page,1);assert.equal(last.hasNext,false);
  assert.deepEqual(calls[0][2],{p_branch:null,p_from:'2026-01-01',p_to:'2026-07-31',p_query:'',p_account:null,p_offset:null,p_side:'all',p_account_type:null,p_category:null,p_min:null,p_max:null,p_skip:0,p_take:101});
  calls.length=0;count=500;
  const drawer=await ledger.getGeneralLedger('2026-01-01','2026-07-31',1,{},500);
  assert.equal(drawer.pageSize,500);assert.equal(drawer.hasNext,false);assert.equal(calls[0][2].p_take,501);
  failure={message:'Permission denied'};
  await assert.rejects(()=>ledger.getGeneralLedger('2026-01-01','2026-07-31'),/Ledger query failed: Permission denied/);
});

test('Transaction categories read catalog identities without activity or financial aggregation', async () => {
  const calls=[],query={};
  for(const name of ['select','order'])query[name]=(...args)=>{calls.push([name,...args]);return query;};
  query.then=resolve=>resolve({data:[{rule_code:'PAY-08',trigger_name:'Pay a vendor',category:'payment'}],error:null});
  const ledger=load('ledger.ts',{'./report-session':{ledgerRead:fn=>fn({from:table=>{calls.push(['from',table]);return query;}})}});
  assert.equal((await ledger.getLedgerCategories())[0].rule_code,'PAY-08');
  assert.deepEqual(calls,[['from','ledger_rules'],['select','rule_code,trigger_name,category'],['order','rule_code']]);
});

test('Batched trial balances use the required RPC, keep request order and surface missing migrations', async () => {
  const rpcs = [];
  let reply;
  const ledger = load('ledger.ts', {
    '@/lib/supabase/server': {},
    './report-session': { ledgerRead: async fn => fn({ rpc: async (name, args) => { rpcs.push([name, args]); return reply(name, args); } }) },
  });
  const requests = [{ asOf: '2026-01-31', from: '2026-01-01' }, { asOf: '2025-12-31', from: null }];
  reply = () => ({ data: [{ period_index: 1, accounts: [{ account_number: '112.100' }] }, { period_index: 2, accounts: [] }], error: null });
  assert.deepEqual(await ledger.getTrialBalances(requests), [[{ account_number: '112.100' }], []]);
  assert.deepEqual(rpcs, [['get_trial_balances', { p_branch: null, p_as_of: ['2026-01-31', '2025-12-31'], p_from: ['2026-01-01', null] }]]);
  assert.deepEqual(await ledger.getTrialBalances([]), []);
  assert.equal(rpcs.length, 1, 'no request for an empty batch');
  reply = () => ({ data: [{ period_index: 2, accounts: [] }, { period_index: 1, accounts: [] }], error: null });
  await assert.rejects(() => ledger.getTrialBalances(requests), /unexpected periods/);
  reply = () => ({ data: [{ period_index: 1, accounts: [] }], error: null });
  await assert.rejects(() => ledger.getTrialBalances(requests), /unexpected periods/);
  reply = () => ({ data: null, error: { code: '42501', message: 'permission denied' } });
  await assert.rejects(() => ledger.getTrialBalances(requests), /Trial balances query failed: permission denied/);
  rpcs.length = 0;
  reply = () => ({ data: null, error: { code: 'PGRST202', message: 'missing' } });
  await assert.rejects(() => ledger.getTrialBalances(requests), /Trial balances query failed: missing/);
  assert.deepEqual(rpcs.map(call => call[0]), ['get_trial_balances']);
});

test('Ledger count uses the same filters without pagination and validates its scalar response',async()=>{
  const calls=[];let reply={data:'232',error:null};
  const ledger=load('ledger.ts',{'./report-session':{ledgerRead:fn=>fn({rpc:async(name,args)=>{calls.push([name,args]);return reply;}})}});
  assert.equal(await ledger.getLedgerCount('2026-01-01','2026-12-31',{query:' 48 ',accountType:'expense',category:'PAY-16',min:0,max:100}),232);
  assert.deepEqual(calls[0],['count_ledger',{p_branch:null,p_from:'2026-01-01',p_to:'2026-12-31',p_query:'48',p_account:null,p_offset:null,p_side:'all',p_account_type:'expense',p_category:'PAY-16',p_min:0,p_max:100}]);
  reply={data:0,error:null};assert.equal(await ledger.getLedgerCount('2026-01-01','2026-12-31'),0);
  reply={data:-1,error:null};await assert.rejects(()=>ledger.getLedgerCount('2026-01-01','2026-12-31'),/Invalid ledger record count/);
  reply={data:null,error:{message:'Permission denied'}};await assert.rejects(()=>ledger.getLedgerCount('2026-01-01','2026-12-31'),/Ledger count failed/);
});
