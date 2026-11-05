const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const moduleSource = ts.transpileModule(fs.readFileSync(path.join(__dirname, 'report-data-client.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function client(fetch, now = () => 0) {
  const module = { exports: {} };
  new Function('module', 'exports', 'fetch', 'Date', moduleSource)(module, module.exports, fetch, { now });
  return module.exports;
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const ok = data => ({ ok: true, json: async () => data });

function providerHarness(api, { userId, onAuthStateChange = () => ({ data: { subscription: { unsubscribe() {} } } }) } = {}) {
  const effects = [], redirects = [];
  let context;
  const React = require('react');
  const hooks = {
    ...React,
    useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}],
    useRef: initial => ({ current: initial }),
    useCallback: callback => callback,
    useMemo: callback => callback(),
    useEffect: callback => effects.push(callback),
    useContext: () => context,
  };
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../../components/ReportData.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'window', source)(name => name === 'react' ? hooks : name.endsWith('/report-data-client') ? api : name.endsWith('/supabase/client') ? { createClient: () => ({ auth: { onAuthStateChange } }) } : require(name), module, module.exports, { location: { assign: url => redirects.push(url) } });
  context = module.exports.ReportDataProvider({ children: null, userId }).props.value;
  return { query: module.exports.useReportQuery, context, effects, redirects };
}

test('Concurrent queries share one authenticated no-store request and balance the activity counter', async () => {
  const response = deferred(), calls = [], activity = [];
  const api = client((...args) => { calls.push(args); return response.promise; });
  const cache = new Map(), url = '/api/reports/data?report=income-statement';
  const first = api.readReport(cache, url, delta => activity.push(delta));
  const second = api.readReport(cache, url, delta => activity.push(delta));
  assert.equal(first, second);
  assert.deepEqual(activity, [1]);
  assert.deepEqual(calls, [[url, { cache: 'no-store', credentials: 'same-origin', headers: { Accept: 'application/json' } }]]);
  response.resolve(ok({ total: 12.34 }));
  assert.deepEqual(await first, { total: 12.34 });
  assert.deepEqual(activity, [1, -1]);
  assert.deepEqual(api.cachedReport(cache, url), { total: 12.34 });
  await api.readReport(cache, url);
  assert.equal(calls.length, 1);
});

test('Ready data expires at five minutes and is fetched again', async () => {
  let now = 0, requests = 0;
  const api = client(async () => ok(++requests), () => now), cache = new Map();
  await api.readReport(cache, '/api/reports/data');
  now = 299999;
  assert.equal(api.cachedReport(cache, '/api/reports/data'), 1);
  now = 300000;
  assert.equal(api.cachedReport(cache, '/api/reports/data'), undefined);
  assert.equal(await api.readReport(cache, '/api/reports/data'), 2);
});

test('HTTP and network failures are not cached; HTTP errors retain their status', async () => {
  const activity = [];
  let requests = 0;
  const api = client(async () => {
    requests++;
    if (requests === 1) return { ok: false, status: 403 };
    if (requests === 2) throw new Error('Offline');
    return ok({ allowed: true });
  }), cache = new Map();
  await assert.rejects(api.readReport(cache, '/api/reports/data', delta => activity.push(delta)), error => error instanceof api.ReportRequestError && error.status === 403);
  assert.equal(cache.size, 0);
  await assert.rejects(api.readReport(cache, '/api/reports/data', delta => activity.push(delta)), /Offline/);
  assert.equal(cache.size, 0);
  assert.deepEqual(await api.readReport(cache, '/api/reports/data', delta => activity.push(delta)), { allowed: true });
  assert.deepEqual(activity, [1, -1, 1, -1, 1, -1]);
});

test('Clearing the cache invalidates an old in-flight response without replacing a newer result', async () => {
  const old = deferred(), fresh = deferred();
  let requests = 0;
  const api = client(() => ++requests === 1 ? old.promise : fresh.promise), cache = new Map();
  const first = api.readReport(cache, '/api/reports/data');
  cache.clear();
  const second = api.readReport(cache, '/api/reports/data');
  fresh.resolve(ok('new'));
  await second;
  old.resolve(ok('old'));
  assert.equal(await first, 'old');
  assert.equal(api.cachedReport(cache, '/api/reports/data'), 'new');
});

test('An invalidated failure does not remove the replacement request', async () => {
  const old = deferred(), fresh = deferred();
  let requests = 0;
  const api = client(() => ++requests === 1 ? old.promise : fresh.promise), cache = new Map();
  const first = api.readReport(cache, '/api/reports/data');
  cache.clear();
  const second = api.readReport(cache, '/api/reports/data');
  old.reject(new Error('Old failure'));
  await assert.rejects(first, /Old failure/);
  assert.equal(api.readReport(cache, '/api/reports/data'), second);
  fresh.resolve(ok('new'));
  await second;
});

test('The provider cache retains at most 32 ready responses without evicting pending work', async () => {
  const pending = deferred();
  const api = client(url => url === '/pending' ? pending.promise : Promise.resolve(ok(url))), cache = new Map();
  const request = api.readReport(cache, '/pending');
  for (let index = 0; index < 33; index++) await api.readReport(cache, `/${index}`);
  assert.equal(cache.size, 33);
  assert.equal(api.cachedReport(cache, '/0'), undefined);
  assert.equal(cache.get('/pending').status, 'pending');
  pending.resolve(ok('done'));
  await request;
  assert.equal(cache.size, 32);
});

test('Replaying provider and query effects in StrictMode keeps the same in-flight request', async () => {
  const pending = deferred();
  let requests = 0;
  const api = client(() => { requests++; return pending.promise; });
  const { context, effects, query } = providerHarness(api);
  query('/api/reports/data');
  const cleanups = effects.map(effect => effect());
  cleanups.forEach(cleanup => cleanup?.());
  effects.forEach(effect => effect());
  assert.equal(requests, 1);
  pending.resolve(ok({ total: 10 }));
  await context.read('/api/reports/data');
  assert.deepEqual(api.cachedReport(context.cache, '/api/reports/data'), { total: 10 });
});

test('Auth sign-out and account changes clear private financial data and redirect', async () => {
  for (const userId of ['user-a', undefined]) {
    let emit, unsubscribed = 0;
    const api = client(async () => ok({ total: 10 }));
    const { context, effects, redirects } = providerHarness(api, {
      userId,
      onAuthStateChange: callback => { emit = callback; return { data: { subscription: { unsubscribe: () => unsubscribed++ } } }; },
    });
    await context.read('/api/reports/data');
    const cleanups = effects.map(effect => effect());
    emit('INITIAL_SESSION', { user: { id: 'user-a' } });
    emit('SIGNED_IN', { user: { id: 'user-a' } });
    emit('TOKEN_REFRESHED', { user: { id: 'user-a' } });
    assert.deepEqual(redirects, []);
    assert.equal(context.cache.size, 1);
    emit('SIGNED_IN', { user: { id: 'user-b' } });
    assert.equal(context.cache.size, 0);
    assert.deepEqual(redirects, ['/']);
    await context.read('/api/reports/data');
    emit('SIGNED_OUT', null);
    assert.equal(context.cache.size, 0);
    assert.deepEqual(redirects, ['/', '/']);
    await context.read('/api/reports/data');
    cleanups.forEach(cleanup => cleanup?.());
    assert.equal(unsubscribed, 1);
    assert.equal(context.cache.size, 1, 'subscription cleanup does not invalidate the private Map');
  }
});
