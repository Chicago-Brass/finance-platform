const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const test = require('node:test');
const moduleValue = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync(__dirname + '/format.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(moduleValue, moduleValue.exports);
test('Live report display and Excel formats retain cents and distinguish missing from zero', () => {
  const { formatAmount } = moduleValue.exports;
  assert.equal(formatAmount(1234.56, true), '$1,234.56');
  assert.equal(formatAmount(-12.34, true), '($12.34)');
  assert.equal(formatAmount(0), '$0.00');
  assert.equal(formatAmount(null), '');
  assert.ok(fs.readFileSync(__dirname + '/reports/export-excel.ts', 'utf8').includes('#,##0.00;(#,##0.00)'));
});
