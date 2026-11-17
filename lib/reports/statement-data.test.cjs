const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(__dirname, file);
    if (cache.has(file)) return cache.get(file);
    const module = { exports: {} };
    const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    new Function('require', 'module', 'exports', output)(specifier => mocks[specifier] ?? (specifier.startsWith('.') ? load(path.resolve(path.dirname(file), specifier + '.ts')) : require(specifier)), module, module.exports);
    cache.set(file, module.exports);
    return module.exports;
  }
  return load;
}

const load = loader();
const data = load('statement-data.ts'), income = load('income-statement.ts'), balance = load('balance-sheet.ts'), analytics = load('analytics.ts'), utils = load('report-utils.ts');

// Synthetic ledger: every account type, cents that do not add cleanly as floats, and activity across three years.
const accounts = [
  ['112.100', 'asset', 'bank'], ['121.100', 'asset', 'receivable'], ['131.100', 'asset', 'inventory'], ['211.100', 'liability', 'payable'],
  ['231.100', 'liability', 'credit_card'], ['311.200', 'equity', 'capital'], ['004.001', 'revenue', 'sales'], ['010.003', 'revenue', 'other_income'],
  ['004.010', 'expense', 'cogs'], ['005.002', 'expense', 'payroll'], ['006.002', 'expense', 'opex'], ['007.003', 'expense', 'opex'], ['008.001', 'expense', 'opex'], ['011.001', 'expense', 'income_tax'],
].map(([code, type, subtype]) => ({ account_number: code, account_name: `Account ${code}`, account_type: type, account_subtype: subtype, normal_balance: ['asset', 'expense'].includes(type) ? 'debit' : 'credit' }));
const postings = [];
let seed = 7;
const next = () => (seed = (seed * 48271) % 2147483647);
for (let day = Date.UTC(2023, 11, 1); day <= Date.UTC(2026, 10, 4); day += 86400000 * 3) {
  const date = new Date(day).toISOString().slice(0, 10);
  const debit = accounts[next() % accounts.length].account_number, credit = accounts[next() % accounts.length].account_number;
  const amount = (next() % 500000) + [10, 20, 1, 99][next() % 4];
  if (debit !== credit) postings.push({ date, debit, credit, amount });
}
const money = value => `${value < 0 ? '-' : ''}${Math.floor(Math.abs(value) / 100)}.${String(Math.abs(value) % 100).padStart(2, '0')}`;
function trialBalance(asOf, from) {
  return accounts.map(account => {
    let debit = 0, credit = 0;
    for (const posting of postings) {
      if (posting.date > asOf || (from && posting.date < from)) continue;
      if (posting.debit === account.account_number) debit += posting.amount;
      if (posting.credit === account.account_number) credit += posting.amount;
    }
    return { ...account, total_debit: money(debit), total_credit: money(credit), balance: money(account.normal_balance === 'debit' ? debit - credit : credit - debit) };
  });
}

// The page logic before view switching moved to the browser: one trial-balance read per column.
function serverIncome(options) {
  const periods = income.incomeStatementPeriods(options);
  const previousOptions = { ...options, year: options.year - 1, grain: 'year' };
  const previousPeriod = income.incomeStatementPeriods(previousOptions)[0];
  const report = income.getIncomeStatement(options, periods.map(period => ({ period, accounts: trialBalance(period.to, period.from) })), 7);
  const previousReport = income.getIncomeStatement(previousOptions, [{ period: previousPeriod, accounts: trialBalance(previousPeriod.to, previousPeriod.from) }], 0);
  return { report, analytics: analytics.getIncomeAnalytics(report, previousReport) };
}
function serverBalance(options) {
  const periods = balance.balanceSheetPeriods(options);
  const columnYears = [...new Set(periods.map(period => Number(period.to.slice(0, 4))))];
  const snapshots = periods.map(period => ({ period, accounts: trialBalance(period.to, null) }));
  const priorYears = new Map(columnYears.map(year => [year, trialBalance(`${year - 1}-12-31`, null)]));
  const report = balance.getBalanceSheet(options, snapshots, priorYears, 9);
  const trend = analytics.balanceAnalyticsDates(options.asOf, periods).map(date => ({ period: { key: date, label: utils.formatDate(date), from: date, to: date }, accounts: trialBalance(date, null) }));
  return { report, analytics: analytics.getBalanceAnalytics(report, options.asOf, trialBalance(analytics.previousQuarterEnd(options.asOf), null), trend) };
}

test('Monthly activity sums into exact quarter and year totals in cents', () => {
  const row = (debit, credit) => ({ account_number: '004.001', account_name: 'Sales', account_type: 'revenue', account_subtype: 'sales', normal_balance: 'credit', total_debit: debit, total_credit: credit, balance: '0.00' });
  const months = [['0.10', '0.20'], ['0.20', '0.10'], ['0.70', '1.05']].map(([debit, credit], index) => ({ period: { key: `p${index + 1}`, label: '', from: `2026-0${index + 1}-01`, to: `2026-0${index + 1}-28` }, accounts: [row(debit, credit)] }));
  const [quarter] = data.combineMonths(months, [{ key: 'p1', label: 'Q1', from: '2026-01-01', to: '2026-03-31' }]);
  assert.deepEqual([quarter.accounts[0].total_debit, quarter.accounts[0].total_credit], ['1.00', '1.35']);
  const [february] = data.combineMonths(months, [{ key: 'p2', label: 'Feb', from: '2026-02-01', to: '2026-02-28' }]);
  assert.deepEqual([february.accounts[0].total_debit, february.accounts[0].total_credit], ['0.20', '0.10']);
});

test('Every Income Statement view built in the browser matches the per-column server reads', () => {
  for (const range of [{ year: 2026, from: 1, to: 11 }, { year: 2025, from: 1, to: 12 }, { year: 2026, from: 4, to: 8 }, { year: 2024, from: 2, to: 2 }]) {
    const months = data.incomeStatementMonths(range).map(period => ({ period, accounts: trialBalance(period.to, period.from) }));
    const previous = data.previousIncomePeriod(range);
    const loaded = { ...range, months, previous: trialBalance(previous.to, previous.from), posted: 7 };
    for (const grain of ['month', 'quarter', 'year']) for (const summary of [false, true]) {
      const view = data.buildIncomeStatementView(loaded, grain, summary);
      const expected = serverIncome({ ...range, grain, summary });
      assert.deepEqual(view.report, expected.report, `${range.year} ${range.from}-${range.to} ${grain} ${summary}`);
      assert.deepEqual(view.analytics, expected.analytics);
      assert.deepEqual(view.options, { ...range, branch: undefined, grain, summary });
    }
  }
});

test('Every Balance Sheet view built in the browser matches the per-date server reads', () => {
  for (const asOf of ['2026-11-04', '2025-12-31', '2026-02-14', '2026-01-01', '2024-02-29', '2026-03-31']) {
    const dates = data.balanceSheetDates(asOf);
    assert.deepEqual(dates, [...new Set(dates)].sort());
    const loaded = { asOf, balances: Object.fromEntries(dates.map(date => [date, trialBalance(date, null)])), posted: 9 };
    for (const grain of ['single', 'month', 'quarter', 'year']) for (const summary of [false, true]) {
      const view = data.buildBalanceSheetView(loaded, grain, summary);
      const expected = serverBalance({ asOf, grain, summary });
      assert.deepEqual(view.report, expected.report, `${asOf} ${grain} ${summary}`);
      assert.deepEqual(view.analytics, expected.analytics);
    }
  }
  assert.throws(() => data.buildBalanceSheetView({ asOf: '2026-11-04', balances: {}, posted: 0 }, 'single', false), /Missing balances/);
});

test('Loaders read each data window once, independent of the selected view', async () => {
  const calls = [];
  let batches = 0;
  const loaders = loader({ './ledger': { getTrialBalances: async requests => { batches++; return requests.map(item => { calls.push([item.asOf, item.from]); return []; }); }, countPostedEntries: async (...args) => { calls.push(['count', ...args]); return 3; } } })('statement-loaders.ts');
  const incomeData = await loaders.loadIncomeStatementData({ year: 2024, from: 2, to: 3, grain: 'quarter', summary: true });
  assert.deepEqual(calls, [['2024-02-29', '2024-02-01'], ['2024-03-31', '2024-03-01'], ['2023-03-31', '2023-02-01'], ['count', '2024-03-31', '2024-02-01', undefined]]);
  assert.deepEqual(Object.keys(incomeData).sort(), ['branch', 'from', 'months', 'posted', 'previous', 'to', 'year']);
  calls.length = 0;
  const balanceData = await loaders.loadBalanceSheetData('2026-04-15');
  assert.deepEqual(calls.filter(call => call[0] !== 'count').map(call => call[0]), ['2023-12-31', '2024-12-31', '2025-09-30', '2025-12-31', '2026-01-31', '2026-02-28', '2026-03-31', '2026-04-15']);
  assert.ok(calls.filter(call => call[0] !== 'count').every(call => call[1] === null));
  assert.deepEqual(calls.find(call => call[0] === 'count'), ['count', '2026-04-15', null, undefined]);
  assert.equal(balanceData.posted, 3);
  assert.equal(batches, 2, 'one trial-balance round trip per statement');
});


test('Statement loaders scope every snapshot and posted count to the selected branch', async () => {
  const calls=[];
  const loaders=loader({'./ledger':{
    getTrialBalances:async(requests,branch)=>{calls.push(['balances',branch]);return requests.map(()=>[]);},
    countPostedEntries:async(asOf,from,branch)=>{calls.push(['count',branch]);return 0;},
  }})('statement-loaders.ts');
  const incomeData=await loaders.loadIncomeStatementData({year:2026,from:1,to:1,branch:'Chicago'});
  const balanceData=await loaders.loadBalanceSheetData('2026-01-31','Chicago');
  assert.deepEqual(calls,[['balances','Chicago'],['count','Chicago'],['balances','Chicago'],['count','Chicago']]);
  for (const view of [data.buildIncomeStatementView(incomeData,'month',false),data.buildBalanceSheetView(balanceData,'single',false)]) {
    assert.equal(view.options.branch,'Chicago');
    assert.equal(view.report.entity,'Chicago Brass Inc. - Chicago');
  }
});
