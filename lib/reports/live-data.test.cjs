const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function fixture({ balancesError = null, countError = null, malformed = false } = {}) {
  const calls = [], cache = new Map();
  const account = (number, type, subtype, debit, credit) => ({ account_number: number, account_name: number, account_type: type, account_subtype: subtype, normal_balance: type === 'revenue' ? 'credit' : 'debit', total_debit: debit, total_credit: credit, balance: 0 });
  const accounts = [account('004.001', 'revenue', 'sales', 0, 100), account('005.002', 'expense', 'payroll', 25, 0), account('112.100', 'asset', 'bank', 75, 0)];
  const client = {
    async rpc(name, args) {
      calls.push({ name, args });
      assert.equal(name, 'get_trial_balances');
      return { error: balancesError, data: args.p_as_of.map((date, index) => ({ period_index: malformed ? 99 : index + 1, accounts: date.startsWith('2025') ? [] : accounts })) };
    },
    from(table) {
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
