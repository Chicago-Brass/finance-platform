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

test('Ledger side is applied before paging and a search uses bound global filters with one lookahead', async () => {
  const calls = [], query = {};
  let count = 101;
  for (const name of ['select', 'gte', 'lte', 'gt', 'eq', 'order', 'range']) query[name] = (...args) => { calls.push([name, ...args]); return query; };
  query.then = resolve => resolve({ data: Array.from({ length: count }, (_, index) => ({ line_id: String(index) })), error: null });
  const ledger = load('ledger.ts', { './report-session': { ledgerRead: fn => fn({ from: () => query, rpc: (name, args) => { calls.push(['rpc', name, args]); return query; } }) } });
  await ledger.getGeneralLedger('2026-01-01', '2026-07-31', 1, { side: 'credit' });
  assert.deepEqual(calls.find(call => call[0] === 'gt'), ['gt', 'credit', 0]);
  calls.length = 0;
  const literal = "  O'Brien, 25%_fee\\settlement  ";
  const page = await ledger.getGeneralLedger('2026-01-01', '2026-07-31', 2, { account: '211.100', offset: '112.100', query: literal, side: 'debit' });
  assert.equal(page.rows.length, 100); assert.equal(page.hasNext, true);
  assert.deepEqual(calls[0], ['rpc', 'search_ledger', { p_from: '2026-01-01', p_to: '2026-07-31', p_query: literal.trim(), p_account: '211.100', p_offset: '112.100', p_side: 'debit', p_skip: 100, p_take: 101 }]);
  assert.ok(!calls.some(call => call[0] === 'range'), 'the SQL function filters and pages before returning records');
  count = 500; calls.length = 0;
  const drawer = await ledger.getGeneralLedger('2026-01-01', '2026-07-31', 1, { query: 'Search', side: 'all' }, 500);
  assert.equal(drawer.pageSize, 500); assert.equal(drawer.hasNext, false);
  assert.equal(calls[0][2].p_take, 501);
});

test('Batched trial balances use one RPC, keep request order and fall back until the migration is applied', async () => {
  const rpcs = [];
  let reply;
  const ledger = load('ledger.ts', {
    '@/lib/supabase/server': {},
    './report-session': { ledgerRead: async fn => fn({ rpc: async (name, args) => { rpcs.push([name, args]); return reply(name, args); } }) },
  });
  const requests = [{ asOf: '2026-01-31', from: '2026-01-01' }, { asOf: '2025-12-31', from: null }];
  reply = () => ({ data: [{ period_index: 1, accounts: [{ account_number: '112.100' }] }, { period_index: 2, accounts: [] }], error: null });
  assert.deepEqual(await ledger.getTrialBalances(requests), [[{ account_number: '112.100' }], []]);
  assert.deepEqual(rpcs, [['get_trial_balances', { p_as_of: ['2026-01-31', '2025-12-31'], p_from: ['2026-01-01', null] }]]);
  assert.deepEqual(await ledger.getTrialBalances([]), []);
  assert.equal(rpcs.length, 1, 'no request for an empty batch');
  reply = () => ({ data: [{ period_index: 2, accounts: [] }, { period_index: 1, accounts: [] }], error: null });
  await assert.rejects(() => ledger.getTrialBalances(requests), /unexpected periods/);
  reply = () => ({ data: [{ period_index: 1, accounts: [] }], error: null });
  await assert.rejects(() => ledger.getTrialBalances(requests), /unexpected periods/);
  reply = () => ({ data: null, error: { code: '42501', message: 'permission denied' } });
  await assert.rejects(() => ledger.getTrialBalances(requests), /Trial balances query failed: permission denied/);
  rpcs.length = 0;
  reply = (name, args) => name === 'get_trial_balances' ? { data: null, error: { code: 'PGRST202', message: 'missing' } } : { data: [{ account_number: `${args.p_from}..${args.p_as_of}` }], error: null };
  assert.deepEqual(await ledger.getTrialBalances(requests), [[{ account_number: '2026-01-01..2026-01-31' }], [{ account_number: 'null..2025-12-31' }]]);
  assert.deepEqual(rpcs.map(call => call[0]), ['get_trial_balances', 'get_trial_balance', 'get_trial_balance']);
});
