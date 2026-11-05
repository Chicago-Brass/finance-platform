const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function navigation(pending = true) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, 'ReportNavigation.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const mocks = {
    react: { ...React, useContext: () => ({ pending, destination: '/balance-sheet', refresh() {} }) },
    'next/navigation': { usePathname: () => '/income-statement' },
    'next/link': { default: () => null },
    './ReportIcons': { ReportIcon: () => null },
  };
  new Function('require', 'module', 'exports', code)(name => mocks[name] ?? require(name), module, module.exports);
  return module.exports;
}

test('Navigation leaves controls accessible and limits pending hiding to the data region', () => {
  const ui = navigation();
  const controls = renderToStaticMarkup(React.createElement(ui.ReportContent, null, React.createElement('button', null, 'Filter')));
  assert.match(controls, /<button>Filter<\/button>/);
  assert.doesNotMatch(controls, /inert=|aria-hidden="true"|report-loading-overlay/);
  const data = renderToStaticMarkup(React.createElement(ui.ReportDataRegion, { analytics: true }, React.createElement('table')));
  assert.match(data, /inert=""/);
  assert.match(data, /report-data-pending/);
  assert.match(data, /has-analytics/);
  assert.match(data, /Loading analytics/);
});

test('A rejected statement preserves sidebar geometry, offers retry and resets for a new data promise', () => {
  const ui = navigation(false);
  const element = ui.ReportDataBoundary({ resetKey: 'first', analytics: true, children: React.createElement('table') });
  const instance = new element.type(element.props);
  instance.state = { ...instance.state, ...element.type.getDerivedStateFromError() };
  const markup = renderToStaticMarkup(instance.render());
  assert.match(markup, /has-analytics/);
  assert.match(markup, /Analytics unavailable/);
  assert.match(markup, /Try again/);
  assert.deepEqual(element.type.getDerivedStateFromProps({ resetKey: 'next' }, instance.state), { failed: false, resetKey: 'next' });
  const fallback = React.createElement('button', { disabled: true }, 'Export');
  const exports = ui.ReportDataBoundary({ resetKey: 'first', fallback, children: null });
  const failed = new exports.type(exports.props);
  failed.state = { ...failed.state, ...exports.type.getDerivedStateFromError() };
  assert.equal(renderToStaticMarkup(failed.render()), '<button disabled="">Export</button>');
});
