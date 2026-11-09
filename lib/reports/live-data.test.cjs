const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function fixture({ balancesError = null, countError = null, malformed = false, lines = [] } = {}) {
  const calls = [], cache = new Map();
  const account = (number, type, subtype, debit, credit) => ({ account_number: number, account_name: number, account_type: type, account_subtype: subtype, normal_balance: type === 'revenue' ? 'credit' : 'debit', total_debit: debit, total_credit: credit, balance: 0 });
  const accounts = [account('004.001', 'revenue', 'sales', 0, 100), account('005.002', 'expense', 'payroll', 25, 0), account('112.100', 'asset', 'bank', 75, 0)];
  const client = {
    async rpc(name, args) {
      calls.push({ name, args });
      assert.equal(name, 'get_trial_balances');
      return { error: balancesError, data: args.p_as_of.map((date, index) => ({ period_index: malformed ? 99 : index + 1, accounts: date.startsWith('2025') ? accounts.map(account => ({ ...account, total_debit: 0, total_credit: 0 })) : accounts })) };
    },
    from(table) {
      if (table === 'journal_lines') {
        const filters = [], range = [0, 999];
        const query = {
          select() { return this; }, order() { return this; },
          range(start, end) { range[0] = start; range[1] = end; calls.push({ range: [start, end] }); return this; },
          eq(field, value) { filters.push(['eq', field, value]); calls.push({ branchEq: [field, value] }); return this; },
          is(field, value) { return this.eq(field, value); },
          lte(field, value) { filters.push(['lte', field, value]); return this; },
          gte(field, value) { filters.push(['gte', field, value]); return this; },
          then(resolve, reject) {
            const filtered = lines.filter(line => filters.every(([op, field, value]) => {
              const actual = field.startsWith('journal_entries.') ? line.journal_entries[field.split('.')[1]] : line[field];
              return op === 'eq' ? actual === value : op === 'lte' ? actual <= value : actual >= value;
            }));
            return Promise.resolve({ data: filtered.slice(range[0], range[1] + 1), error: null }).then(resolve, reject);
          },
        };
        return query;
      }
      assert.equal(table, 'v_journal_entries');
      const query = { select(...args) { calls.push({ select: args }); return this; }, eq(...args) { calls.push({ eq: args }); return this; }, lte(...args) { calls.push({ lte: args }); return this; }, gte(...args) { calls.push({ gte: args }); return this; }, then(resolve, reject) { return Promise.resolve({ count: 3, error: countError }).then(resolve, reject); } };
      return query;
    },
  };
  function load(file) {
    file = path.resolve(__dirname, file);
    if (cache.has(file)) return cache.get(file);
    const module = { exports: {} };
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const localRequire = name => name === 'server-only' ? {} : name === '@/lib/supabase/server' ? { createClient: async () => client } : name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name);
    new Function('require', 'module', 'exports', source)(localRequire, module, module.exports);
    cache.set(file, module.exports);
    return module.exports;
  }
  return { api: load('live-data.ts'), calls };
}

test('Income Statement loads selected posted periods and supplies live figures to the old renderer', async () => {
  const f = fixture();
  const report = await f.api.loadIncomeStatement({ year: 2026, from: 1, to: 1, grain: 'month', summary: false });
  assert.deepEqual(f.calls.find(call => call.name).args, { p_as_of: ['2026-01-31'], p_from: ['2026-01-01'] });
  assert.ok(f.calls.some(call => call.eq?.[1] === 'posted'));
  assert.ok(f.calls.some(call => call.gte?.[1] === '2026-01-01'));
  assert.equal(report.lines.find(line => line.id === 'net-income').values.p1, 75);
  assert.equal(report.isSample, false);
  assert.match(report.basis, /Posted ledger actuals/);
});

test('Balance Sheet loads cumulative activity and prior-year earnings without a lower date cutoff', async () => {
  const f = fixture();
  const report = await f.api.loadBalanceSheet({ asOf: '2026-01-31', grain: 'single', summary: false });
  assert.deepEqual(f.calls.find(call => call.name).args, { p_as_of: ['2026-01-31', '2025-12-31'], p_from: [null, null] });
  assert.ok(!f.calls.some(call => call.gte));
  assert.equal(report.lines.find(line => line.id === 'total-assets').values.p0, 75);
  assert.equal(report.lines.find(line => line.id === 'total-le').values.p0, 75);
  assert.equal(report.checks.find(check => check.label === 'Balances').ok, true);
  assert.equal(report.isSample, false);
});

test('Ledger query, count and malformed-response errors do not fall back to workbook figures', async () => {
  for (const overrides of [{ balancesError: { message: 'denied' } }, { countError: { message: 'denied' } }, { malformed: true }]) {
    const f = fixture(overrides);
    await assert.rejects(f.api.loadIncomeStatement({ year: 2026, from: 1, to: 1, grain: 'month', summary: false }), /could not be loaded|unexpected report periods/);
  }
});

const journal = (id, branch, amount, date = '2026-01-10', expense = false) => [
  { id: id + '-a', entry_id: id, account_code: expense ? '005.002' : '112.100', debit: amount, credit: 0, branch, journal_entries: { entry_date: date, status: 'posted' } },
  { id: id + '-b', entry_id: id, account_code: expense ? '112.100' : '004.001', debit: 0, credit: amount, branch, journal_entries: { entry_date: date, status: 'posted' } },
];
const branchLines = [...journal('chicago', 'Chicago', 40), ...journal('minneapolis', 'Minneapolis', 60), ...journal('unknown', null, 25, '2026-01-10', true)];

test('Chicago selection uses only posted Chicago lines rather than consolidated balances', async () => {
  const f = fixture({ lines: [...branchLines, ...journal('draft', 'Chicago', 900).map(line => ({ ...line, journal_entries: { ...line.journal_entries, status: 'draft' } }))] });
  const report = await f.api.loadIncomeStatement({ year: 2026, from: 1, to: 1, grain: 'month', summary: false, view: 'CHI' });
  assert.equal(report.lines.find(line => line.id === 'net-income').values.p1, 40);
  assert.match(report.entity, /Chicago$/);
  assert.ok(f.calls.some(call => call.branchEq?.[0] === 'branch' && call.branchEq[1] === 'Chicago'));
  assert.equal(report.checks.find(check => check.label === 'Posted entries').detail, '1 in this range');
});

test('Side-by-side branches include unassigned activity and reconcile exactly to Consolidated', async () => {
  const f = fixture({ lines: branchLines });
  const report = await f.api.loadIncomeStatement({ year: 2026, from: 1, to: 1, grain: 'month', summary: false, view: 'BY_BRANCH' });
  const values = report.lines.find(line => line.id === 'net-income').values;
  assert.equal(values.CHI, 40); assert.equal(values.MSP, 60); assert.equal(values.UNASSIGNED, -25); assert.equal(values.total, 75);
  for (const row of report.lines.filter(line => line.kind !== 'section')) {
    assert.equal(Math.round(Object.entries(row.values).filter(([key]) => key !== 'total').reduce((sum, [, value]) => sum + value * 100, 0)), Math.round(row.values.total * 100));
  }
});

test('Branch Balance Sheet uses the same branch for assets, prior earnings and current earnings', async () => {
  const f = fixture({ lines: [...branchLines, ...journal('prior', 'Chicago', 5, '2025-12-01')] });
  const report = await f.api.loadBalanceSheet({ asOf: '2026-01-31', grain: 'single', summary: false, view: 'CHI' });
  assert.equal(report.lines.find(line => line.id === 'total-assets').values.p0, 45);
  assert.equal(report.lines.find(line => line.id === 'prior-earnings').values.p0, 5);
  assert.equal(report.lines.find(line => line.id === 'current-earnings').values.p0, 40);
  assert.equal(report.checks.find(check => check.label === 'Balances').ok, true);
});

test('Branch reads paginate past 1000 rows without truncating totals', async () => {
  const lines = Array.from({ length: 1001 }, (_, index) => ({ id: String(index), entry_id: String(index), account_code: '004.001', debit: 0, credit: '0.01', branch: 'Chicago', journal_entries: { entry_date: '2026-01-10', status: 'posted' } }));
  const f = fixture({ lines });
  const report = await f.api.loadIncomeStatement({ year: 2026, from: 1, to: 1, grain: 'month', summary: false, view: 'CHI' });
  assert.equal(report.lines.find(line => line.id === 'net-income').values.p1, 10.01);
  assert.deepEqual(f.calls.filter(call => call.range).map(call => call.range), [[0, 999], [1000, 1999]]);
});
