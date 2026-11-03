const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(file) {
  file = path.resolve(__dirname, file);
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = specifier => specifier.startsWith('.') ? load(path.resolve(path.dirname(file), specifier + '.ts')) : require(specifier);
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  cache.set(file, module.exports);
  return module.exports;
}
const income = load('income-statement.ts'), balance = load('balance-sheet.ts'), utils = load('report-utils.ts'), dates = load('../dates.ts');
const row = (code, type, subtype, debit, credit, name = code) => ({ account_number: code, account_name: name, account_type: type, account_subtype: subtype, normal_balance: type === 'asset' || type === 'expense' ? 'debit' : 'credit', total_debit: String(debit), total_credit: String(credit), balance: 0 });
const period = { key: 'p1', label: 'Jan 2026', from: '2026-01-01', to: '2026-01-31' };
const line = (report, id, column = 'p1') => report.lines.find(item => item.id === id).values[column];
const incomeOptions = { year: 2026, from: 1, to: 1, grain: 'month', summary: false };
const pl = [row('004.001','revenue','sales',0,1000),row('004.006','revenue','contra_revenue',100,0),row('004.010','expense','cogs',500,0),row('004.011','expense','contra_cogs',0,50),row('005.002','expense','payroll',100,0),row('007.002','expense','opex',0.72,0),row('009.101','expense','depreciation',20,0),row('007.003','expense','opex',42.44,0),row('010.003','revenue','other_income',0,10),row('011.001','expense','income_tax',30,0)];

test('Income Statement reconciles contra accounts, operating income, interest and taxes in cents', () => {
  const report = income.getIncomeStatement(incomeOptions,[{period,accounts:pl}],10);
  assert.equal(line(report,'t-revenue'),900);
  assert.equal(line(report,'t-cogs'),450);
  assert.equal(line(report,'gross-profit'),450);
  assert.equal(line(report,'operating-income'),329.28);
  assert.equal(line(report,'t-interest'),-42.44);
  assert.equal(line(report,'pretax'),296.84);
  assert.equal(line(report,'net-income'),266.84);
  assert.deepEqual(report.lines.filter(item=>item.accountCode).map(item=>item.accountCode).sort(),pl.map(item=>item.account_number).sort());
});

test('Unknown expense and revenue subtypes remain visible and affect totals once', () => {
  const rows=[...pl,row('009.999','expense','new_subtype',0.01,0),row('010.999','revenue',null,0,0.02)];
  const report=income.getIncomeStatement(incomeOptions,[{period,accounts:rows}],12);
  assert.equal(line(report,'net-income'),266.85);
  assert.equal(report.lines.filter(item=>item.accountCode).length,rows.length);
});

test('Monthly total and summary reconcile to the same income without rounding drift', () => {
  const snapshots=[{period,accounts:pl},{period:{...period,key:'p2',label:'Feb 2026'},accounts:pl}];
  const detailed=income.getIncomeStatement({...incomeOptions,to:2},snapshots,20);
  const summary=income.getIncomeStatement({...incomeOptions,to:2,summary:true},snapshots,20);
  assert.equal(line(detailed,'net-income','total'),533.68);
  assert.equal(line(summary,'net-income','total'),533.68);
  assert.equal(detailed.columns.length,3);
  assert.ok(!summary.lines.some(item=>item.accountCode));
  assert.ok(!JSON.stringify(detailed).toLowerCase().includes('forecast'));
});

test('Dates default dynamically, allow past years, and exclude branch routing', () => {
  assert.deepEqual(income.parseIncomeStatementParams({},'2027-04-02'),{year:2027,from:1,to:4,grain:'month',summary:false});
  const options=income.parseIncomeStatementParams({year:'2025',from:'7',to:'2',view:'CHI'},'2026-11-03');
  assert.deepEqual(options,{year:2025,from:2,to:7,grain:'month',summary:false});
  assert.equal(income.parseIncomeStatementParams({year:'2025'},'2026-11-03').to,12);
  assert.equal(income.parseIncomeStatementParams({year:'not-a-year'},'2026-11-03').year,2026);
});

test('Month/quarter/year periods cover the requested range including leap years and partial quarters', () => {
  assert.equal(income.incomeStatementPeriods({...incomeOptions,year:2024,from:2,to:2})[0].to,'2024-02-29');
  const periods=income.incomeStatementPeriods({...incomeOptions,from:2,to:5,grain:'quarter'});
  assert.deepEqual(periods.map(item=>[item.from,item.to]),[['2026-02-01','2026-03-31'],['2026-04-01','2026-05-31']]);
  assert.equal(income.incomeStatementPeriods({...incomeOptions,grain:'year',to:12}).length,1);
});

const bs = [row('112.100','asset','bank',1000,0),row('121.900','asset','contra_asset',0,100),row('143.300','asset','fixed_asset',100,0),row('161.000','asset','contra_asset',0,50),row('211.100','liability','payable',0,770),row('311.200','equity','capital',0,100),row('316.100','equity','distributions',20,0),row('004.001','revenue','sales',0,150),row('005.002','expense','payroll',50,0)];
const bsOptions={asOf:'2026-01-31',grain:'single',summary:false};
const prior=[row('004.001','revenue','sales',0,60)];

test('Balance Sheet nets contra assets and distributions and separates prior/current earnings', () => {
  const report=balance.getBalanceSheet(bsOptions,[{period,accounts:bs}],prior,4);
  assert.equal(line(report,'total-assets'),950);
  assert.equal(line(report,'t-receivables'),-100);
  assert.equal(line(report,'t-fixed'),50);
  assert.equal(line(report,'t-equity'),80);
  assert.equal(line(report,'prior-earnings'),60);
  assert.equal(line(report,'current-earnings'),40);
  assert.equal(line(report,'total-le'),950);
  assert.ok(report.checks.find(item=>item.label==='Balances').ok);
  assert.deepEqual(report.lines.filter(item=>item.accountCode).map(item=>item.accountCode).sort(),bs.filter(item=>!['revenue','expense'].includes(item.account_type)).map(item=>item.account_number).sort());
});

test('Balance Sheet retains unknown assets/liabilities and reports a real imbalance', () => {
  const report=balance.getBalanceSheet(bsOptions,[{period,accounts:[...bs,row('144.999','asset','new_subtype',0.01,0),row('255.999','liability',null,0,0.02)]}],prior,6);
  assert.equal(line(report,'t-other-assets'),0.01);
  assert.equal(line(report,'t-other-liabilities'),0.02);
  assert.equal(report.checks.find(item=>item.label==='Balances').ok,false);
  assert.match(report.checks[0].detail,/0\.01/);
});

test('Month/quarter Balance Sheets end exactly at the as-of date without duplicate endpoints', () => {
  const month=balance.balanceSheetPeriods({...bsOptions,asOf:'2026-04-15',grain:'month'});
  assert.deepEqual(month.map(item=>item.to),['2026-01-31','2026-02-28','2026-03-31','2026-04-15']);
  assert.deepEqual(balance.balanceSheetPeriods({...bsOptions,asOf:'2026-06-30',grain:'quarter'}).map(item=>item.to),['2026-03-31','2026-06-30']);
  assert.equal(balance.balanceSheetPeriods({...bsOptions,grain:'month'}).length,1);
});

test('Balance Sheet summary retains the exact detail totals and dynamic date default', () => {
  const report=balance.getBalanceSheet({...bsOptions,summary:true},[{period,accounts:bs}],prior,4);
  assert.equal(line(report,'total-assets'),950);
  assert.equal(line(report,'total-le'),950);
  assert.equal(balance.parseBalanceSheetParams({},'2027-04-02').asOf,'2027-04-02');
});

test('Impossible calendar dates are rejected; malformed monetary values fail rather than becoming zero', () => {
  assert.equal(dates.cleanDate('2026-02-31','2026-11-03'),'2026-11-03');
  assert.equal(dates.cleanDate('2024-02-29','2026-11-03'),'2024-02-29');
  assert.throws(()=>utils.cents('not-a-number'),/precision/);
  assert.throws(()=>utils.cents('9007199254740991'),/precision/);
});

test('Prior earnings already closed into an equity account are not counted twice', () => {
  const closed=bs.filter(item=>!['revenue','expense'].includes(item.account_type));
  closed.push(row('313.100','equity','retained_earnings',0,60),row('004.001','revenue','sales',0,40));
  const report=balance.getBalanceSheet(bsOptions,[{period,accounts:closed}],[],5);
  assert.equal(line(report,'prior-earnings'),0);
  assert.equal(line(report,'current-earnings'),40);
  assert.equal(line(report,'total-le'),950);
  assert.ok(report.checks[0].ok);
});

test('A date range with no posted activity produces real zero totals', () => {
  const empty=pl.map(item=>({...item,total_debit:'0.00',total_credit:'0.00'}));
  const report=income.getIncomeStatement(incomeOptions,[{period,accounts:empty}],0);
  assert.equal(line(report,'net-income'),0);
  assert.match(report.checks[0].detail,/0 in this range/);
});
