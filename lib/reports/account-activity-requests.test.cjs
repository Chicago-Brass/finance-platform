const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
function load(file, mocks = {}, cache = new Map()) {
  file = path.resolve(root, file);
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = name => name in mocks ? mocks[name] : name.startsWith('@/') ? load(`${name.slice(2)}.ts`, mocks, cache) : name.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(file), `${name}.ts`)), mocks, cache) : require(name);
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  cache.set(file, module.exports);
  return module.exports;
}
const input = { account: '112.100', mode: 'period', from: '2026-01-01', to: '2026-11-05' };
const account = (debit, credit) => ({ account_number: '112.100', account_name: 'Operating bank', normal_balance: 'debit', total_debit: debit, total_credit: credit });
const source = 'lib/reports/account-activity-server.ts';

test('Account totals use one batched read, with exact cents and the proper comparison dates', async () => {
  const calls = [];
  const server = load(source, { './ledger': { getTrialBalances: async requests => { calls.push(requests); return [[account('123.45', '2.01')], [account('10.01', '1.00')]]; } } });
  const period = await server.getAccountActivitySummary(input);
  assert.deepEqual(calls[0], [{ asOf: '2026-11-05', from: '2026-01-01' }, { asOf: '2025-11-05', from: '2025-01-01' }]);
  assert.equal(period.debit, 12345); assert.equal(period.credit, 201); assert.equal(period.previous.net, 901); assert.equal(period.opening, null);
  const balance = await server.getAccountActivitySummary({ ...input, mode: 'balance' });
  assert.deepEqual(calls[1][1], { asOf: '2025-12-31', from: null });
  assert.equal(balance.opening, 901); assert.equal(balance.previous, null);
  for (const invalid of [{ account: '112.100 OR true' }, { from: '2026-02-30' }, { to: '2024-01-01' }, { mode: 'other' }, { from: '2000-01-01' }]) assert.throws(() => server.accountActivityInput({ ...input, ...invalid }), RangeError);
  assert.deepEqual(server.accountActivityInput(input), input);
});

test('Drawer lines reduce requests to 500-line pages and preserve the exact 2,000-line cap', async () => {
  let total = 1200, calls = [];
  const server = load(source, { './ledger': { getGeneralLedger: async (from, to, page, filters, size) => {
    calls.push({ page, size, filters });
    const start = (page - 1) * size;
    return { rows: Array.from({ length: Math.max(0, Math.min(size, total - start)) }, (_, index) => ({ line_id: String(start + index), date: from, entry_number: start + index, line_no: 1, debit: '1.23', credit: '0.00' })), hasNext: total > start + size };
  } } });
  let result = await server.getAccountActivityLines(input);
  assert.equal(result.lines.length, 1200); assert.equal(result.truncated, false); assert.equal(calls.length, 3); assert.equal(result.lines[0].debit, 123);
  assert.ok(calls.every(call => call.size === 500 && call.filters.account === input.account));
  for (const count of [2000, 2001, 0]) {
    total = count; calls = []; result = await server.getAccountActivityLines(input);
    assert.equal(result.lines.length, Math.min(count, 2000)); assert.equal(result.truncated, count > 2000); assert.ok(calls.length <= 4);
  }
});

test('Summary and lines start independently; only successful, non-aborted data is cached per report', async () => {
  const { readAccountActivity } = load('lib/reports/account-activity-client.ts');
  const previousFetch = global.fetch, pending = [], cache = new Map(), controller = new AbortController();
  global.fetch = (url, options) => new Promise(resolve => pending.push({ url, options, resolve }));
  try {
    const summary = readAccountActivity(cache, input, 'summary', controller.signal);
    const lines = readAccountActivity(cache, input, 'lines', controller.signal);
    assert.equal(pending.length, 2, 'both requests have started before either completes');
    assert.ok(pending.every(call => call.options.cache === 'no-store' && call.options.signal === controller.signal));
    pending[1].resolve(Response.json({ lines: [], truncated: false }));
    assert.deepEqual(await lines, { lines: [], truncated: false });
    assert.equal(cache.size, 1, 'lines are usable while totals are pending');
    pending[0].resolve(Response.json({ debit: 12345 }));
    assert.deepEqual(await summary, { debit: 12345 });
    assert.deepEqual(await readAccountActivity(cache, input, 'summary', controller.signal), { debit: 12345 });
    assert.equal(pending.length, 2, 'reopening the same report account uses memory, with no request');
    const failed = readAccountActivity(cache, { ...input, account: '112.200' }, 'summary', controller.signal);
    pending[2].resolve(Response.json({ error: 'failed' }, { status: 503 }));
    await assert.rejects(() => failed); assert.equal(cache.size, 2);
    const aborted = new AbortController();
    const stale = readAccountActivity(cache, { ...input, account: '112.300' }, 'summary', aborted.signal);
    aborted.abort(); pending[3].resolve(Response.json({ debit: 999 })); await stale;
    assert.equal(cache.size, 2, 'an abandoned account cannot populate the report cache');
    const freshReport = new Map();
    const refreshed = readAccountActivity(freshReport, input, 'summary', controller.signal);
    pending[4].resolve(Response.json({ debit: 222 })); assert.deepEqual(await refreshed, { debit: 222 });
  } finally { global.fetch = previousFetch; }
});

test('The GET boundary authenticates before reads, rejects bad input and hides database details', async () => {
  let signedIn = true, failed = false, calls = [];
  const server = load(source, { './ledger': {} });
  const { GET } = load('app/api/reports/account-activity/route.ts', {
    '@/lib/reports/report-session': { reportUser: async () => { if (!signedIn) throw new Error('signed out'); return { id: 'test' }; } },
    '@/lib/reports/account-activity-server': { ...server, getAccountActivitySummary: async value => { calls.push('summary'); if (failed) throw new Error('private connection details'); return { ...value, debit: 123 }; }, getAccountActivityLines: async () => { calls.push('lines'); return { lines: [], truncated: false }; } },
  });
  const request = patch => new Request(`http://localhost/api/reports/account-activity?${new URLSearchParams({ ...input, section: 'summary', ...patch })}`);
  signedIn = false; assert.equal((await GET(request())).status, 401); assert.deepEqual(calls, []);
  signedIn = true;
  assert.equal((await GET(request({ section: 'bad' }))).status, 400);
  assert.equal((await GET(request({ from: 'invalid' }))).status, 400); assert.deepEqual(calls, []);
  const summary = await GET(request()); assert.equal(summary.status, 200); assert.equal(summary.headers.get('cache-control'), 'private, no-store'); assert.equal((await summary.json()).debit, 123);
  const lines = await GET(request({ section: 'lines' })); assert.equal(lines.status, 200); assert.deepEqual(calls, ['summary', 'lines']);
  failed = true; const error = await GET(request()); assert.equal(error.status, 503); assert.doesNotMatch(await error.text(), /private connection/);
});
