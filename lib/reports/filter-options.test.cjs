const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const moduleOutput = { exports: {} };
const source = ts.transpileModule(fs.readFileSync(__dirname + '/filter-options.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
new Function('require', 'module', 'exports', source)(specifier => {
  assert.equal(specifier, '../dates');
  return { todayChicago: () => '2026-11-03' };
}, moduleOutput, moduleOutput.exports);
const { incomeDatePresets, balanceDatePresets, reportHref } = moduleOutput.exports;

test('Income presets cross January into the previous year and cover full calendar quarters', () => {
  assert.deepEqual(incomeDatePresets('2026-01-15'), [
    { label: 'Year to date', year: 2026, from: 1, to: 1 },
    { label: 'This quarter', year: 2026, from: 1, to: 3 },
    { label: 'Last quarter', year: 2025, from: 10, to: 12 },
  ]);
  assert.deepEqual(incomeDatePresets('2026-11-03')[1], { label: 'This quarter', year: 2026, from: 10, to: 12 });
});

test('Balance Sheet presets use completed calendar boundaries, including leap years', () => {
  assert.deepEqual(balanceDatePresets('2026-01-15'), [
    { label: 'Today', asOf: '2026-01-15' },
    { label: 'Last month-end', asOf: '2025-12-31' },
    { label: 'Last quarter-end', asOf: '2025-12-31' },
  ]);
  assert.equal(balanceDatePresets('2024-03-01')[1].asOf, '2024-02-29');
  assert.equal(balanceDatePresets('2026-04-01')[2].asOf, '2026-03-31');
});

test('View and date links retain the other selected GET options', () => {
  const params = new URLSearchParams(reportHref({ year: '2025', from: '2', to: '7', grain: 'quarter', layout: 'summary' }, { grain: 'month' }).slice(1));
  assert.deepEqual(Object.fromEntries(params), { year: '2025', from: '2', to: '7', grain: 'month', layout: 'summary' });
  assert.equal(new URLSearchParams(reportHref({ asof: '2026-09-30', grain: 'quarter', layout: 'detail' }, { layout: 'summary' }).slice(1)).get('asof'), '2026-09-30');
});
