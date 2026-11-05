const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');

function sidebar() {
  const values = [];
  let cursor = 0;
  const hooks = { ...React, useId: () => 'analytics', useRef: () => ({ current: [] }), useState(initial) {
    const index = cursor++;
    if (!(index in values)) values[index] = initial;
    return [values[index], value => { values[index] = value; }];
  } };
  const module = { exports: {} };
  const source = fs.readFileSync(`${__dirname}/ReportAnalytics.tsx`, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name === 'react') return hooks;
    if (name.endsWith('.css')) return {};
    if (name === '@/lib/format') return { formatReportAmount: String };
    if (name === './ReportIcons') return { ReportIcon: () => null };
    return require(name);
  }, module, module.exports);
  return analytics => { cursor = 0; return module.exports.ReportAnalytics({ analytics }); };
}

function find(node, predicate) {
  if (!React.isValidElement(node)) return;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props.children)) {
    const match = find(child, predicate);
    if (match) return match;
  }
}

for (const kind of ['income', 'balance']) test(`${kind} analytics collapse hides content and restores the selected tab`, () => {
  const render = sidebar();
  const data = { kind, headline: {}, composition: {}, secondary: {}, movement: { metrics: [] } };
  let tree = render(data);
  const toggle = () => find(tree, node => node.props.className === 'analytics-toggle');
  assert.equal(toggle().props['aria-expanded'], true);
  assert.equal(toggle().props['aria-label'], 'Hide analytics');
  assert.equal(toggle().props.type, 'button');
  assert.equal(toggle().props['aria-controls'], find(tree, node => node.props.className === 'analytics-content').props.id);
  find(tree, node => node.props.role === 'tab' && node.props.children === 'Movement').props.onClick();
  tree = render(data);
  toggle().props.onClick();
  tree = render(data);
  assert.match(tree.props.className, /is-collapsed/);
  assert.equal(toggle().props['aria-expanded'], false);
  assert.equal(toggle().props['aria-label'], 'Expand analytics');
  assert.equal(find(tree, node => node.props.className === 'analytics-content').props.hidden, true);
  toggle().props.onClick();
  tree = render(data);
  assert.doesNotMatch(tree.props.className, /is-collapsed/);
  assert.equal(find(tree, node => node.props.className === 'analytics-content').props.hidden, false);
  assert.equal(find(tree, node => node.props.role === 'tab' && node.props.children === 'Movement').props['aria-selected'], true);
});

for (const kind of ['income', 'balance']) test(`${kind} movement identifies its comparison and explains negative-baseline percentages`, () => {
  const render = sidebar();
  const data = { kind, headline: {}, composition: {}, secondary: {}, movement: { comparisonLabel: 'Compared with Sep 30, 2026', metrics: [{ label: 'Net income', value: 25, previous: -100 }] } };
  const tree = render(data);
  const panel = find(tree, node => node.props.id === 'analytics-movement-panel');
  assert.equal(find(panel, node => node.type === 'h2').props.children, kind === 'balance' ? 'Movement since quarter-end' : 'Period movement');
  assert.equal(find(panel, node => node.props.title === 'Change divided by the absolute previous balance.').props.children.join(''), '(+125.0%)');
});
