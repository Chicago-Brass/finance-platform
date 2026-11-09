const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
function loader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (cache.has(file)) return cache.get(file);
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const localRequire = name => Object.hasOwn(mocks,name) ? mocks[name] : name.startsWith('@/') ? load(`${name.slice(2)}.ts`) : name.startsWith('.') ? load(path.resolve(path.dirname(file), `${name}.ts`)) : require(name);
    new Function('require','module','exports',code)(localRequire,module,module.exports);
    cache.set(file,module.exports);
    return module.exports;
  }
  return load;
}
const { REPORT_PATHS, parseReportScreen } = loader()('lib/reports/report-routes.ts');
const today = '2026-11-05';

test('Statement screens share normalized options while data request keys ignore display-only changes', () => {
  const income = parseReportScreen(REPORT_PATHS.income,{year:'2024',from:'3',to:'2',grain:'quarter',layout:'summary'},today);
  assert.deepEqual(income.options,{branch:undefined,year:2024,from:2,to:3,grain:'quarter',summary:true});
  assert.equal(income.request,'/api/reports/data?report=income&year=2024&from=2&to=3');
  assert.equal(parseReportScreen(REPORT_PATHS.income,{year:'2024',from:'2',to:'3',grain:'year'},today).request,income.request);
  const balance = parseReportScreen(REPORT_PATHS.balance,{asof:'2026-04-15',grain:'year',layout:'summary'},today);
  assert.equal(balance.options.grain,'year'); assert.equal(balance.options.summary,true);
  assert.equal(balance.request,'/api/reports/data?report=balance&asof=2026-04-15');
  assert.equal(parseReportScreen(REPORT_PATHS.balance,{asof:'2026-02-30'},today).options.asOf,today);
});

test('Ledger request keys preserve every validated search/filter/page and normalize invalid values', () => {
  const literal = "O'Brien, 25%_fee\\settlement";
  const ledger = parseReportScreen(REPORT_PATHS.ledger,{from:'2026-01-01',to:'2026-07-31',account:'211.100',offset:'112.100',q:` ${literal} `,side:'debit',page:'3'},today);
  assert.deepEqual(ledger.options,{branch:undefined,from:'2026-01-01',to:'2026-07-31',page:3,account:'211.100',offset:'112.100',query:literal,side:'debit',accountType:undefined,category:undefined,min:undefined,max:undefined});
  assert.deepEqual(Object.fromEntries(new URL(ledger.request,'http://localhost').searchParams),{report:'ledger',from:'2026-01-01',to:'2026-07-31',account:'211.100',offset:'112.100',q:literal,side:'debit',page:'3'});
  const fallback = parseReportScreen(REPORT_PATHS.ledger,{from:'bad',to:'2026-02-30',account:"211.100' OR true",side:'unknown',page:'1.5'},today);
  assert.deepEqual(fallback.options,{branch:undefined,from:'2026-01-01',to:today,page:1,account:undefined,offset:undefined,query:'',side:'all',accountType:undefined,category:undefined,min:undefined,max:undefined});
  assert.equal(fallback.request,`/api/reports/data?report=ledger&from=2026-01-01&to=${today}&page=1`);
  assert.equal(parseReportScreen(REPORT_PATHS.ledger,{q:'a'.repeat(250)},today).options.query.length,200);
});

test('Trial and rule screens use canonical requests without unrelated parameters', () => {
  assert.deepEqual(parseReportScreen(REPORT_PATHS.trial,{to:'2025-12-31',q:'ignored'},today),{kind:'trial',options:{asOf:'2025-12-31',branch:undefined},request:'/api/reports/data?report=trial&to=2025-12-31'});
  assert.deepEqual(parseReportScreen(REPORT_PATHS.rules,{q:'ignored',page:'4'},today),{kind:'rules',request:'/api/reports/data?report=rules'});
  assert.throws(()=>parseReportScreen('/unknown',{},today),RangeError);
});

test('Report JSON GET authenticates first, dispatches scoped reads, preserves payloads and sanitizes errors', async () => {
  let authenticated = true, failed = false, authCalls = 0;
  const calls = [], result = { zero:0, amount:'123.45' };
  const read = name => async (...args) => { calls.push([name,...args]); if (failed) throw new Error('private database host and credentials'); return result; };
  const { GET } = loader({
    '@/lib/reports/report-session':{reportUser:async()=>{authCalls++;if(!authenticated)throw new Error('signed out');return {id:'viewer'};}},
    '@/lib/reports/ledger':{getGeneralLedger:read('ledger'),getLedgerAccounts:read('accounts'),getLedgerCategories:read('categories'),getLedgerCount:read('ledger-count'),getTrialBalance:read('trial'),getTChart:read('rules')},
    '@/lib/reports/statement-loaders':{loadIncomeStatementData:read('income'),loadBalanceSheetData:read('balance')},
  })('app/api/reports/data/route.ts');
  const request = params => new Request(`http://localhost/api/reports/data?${new URLSearchParams(params)}`);
  authenticated = false;
  let response = await GET(request({report:'income'}));
  assert.equal(response.status,401); assert.deepEqual(calls,[]); assert.equal(authCalls,1);
  assert.equal(response.headers.get('cache-control'),'private, no-store');
  authenticated = true;
  for (const report of ['unknown','toString','__proto__','']) assert.equal((await GET(request({report}))).status,400);
  assert.deepEqual(calls,[]);
  const cases = [
    [{report:'income',year:'2024',from:'2',to:'3',grain:'quarter'},['income',{branch:undefined,year:2024,from:2,to:3,grain:'quarter',summary:false}]],
    [{report:'balance',asof:'2026-04-15'},['balance','2026-04-15',undefined]],
    [{report:'trial',to:'2025-12-31'},['trial','2025-12-31',null,undefined]],
    [{report:'ledger',from:'2026-01-01',to:'2026-07-31',q:'wire',side:'credit',page:'2'},['ledger','2026-01-01','2026-07-31',2,{branch:undefined,account:undefined,offset:undefined,query:'wire',side:'credit',accountType:undefined,category:undefined,min:undefined,max:undefined}]],
    [{report:'ledger-count',from:'2026-01-01',to:'2026-07-31',q:'wire',type:'asset',min:'0',page:'9'},['ledger-count','2026-01-01','2026-07-31',{branch:undefined,account:undefined,offset:undefined,query:'wire',side:'all',accountType:'asset',category:undefined,min:0,max:undefined}]],
    [{report:'rules'},['rules']], [{report:'accounts'},['accounts']], [{report:'categories'},['categories']],
  ];
  for (const [params, expected] of cases) {
    response = await GET(request(params));
    assert.equal(response.status,200); assert.deepEqual(await response.json(),result); assert.deepEqual(calls.at(-1),expected);
    assert.equal(response.headers.get('cache-control'),'private, no-store');
    assert.match(response.headers.get('server-timing'),/^report;dur=\d+\.\d$/);
  }
  const before = authCalls;
  failed = true; response = await GET(request({report:'rules'}));
  assert.equal(authCalls,before+1,'the endpoint checks the user once before dispatch');
  assert.equal(response.status,500); assert.doesNotMatch(await response.text(),/private database|credentials/);
});


test('All four financial report cache keys are branch-scoped, including ledger totals', () => {
  for (const kind of ['income','balance','trial','ledger']) {
    const base = parseReportScreen(REPORT_PATHS[kind], {}, today);
    const chicago = parseReportScreen(REPORT_PATHS[kind], {branch:'Chicago'}, today);
    const milwaukee = parseReportScreen(REPORT_PATHS[kind], {branch:'Milwaukee'}, today);
    assert.equal(chicago.options.branch, 'Chicago');
    assert.equal(new URL(chicago.request,'http://localhost').searchParams.get('branch'), 'Chicago');
    assert.notEqual(chicago.request, base.request);
    assert.notEqual(chicago.request, milwaukee.request);
    if (kind === 'ledger') assert.equal(new URL(chicago.countRequest,'http://localhost').searchParams.get('branch'), 'Chicago');
  }
});
