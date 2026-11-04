const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,file),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(require,module,module.exports);
  return module.exports;
}

const tchart=load('t-chart.ts');
const rule=(rule_code,category,debit_accounts,credit_accounts,extra={})=>({rule_code,category,sort_order:1,trigger_name:`Trigger ${rule_code}`,debit_accounts,credit_accounts,reversible:true,airtable_sources:null,when_to_post:null,fin_notes:null,audit_trail:null,...extra});
const rules=[
  rule('EXP-01','expense','By Vendor (e.g., Utilities 006.002)','AP (211.100)'),
  rule('PAY-07','payment','AP (211.100)','Bank (Nickel/Fifth Third)',{when_to_post:'When the vendor payment is sent.'}),
  rule('PAY-19','payment','Bank – Nickel (112.300) [receiving account]','Bank (Nickel/Fifth Third) [sending account]'),
  rule('INV-01','invoice_entry','Customer Deposits (221.100) or AR (121.100)','Revenue (004.001) • Freight Charged to Clients (004.003)'),
];

test('Posting rule account text links only exact single-account references',()=>{
  assert.deepEqual(tchart.ruleAccounts('AP (211.100)'),[{text:'AP (211.100)',name:'AP',code:'211.100',note:undefined}]);
  assert.deepEqual(tchart.ruleAccounts('Bank – Nickel (112.300) [receiving account]')[0],{text:'Bank – Nickel (112.300) [receiving account]',name:'Bank – Nickel',code:'112.300',note:'receiving account'});
  assert.deepEqual(tchart.ruleAccounts('Revenue (004.001) • Freight Charged to Clients (004.003)').map(part=>part.code),['004.001','004.003']);
  for(const text of ['Customer Deposits (221.100) or AR (121.100)','By Vendor (e.g., Utilities 006.002)','Bank (Nickel/Fifth Third)','Staff expense by Employment Type (005.101 Offshore / 005.003 1099)'])
    assert.deepEqual(tchart.ruleAccounts(text),[{text}]);
  assert.deepEqual(tchart.ruleAccounts('Accrued 401(k) (241.400)')[0].name,'Accrued 401(k)');
  assert.deepEqual(tchart.ruleAccounts(null),[]);
  assert.deepEqual(tchart.ruleAccounts('  '),[]);
});

test('Posting rules keep catalog category order and filter by category and search text',()=>{
  assert.deepEqual(tchart.groupRules(rules).map(group=>[group.label,group.rules.length]),[['Expenses',1],['Payments',2],['Invoice Entry',1]]);
  assert.equal(tchart.ruleCategoryLabel('unknown_kind'),'unknown_kind');
  assert.deepEqual(tchart.filterRules(rules,'','payment').map(row=>row.rule_code),['PAY-07','PAY-19']);
  assert.deepEqual(tchart.filterRules(rules,' 211.100 ','all').map(row=>row.rule_code),['EXP-01','PAY-07']);
  assert.deepEqual(tchart.filterRules(rules,'vendor payment','all').map(row=>row.rule_code),['PAY-07']);
  assert.deepEqual(tchart.filterRules(rules,'invoice entry','all').map(row=>row.rule_code),['INV-01']);
  assert.deepEqual(tchart.filterRules(rules,'211.100','invoice_entry'),[]);
});
