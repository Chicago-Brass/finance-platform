const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');

function load(file, cache = new Map()) {
  file = path.resolve(__dirname, file);
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = specifier => specifier.startsWith('@/') ? load(path.join(root, specifier.slice(2)) + '.ts', cache) : specifier.startsWith('.') ? load(path.resolve(path.dirname(file), specifier + '.ts'), cache) : require(specifier);
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  cache.set(file, module.exports);
  return module.exports;
}

const drill = load('account-activity.ts');
const row = (id, date, entry, debit, credit, offset = '112.300', extra = {}) => ({ line_id: id, date, entry_number: entry, line_no: 1, account_number: '614.200', account_name: 'Shipping', offsetting_account_number: offset, offsetting_account_name: offset === '112.300' ? 'Operating bank' : 'Card clearing', offset_is_split: false, notes: null, audit_link: null, debit, credit, ...extra });
const activity = (lines, extra = {}) => ({ mode: 'period', from: '2026-01-01', to: '2026-03-15', account: { code: '614.200', name: 'Shipping', normalBalance: 'debit' }, debit: lines.reduce((s, l) => s + l.debit, 0), credit: lines.reduce((s, l) => s + l.credit, 0), lines, truncated: false, opening: null, previous: { from: '2025-01-01', to: '2025-03-15', net: 10000 }, ...extra });

test('Ledger rows become cent lines; split offsets carry no single account', () => {
  const line = drill.toActivityLine(row('a', '2026-01-05', 7, '12.34', '0'));
  assert.equal(line.debit, 1234);
  assert.equal(line.credit, 0);
  assert.equal(line.offsetCode, '112.300');
  const split = drill.toActivityLine(row('b', '2026-01-05', 8, '0', '5.10', '211.100', { offset_is_split: true }));
  assert.equal(split.offsetCode, null);
  assert.equal(drill.offsetLabel(split), 'Split / multiple accounts');
  assert.equal(drill.offsetKey(split), 'split');
});

test('Natural amounts follow the normal balance', () => {
  assert.equal(drill.naturalNet(500, 200, 'debit'), 300);
  assert.equal(drill.naturalNet(500, 200, 'credit'), -300);
});

test('Date helpers cross month, year and leap-day boundaries', () => {
  assert.equal(drill.dayBefore('2026-01-01'), '2025-12-31');
  assert.equal(drill.dayBefore('2024-03-01'), '2024-02-29');
  assert.equal(drill.shiftYears('2024-02-29', -1), '2023-02-28');
  assert.equal(drill.shiftYears('2026-11-04', -1), '2025-11-04');
  assert.deepEqual(drill.rangeMonths('2025-11-20', '2026-02-01').map(m => m.key), ['2025-11', '2025-12', '2026-01', '2026-02']);
  assert.deepEqual(drill.rangeMonths('2026-03-01', '2026-02-01'), []);
});

test('Summary keeps every month, groups offsets and ties lines to totals', () => {
  const lines = [row('a', '2026-01-05', 1, '100.00', '0'), row('b', '2026-01-20', 2, '50.25', '0', '231.100'), row('c', '2026-03-02', 3, '0', '20.00')].map(drill.toActivityLine);
  const summary = drill.summarizeActivity(activity(lines));
  assert.equal(summary.net, 13025);
  assert.deepEqual(summary.months.map(m => [m.key, m.net]), [['2026-01', 15025], ['2026-02', 0], ['2026-03', -2000]]);
  assert.deepEqual(summary.offsets.map(o => [o.key, o.net]), [['112.300', 8000], ['231.100', 5025]]);
  assert.equal(summary.debitLines, 2);
  assert.equal(summary.creditLines, 1);
  assert.equal(summary.averagePerMonth, 4342);
  assert.equal(summary.change.difference, 3025);
  assert.equal(summary.change.percent, 0.3025);
  assert.equal(summary.tiesToTotals, true);
  assert.equal(summary.closing, null);
});

test('Summary flags lists that do not cover the totals, and balance mode rolls forward', () => {
  const lines = [row('a', '2026-01-05', 1, '100.00', '0')].map(drill.toActivityLine);
  assert.equal(drill.summarizeActivity(activity(lines, { debit: 20000 })).tiesToTotals, false);
  assert.equal(drill.summarizeActivity(activity(lines, { truncated: true })).tiesToTotals, false);
  const balance = drill.summarizeActivity(activity(lines, { mode: 'balance', opening: 50000, previous: null }));
  assert.equal(balance.closing, 60000);
  assert.equal(balance.change, null);
  const zeroPrior = drill.summarizeActivity(activity(lines, { previous: { from: '2025-01-01', to: '2025-03-15', net: 0 } }));
  assert.equal(zeroPrior.change.percent, null);
});

test('Line filters combine search, month, offset and side', () => {
  const lines = [row('a', '2026-01-05', 11, '100.00', '0'), row('b', '2026-01-20', 12, '50.25', '0', '231.100', { notes: 'Weekly pickup' }), row('c', '2026-03-02', 13, '0', '20.00')].map(drill.toActivityLine);
  const f = patch => drill.filterActivityLines(lines, { ...drill.NO_ACTIVITY_FILTERS, ...patch }).map(l => l.id);
  assert.deepEqual(f({}), ['a', 'b', 'c']);
  assert.deepEqual(f({ query: 'pickup' }), ['b']);
  assert.deepEqual(f({ query: '13' }), ['c']);
  assert.deepEqual(f({ query: 'card clearing' }), ['b']);
  assert.deepEqual(f({ month: '2026-01' }), ['a', 'b']);
  assert.deepEqual(f({ offset: '112.300' }), ['a', 'c']);
  assert.deepEqual(f({ side: 'credit' }), ['c']);
  assert.deepEqual(f({ month: '2026-01', side: 'debit', offset: '231.100' }), ['b']);
  assert.equal(drill.activityFiltered(drill.NO_ACTIVITY_FILTERS), false);
  assert.equal(drill.activityFiltered({ ...drill.NO_ACTIVITY_FILTERS, side: 'debit' }), true);
  assert.deepEqual(drill.lineTotals(lines), { debit: 15025, credit: 2000 });
});
