const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const moduleUnderTest = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, 'ledger-table-utils.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
new Function('require', 'module', 'exports', code)(() => ({}), moduleUnderTest, moduleUnderTest.exports);
const { ledgerSearchParam, ledgerSideParam, ledgerHref, ledgerTypeParam, ledgerCategoryParam, ledgerAmountParam } = moduleUnderTest.exports;

test('Ledger search/side parameters normalize trusted URL inputs and survive filter/page links', () => {
  assert.equal(ledgerSearchParam(['  O\'Brien, 25%_fee\\settlement ', 'ignored']), "O'Brien, 25%_fee\\settlement");
  assert.equal(ledgerSearchParam(undefined), '');
  assert.equal(ledgerSearchParam(' '.repeat(3)), '');
  assert.equal(ledgerSearchParam('a'.repeat(300)).length, 200);
  assert.equal(ledgerSideParam(['debit', 'credit']), 'debit');
  for (const value of [undefined, '', 'all', 'DEBIT', "credit' OR true"]) assert.equal(ledgerSideParam(value), 'all');
  const query = "O'Brien, 25%_fee\\settlement";
  const href = ledgerHref({ from: '2026-01-01', to: '2026-07-31', account: '211.100', offset: '112.100', query, side: 'credit', page: 3 });
  assert.deepEqual(Object.fromEntries(new URLSearchParams(href.slice(1))), { from: '2026-01-01', to: '2026-07-31', account: '211.100', offset: '112.100', q: query, side: 'credit', page: '3' });
  assert.deepEqual(Object.fromEntries(new URLSearchParams(ledgerHref({ from: '2025-01-01', to: '2025-12-31', query, side: 'debit' }).slice(1))), { from: '2025-01-01', to: '2025-12-31', q: query, side: 'debit' });
  assert.equal(ledgerHref({ from: '2026-01-01', to: '2026-07-31', query: '', side: 'all' }), '?from=2026-01-01&to=2026-07-31');
});

test('Ledger types, categories and inclusive amount bounds validate and survive URLs, including zero', () => {
  assert.equal(ledgerTypeParam(['expense','asset']),'expense');
  for(const value of ['unknown','toString','constructor','ASSET'])assert.equal(ledgerTypeParam(value),undefined);
  assert.equal(ledgerCategoryParam('PAY-08'),'PAY-08');
  for(const value of ['', 'payment category', "PAY-08' or true", 'x'.repeat(100)])assert.equal(ledgerCategoryParam(value),undefined);
  assert.equal(ledgerAmountParam(' 0 '),0);assert.equal(ledgerAmountParam(['123.45','6']),123.45);
  for(const value of [undefined,'',' ','-1','0.001','1e3','Infinity','NaN','9999999999999999999'])assert.equal(ledgerAmountParam(value),undefined);
  const href=ledgerHref({from:'2026-01-01',to:'2026-07-31',accountType:'expense',category:'PAY-08',min:0,max:123.45,page:2});
  assert.deepEqual(Object.fromEntries(new URLSearchParams(href.slice(1))),{from:'2026-01-01',to:'2026-07-31',type:'expense',category:'PAY-08',min:'0',max:'123.45',page:'2'});
});
