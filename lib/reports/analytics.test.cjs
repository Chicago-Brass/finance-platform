const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');

function loader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(__dirname, file);
    if (cache.has(file)) return cache.get(file);
    const module = { exports: {} };
    const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const localRequire = specifier => mocks[specifier] ?? (specifier.startsWith('@/') ? load(path.join(root, specifier.slice(2)) + '.ts') : specifier.startsWith('.') ? load(path.resolve(path.dirname(file), specifier + '.ts')) : require(specifier));
    new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
    cache.set(file, module.exports);
    return module.exports;
  }
  return load;
}

const load = loader();
const analytics = load('analytics.ts'), income = load('income-statement.ts'), balance = load('balance-sheet.ts');
const row = (code, type, subtype, debit, credit) => ({ account_number: code, account_name: code, account_type: type, account_subtype: subtype, normal_balance: type === 'asset' || type === 'expense' ? 'debit' : 'credit', total_debit: String(debit), total_credit: String(credit), balance: 0 });
const period = { key: 'p1', label: 'Jan 2026', from: '2026-01-01', to: '2026-01-31' };
const incomeOptions = { year: 2026, from: 1, to: 1, grain: 'month', summary: false };
const profit = [row('004.001','revenue','sales',0,1000),row('004.006','revenue','contra_revenue',100,0),row('004.010','expense','cogs',500,0),row('004.011','expense','contra_cogs',0,50),row('005.002','expense','payroll',100,0),row('007.002','expense','opex',0.72,0),row('009.101','expense','depreciation',20,0),row('007.003','expense','opex',42.44,0),row('010.003','revenue','other_income',0,10),row('011.001','expense','income_tax',30,0)];
const priorProfit = [row('004.001','revenue','sales',0,1000),row('004.010','expense','cogs',500,0),row('005.002','expense','payroll',100,0)];

test('Income analytics uses report totals once, preserves cents and compares the same report measures', () => {
  const snapshots = [{period,accounts:profit},{period:{...period,key:'p2',label:'Feb 2026',from:'2026-02-01',to:'2026-02-28'},accounts:profit}];
  const current = income.getIncomeStatement({...incomeOptions,to:2},snapshots,4);
  const previous = income.getIncomeStatement({...incomeOptions,year:2025,grain:'year'},[{period:{...period,label:'2025',from:'2025-01-01',to:'2025-02-28'},accounts:priorProfit}],1);
  const result = analytics.getIncomeAnalytics(current, previous);
  assert.equal(result.headline.value, 1800);
  assert.equal(result.secondary.value, 533.68);
  assert.equal(result.secondary.share, 533.68 / 1800);
  assert.deepEqual(result.composition.items.map(item => item.value), [200,0,1.44,0,40]);
  assert.deepEqual(result.movement.metrics, [{label:'Revenue',value:1800,previous:1000},{label:'Operating expenses',value:241.44,previous:100},{label:'Net income',value:533.68,previous:400}]);
  assert.deepEqual(result.movement.trend.map(item=>item.value), [266.84,266.84]);
  assert.match(result.movement.comparisonLabel,/Jan 1, 2025 to Feb 28, 2025/);
  const summary = income.getIncomeStatement({...incomeOptions,to:2,summary:true},snapshots,4);
  assert.deepEqual(analytics.getIncomeAnalytics(summary, previous), result);
});

test('Annual income has one actual trend point and zero revenue has no invented margin', () => {
  const annual = income.getIncomeStatement({...incomeOptions,grain:'year'},[{period:{...period,label:'2026'},accounts:[row('007.003','expense','opex',42.44,0)]}],1);
  const result = analytics.getIncomeAnalytics(annual, annual);
  assert.equal(result.secondary.value, -42.44);
  assert.equal(result.secondary.share, null);
  assert.deepEqual(result.movement.trend, [{label:'2026',value:-42.44}]);
});

test('Balance analytics keeps negative equity, contra assets and cash above net assets truthful', () => {
  const current = [row('112.100','asset','bank',150.01,0),row('121.900','asset','contra_asset',0,50),row('211.100','liability','payable',0,300.02),row('005.002','expense','payroll',200.01,0)];
  const previous = [row('112.100','asset','bank',130,0),row('121.900','asset','contra_asset',0,50),row('211.100','liability','payable',0,250),row('005.002','expense','payroll',170,0)];
  const selected = {...period,to:'2026-09-30'};
  const report = balance.getBalanceSheet({asOf:selected.to,grain:'single',summary:false},[{period:selected,accounts:current}],[],4);
  const result = analytics.getBalanceAnalytics(report,selected.to,previous,[{period:{...period,to:'2026-06-30'},accounts:previous},{period:selected,accounts:current}]);
  assert.equal(result.headline.value, 100.01);
  assert.deepEqual(result.composition.items, [{label:'Liabilities',value:300.02},{label:'Equity',value:-200.01}]);
  assert.equal(result.secondary.value, 150.01);
  assert.equal(result.secondary.share, 150.01 / 100.01);
  assert.deepEqual(result.movement.metrics, [{label:'Assets',value:100.01,previous:80},{label:'Liabilities',value:300.02,previous:250},{label:'Equity',value:-200.01,previous:-170}]);
  assert.deepEqual(result.movement.trend.map(item=>item.value), [80,100.01]);
  assert.match(result.movement.comparisonLabel,/Jun 30, 2026/);
});

test('Zero-activity Balance Sheet has no division by zero or fabricated cash share', () => {
  const report = balance.getBalanceSheet({asOf:period.to,grain:'single',summary:true},[{period,accounts:[]}],[],0);
  const result = analytics.getBalanceAnalytics(report,period.to,[],[]);
  assert.equal(result.headline.value, 0);
  assert.equal(result.secondary.share, null);
  assert.deepEqual(result.composition.items.map(item=>item.value), [0,0]);
});

test('Quarter comparisons use strictly preceding endpoints and single-view trends contain no future dates', () => {
  assert.equal(analytics.previousQuarterEnd('2026-03-31'), '2025-12-31');
  assert.equal(analytics.previousQuarterEnd('2026-04-01'), '2026-03-31');
  assert.equal(analytics.previousQuarterEnd('2024-02-29'), '2023-12-31');
  assert.deepEqual(analytics.balanceAnalyticsDates('2026-09-30',[period]), ['2025-12-31','2026-03-31','2026-06-30','2026-09-30']);
  const dates = analytics.balanceAnalyticsDates('2026-01-01',[period]);
  assert.equal(new Set(dates).size, dates.length);
  assert.ok(dates.every(date=>date<='2026-01-01'));
  const months = balance.balanceSheetPeriods({asOf:'2026-04-15',grain:'month',summary:false});
  assert.deepEqual(analytics.balanceAnalyticsDates('2026-04-15',months), months.map(item=>item.to));
});

function pageLoader(calls, accounts) {
  const Component = () => null;
  const ledger = {getTrialBalances:async requests=>requests.map(item=>{calls.push([item.asOf,item.from]);return accounts;}),countPostedEntries:async()=>4};
  return loader({
    '@/components/StatementWorkspace': {IncomeStatementWorkspace:Component,BalanceSheetWorkspace:Component},
    '@/lib/reports/ledger': ledger,
    './ledger': ledger,
  });
}
const statementData = load('statement-data.ts');

async function streamedPage(page, params, calls) {
  const shell = await page.default({ searchParams: Promise.resolve(params) });
  assert.equal(typeof shell.type, 'function', 'the persistent client workspace is the route shell');
  assert.equal(typeof shell.props.data.then, 'function', 'financial reads stay behind the client data boundary');
  return { ...shell, props: { ...shell.props, data: await shell.props.data, grain: shell.props.options.grain, summary: shell.props.options.summary } };
}

test('Income page queries the selected leap month and one equivalent prior-year month', async () => {
  const calls = [];
  const page = pageLoader(calls,profit)('../../app/(reports)/income-statement/page.tsx');
  const element = await streamedPage(page, {year:'2024',from:'2',to:'2',grain:'month'}, calls);
  assert.deepEqual(calls, [['2024-02-29','2024-02-01'],['2023-02-28','2023-02-01']]);
  assert.equal(element.props.grain, 'month');
  assert.equal(element.props.summary, false);
  const view = statementData.buildIncomeStatementView(element.props.data, element.props.grain, element.props.summary);
  assert.equal(view.analytics.kind, 'income');
  assert.match(view.analytics.movement.comparisonLabel,/Feb 1, 2023 to Feb 28, 2023/);
});

test('Balance page reads each snapshot date once and serves every view from that data', async () => {
  const calls = [];
  const page = pageLoader(calls,[])('../../app/(reports)/balance-sheet/page.tsx');
  const element = await streamedPage(page, {asof:'2026-09-30'}, calls);
  const dates = calls.map(item=>item[0]);
  assert.equal(new Set(dates).size, dates.length);
  assert.ok(calls.every(item=>item[1]===null));
  for (const date of ['2025-12-31','2026-03-31','2026-06-30','2026-09-30']) assert.ok(dates.includes(date), date);
  assert.equal(element.props.grain, 'single');
  const single = statementData.buildBalanceSheetView(element.props.data, 'single', false);
  assert.equal(single.analytics.kind, 'balance');
  assert.equal(single.analytics.movement.trend.length, 4);
  for (const grain of ['month','quarter','year']) assert.equal(statementData.buildBalanceSheetView(element.props.data, grain, true).options.grain, grain);
});

test('Annual Balance page keeps the selected mode and each column earnings baseline', async () => {
  const calls = [];
  const page = pageLoader(calls,[])('../../app/(reports)/balance-sheet/page.tsx');
  const element = await streamedPage(page, {asof:'2026-04-15',grain:'year',layout:'summary'}, calls);
  for (const date of ['2023-12-31','2024-12-31','2025-12-31','2026-03-31','2026-04-15']) assert.ok(calls.some(item=>item[0]===date), date);
  assert.equal(element.props.grain, 'year');
  assert.equal(element.props.summary, true);
  const view = statementData.buildBalanceSheetView(element.props.data, element.props.grain, element.props.summary);
  assert.deepEqual(view.analytics.movement.trend.map(item=>item.label), ['Dec 31, 2024','Dec 31, 2025','Apr 15, 2026']);
});


test('Statement routes return the persistent shell before a delayed ledger read finishes', { timeout: 1000 }, async () => {
  const pending = new Promise(() => {}), Component = () => null;
  const pages = loader({ '@/components/StatementWorkspace': { IncomeStatementWorkspace: Component, BalanceSheetWorkspace: Component }, '@/lib/reports/statement-loaders': { loadIncomeStatementData: () => pending, loadBalanceSheetData: () => pending } });
  for (const route of ['income-statement', 'balance-sheet']) {
    const page = pages(`../../app/(reports)/${route}/page.tsx`);
    const shell = await page.default({ searchParams: Promise.resolve({ year: '2026', asof: '2026-04-15' }) });
    assert.equal(shell.type, Component);
    assert.equal(shell.props.data, pending);
    assert.ok(shell.props.options, 'URL options are available without financial data');
  }
});

test('Income loader sends only income accounts without changing any view or analytics', async () => {
  const accounts = [...profit, row('112.100','asset','bank',2000,0), row('211.100','liability','payable',0,500), row('301.100','equity','equity',0,1500)];
  const calls = [], page = pageLoader(calls, accounts)('../../app/(reports)/income-statement/page.tsx');
  const shell = await page.default({ searchParams: Promise.resolve({year:'2026',from:'1',to:'3'}) });
  const data = await shell.props.data;
  assert.ok(data.months.every(month => month.accounts.every(account => ['revenue','expense'].includes(account.account_type))));
  assert.equal(data.previous.length, profit.length);
  const unfiltered = {...data, months:data.months.map(month=>({...month,accounts})), previous:accounts};
  for (const grain of ['month','quarter','year']) for (const summary of [false,true]) {
    assert.deepEqual(statementData.buildIncomeStatementView(data,grain,summary),statementData.buildIncomeStatementView(unfiltered,grain,summary));
  }
});
