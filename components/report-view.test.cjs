const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(file) {
  if (!path.extname(file)) file += fs.existsSync(file + '.tsx') ? '.tsx' : '.ts';
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const localRequire = specifier => specifier.endsWith(".css") ? {} : specifier.startsWith('@/') ? load(path.join(root, specifier.slice(2))) : specifier.startsWith('.') ? load(path.resolve(path.dirname(file), specifier)) : require(specifier);
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  cache.set(file, module.exports);
  return module.exports;
}
const view = load(path.join(__dirname, 'ReportView.tsx'));
const analytics = load(path.join(__dirname, 'ReportAnalytics.tsx'));
const drawer = load(path.join(__dirname, 'AccountDrawer.tsx'));
const workspace = load(path.join(__dirname, 'StatementWorkspace.tsx'));
const display = patch => ({ query: '', hideZero: false, collapsed: new Set(), setQuery() {}, setHideZero() {}, setCollapsed() {}, ...patch });
const format = load(path.join(root, 'lib/format.ts'));
const line = (id, kind, depth, values = {}, accountCode) => ({ id, label: id, kind, depth, values, accountCode });
const lines = [
  line('Revenue', 'section', 0), line('Zero', 'account', 1, {a:0,b:0}, '004.001'),
  line('Unavailable', 'account', 1, {a:null,b:null}, '004.002'), line('Returns', 'account', 1, {a:-12.34,b:0}, '004.006'),
  line('Revenue total', 'subtotal', 0, {a:-12.34,b:0}), line('Operating expenses', 'section', 0),
  line('Personnel', 'section', 1), line('Salary', 'account', 2, {a:25,b:30}, '005.002'),
  line('Personnel total', 'subtotal', 1, {a:25,b:30}), line('Net income', 'grandTotal', 0, {a:-37.34,b:-30}),
];

test('Account drawer opens its header immediately with separate loading areas and no false zero amounts', () => {
  const markup = renderToStaticMarkup(React.createElement(drawer.AccountDrawer, {
    target: { code: '112.100', label: 'Operating bank' }, range: { mode: 'period', from: '2026-01-01', to: '2026-11-05' },
    cache: new Map(), onSelect: () => {}, onClose: () => {},
  }));
  assert.match(markup, /Operating bank/);
  assert.match(markup, /Loading account totals/);
  assert.match(markup, /Loading ledger lines/);
  assert.match(markup, /aria-label="Account summary"[^>]*aria-busy="true"/);
  assert.doesNotMatch(markup, /No posted lines|\$0\.00/);
});

test('Account filters preserve derived totals, missing values and nonzero periods', () => {
  const filtered = view.filterReportLines(lines, '', true);
  assert.ok(!filtered.some(item => item.id === 'Zero'));
  assert.ok(filtered.some(item => item.id === 'Unavailable'));
  assert.ok(filtered.some(item => item.id === 'Returns'));
  assert.equal(filtered.at(-1), lines.at(-1));
  assert.deepEqual(filtered.at(-1).values, {a:-37.34,b:-30});
  const codeMatch = view.filterReportLines(lines, ' 004.006 ', false);
  assert.deepEqual(codeMatch.filter(item => item.accountCode).map(item => item.id), ['Returns']);
  assert.ok(codeMatch.some(item => item.id === 'Revenue total'));
});

test('Collapse hides descendants but retains same-level financial totals', () => {
  assert.deepEqual([...view.collapsibleIds(lines)], ['Revenue','Operating expenses','Personnel']);
  assert.deepEqual(view.visibleLines(lines,new Set(['Revenue','Operating expenses'])).map(item=>item.id), ['Revenue','Revenue total','Operating expenses','Net income']);
  assert.equal(view.visibleLines(lines,new Set()).length, lines.length);
});

test('Report formatting shows cents, explicit zero, negative parentheses and missing values', () => {
  assert.equal(format.formatReportAmount(0), '$0.00');
  assert.equal(format.formatReportAmount(-0), '$0.00');
  assert.equal(format.formatReportAmount(0.72), '$0.72');
  assert.equal(format.formatReportAmount(-43.16), '($43.16)');
  assert.equal(format.formatReportAmount(12751.61), '$12,751.61');
  assert.equal(format.formatReportAmount(null), '-');
  assert.equal(format.formatAmount(0.72, true), '$1');
});

test('Report query failures offer a retry without exposing server error details', () => {
  const ReportError = load(path.join(root, 'app/(reports)/error.tsx')).default;
  const markup = renderToStaticMarkup(React.createElement(ReportError, { reset() {}, error: new Error('private server details') }));
  assert.match(markup, /role="alert"/);
  assert.match(markup, /Try again/);
  assert.ok(!markup.includes('private server details'));
});

test('Movement calculates cents accurately and handles zero and negative baselines', () => {
  assert.deepEqual(analytics.changeFromPrevious(0,0), {difference:0,percent:0});
  assert.deepEqual(analytics.changeFromPrevious(0.72,0), {difference:0.72,percent:null});
  const change = analytics.changeFromPrevious(-43.16,-87.45);
  assert.equal(change.difference,44.29);
  assert.ok(Math.abs(change.percent -44.29/87.45)<1e-12);
});

test('Signed/zero composition avoids misleading doughnuts', () => {
  assert.equal(analytics.compositionIsChartable([{value:300},{value:-20}]),false);
  assert.equal(analytics.compositionIsChartable([{value:0}]),false);
  assert.equal(analytics.compositionIsChartable([{value:300},{value:0}]),true);
  assert.equal(analytics.compositionIsChartable([]),false);
});

test('Sidebar renders signed funding and shares over 100% without clipping them into charts', () => {
  const data={kind:'balance',asOf:'Nov 3, 2026',headline:{label:'Total assets',value:26084},composition:{title:'Funding mix',items:[{label:'Liabilities',value:26214.61},{label:'Equity',value:-130.61}]},secondary:{label:'Cash',value:30000,share:30000/26084},movement:{comparisonLabel:'Compared with Sep 30, 2026',metrics:[{label:'Assets',value:26084,previous:0}],trendTitle:'Total assets',trend:[{label:'Nov 3, 2026',value:26084}]}};
  const html=renderToStaticMarkup(React.createElement(analytics.ReportAnalytics,{analytics:data}));
  assert.match(html,/Signed balances are shown below/);
  assert.match(html,/\(\$130\.61\)/);
  assert.match(html,/115\.0%/);
  assert.ok(!html.includes('class="analytics-donut"'));
  assert.ok(!html.includes('class="analytics-share-track"'));
  assert.match(html,/One period in this view/);
  assert.match(html,/role="tablist"/);
  assert.match(html,/aria-selected="true"/);
  assert.match(html,/N\/A/);
});

test('Drill-down targets follow report order and name each account section', () => {
  const report = { title: 'Income Statement', entity: 'Chicago Brass', periodLabel: '2026', basis: 'Accrual', isSample: false, columns: [{ key: 'a', label: 'A', kind: 'amount' }], lines, checks: [] };
  assert.deepEqual(view.drillTargets(report), [
    { code: '004.001', label: 'Zero', context: 'Income Statement · Revenue' },
    { code: '004.002', label: 'Unavailable', context: 'Income Statement · Revenue' },
    { code: '004.006', label: 'Returns', context: 'Income Statement · Revenue' },
    { code: '005.002', label: 'Salary', context: 'Income Statement · Personnel' },
  ]);
  const plain = renderToStaticMarkup(React.createElement(view.ReportView, { report, display: display() }));
  assert.doesNotMatch(plain, /drill-trigger/);
  const drill = renderToStaticMarkup(React.createElement(view.ReportView, { report, display: display(), drill: { mode: 'period', from: '2026-01-01', to: '2026-12-31' } }));
  assert.equal((drill.match(/class="drill-trigger"/g) || []).length, 4);
  assert.match(drill, /title="Open 005\.002 details"/);
  assert.doesNotMatch(drill, /role="dialog"/);
});


test('Statement shells keep header, exports and all controls visible before data resolves', () => {
  const pending = new Promise(() => {});
  const cases = [
    [workspace.IncomeStatementWorkspace, { year: 2026, from: 1, to: 11, grain: 'month', summary: false }, 'Income Statement'],
    [workspace.BalanceSheetWorkspace, { asOf: '2026-11-05', grain: 'single', summary: false }, 'Balance Sheet'],
  ];
  for (const [Component, options, title] of cases) {
    const markup = renderToStaticMarkup(React.createElement(Component, { options, data: pending }));
    assert.match(markup, new RegExp(`>${title}</h1>`));
    assert.match(markup, /dashboard-control-bar statement-control-bar/);
    assert.match(markup, /aria-label="Report columns"/);
    assert.match(markup, /aria-label="Report detail"/);
    assert.match(markup, /placeholder="Search accounts"/);
    assert.match(markup, /Show zero accounts/);
    assert.match(markup, /Expand all/);
    assert.match(markup, /Collapse all/);
    assert.match(markup, /disabled=""[^>]*>.*Export Excel/);
    assert.match(markup, /Loading report data/);
    assert.doesNotMatch(markup, /statement-toolbar|\$0\.00/);
  }
});

test('Display rows and exported rows use the same account filters and collapse state', () => {
  const report = { lines };
  assert.deepEqual(view.reportRows(report, display({ query: '004.006' })).filter(line => line.accountCode).map(line => line.id), ['Returns']);
  const collapsed = view.reportRows(report, display({ collapsed: 'all' }));
  assert.deepEqual(collapsed.map(line => line.id), ['Revenue', 'Revenue total', 'Operating expenses', 'Net income']);
  assert.equal(collapsed.at(-1).values.a, -37.34);
});
