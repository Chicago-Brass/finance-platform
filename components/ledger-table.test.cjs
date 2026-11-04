const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const root = path.resolve(__dirname,'..');
const cache = new Map();
const navigation = {
  ReportLink: ({children,...props})=>React.createElement('a',props,children),
  ReportForm: ({children,...props})=>React.createElement('form',{...props,method:'get'},children),
};
function load(file) {
  if (file.endsWith('.css')) return {};
  if (!path.extname(file)) file += fs.existsSync(file+'.tsx')?'.tsx':'.ts';
  if (cache.has(file)) return cache.get(file);
  const module={exports:{}};
  const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const localRequire=specifier=>specifier.endsWith('ReportNavigation')?navigation:specifier.startsWith('@/')?load(path.join(root,specifier.slice(2))):specifier.startsWith('.')?load(path.resolve(path.dirname(file),specifier)):require(specifier);
  new Function('require','module','exports',source)(localRequire,module,module.exports);cache.set(file,module.exports);return module.exports;
}
const utils=load(path.join(__dirname,'ledger-table-utils.ts'));
const tables=load(path.join(__dirname,'LedgerTable.tsx'));
const dateFilter=load(path.join(__dirname,'DateFilter.tsx'));
const trial=[
  {account_number:'112.300',account_name:'Bank - Nickel',account_type:'asset',account_subtype:'bank',normal_balance:'debit',total_debit:'25.10',total_credit:'0.00',balance:'25.10'},
  {account_number:'211.100',account_name:'Accounts Payable',account_type:'liability',account_subtype:'payable',normal_balance:'credit',total_debit:'0.00',total_credit:'25.10',balance:'25.10'},
  {account_number:'121.100',account_name:'Settled receivable',account_type:'asset',account_subtype:'receivable',normal_balance:'debit',total_debit:'10.00',total_credit:'10.00',balance:'0.00'},
  {account_number:'007.002',account_name:'Bank fees',account_type:'expense',account_subtype:'opex',normal_balance:'debit',total_debit:'0.00',total_credit:'0.00',balance:'0.00'},
];
const ledger=[{line_id:'line-a',line_no:1,date:'2026-11-03',entry_number:42,account_number:'112.300',account_name:'Bank - Nickel',offsetting_account_number:'211.100',offsetting_account_name:'Accounts Payable',debit:'25.10',credit:'0.00',notes:'Vendor <adjustment>',audit_link:'https://airtable.com/record',offset_is_split:false},{line_id:'line-b',line_no:2,date:'2026-11-03',entry_number:42,account_number:'211.100',account_name:'Accounts Payable',offsetting_account_number:null,offsetting_account_name:null,debit:'0.00',credit:'25.10',notes:'Vendor <adjustment>',audit_link:'javascript:alert(1)',offset_is_split:true}];

test('Pagination accepts positive safe page numbers and preserves date filters',()=>{
  for(const value of [undefined,'','0','-2','1.5','Infinity','9007199254740992','oops'])assert.equal(utils.ledgerPageNumber(value),1);
  assert.equal(utils.ledgerPageNumber(['2','3']),2);
  const params=new URLSearchParams(utils.ledgerHref({from:'2025-01-01',to:'2025-12-31',page:2}).slice(1));
  assert.deepEqual(Object.fromEntries(params),{from:'2025-01-01',to:'2025-12-31',page:'2'});
});

test('Ledger account filters accept only account codes and survive pagination and date changes',()=>{
  assert.equal(utils.ledgerAccountParam('112.300'),'112.300');
  assert.equal(utils.ledgerAccountParam(['211.100','112.300']),'211.100');
  for(const value of [undefined,'','112','112.3000','x112.300',"112.300' or 1=1"])assert.equal(utils.ledgerAccountParam(value),undefined);
  assert.deepEqual(Object.fromEntries(new URLSearchParams(utils.ledgerHref({from:'2026-01-01',to:'2026-11-03',account:'112.300',offset:'211.100',page:3}).slice(1))),{from:'2026-01-01',to:'2026-11-03',account:'112.300',offset:'211.100',page:'3'});
  assert.equal(utils.ledgerHref({from:'2026-01-01',to:'2026-11-03'}),'?from=2026-01-01&to=2026-11-03');
  assert.equal(utils.accountLedgerHref('112.300','2026-11-03'),'/general-ledger?from=2026-01-01&to=2026-11-03&account=112.300');
  assert.deepEqual(utils.accountGroups(trial).map(group=>[group.label,group.accounts.map(row=>row.account_number)]),[['Asset',['112.300','121.100']],['Liability',['211.100']],['Expense',['007.002']]]);
  const html=renderToStaticMarkup(React.createElement(tables.GeneralLedgerTable,{rows:ledger,from:'2026-01-01',to:'2026-11-03',page:2,pageSize:100,hasNext:true,account:'112.300',offset:'211.100'}));
  assert.match(html,/account=112\.300&amp;offset=211\.100&amp;page=1/);
  assert.match(html,/account=112\.300&amp;offset=211\.100&amp;page=3/);
  assert.match(html,/split across several offsetting accounts are not included/);
  const empty=renderToStaticMarkup(React.createElement(tables.GeneralLedgerTable,{rows:[],from:'2026-01-01',to:'2026-11-03',page:1,pageSize:100,hasNext:false,account:'112.300'}));
  assert.match(empty,/No posted journal lines match these accounts/);
  const dates=renderToStaticMarkup(React.createElement(dateFilter.DateFilter,{from:'2026-01-01',to:'2026-11-03',preserve:{account:'112.300',offset:undefined}}));
  assert.match(dates,/<input type="hidden" name="account" value="112\.300"\/>/);
  assert.ok(!dates.includes('name="offset"'));
  assert.ok(dates.match(/href="\?from=[^"]*"/g).every(href=>href.includes('account=112.300')));
  const accountFilter=load(path.join(__dirname,'LedgerAccountFilter.tsx'));
  const picker=renderToStaticMarkup(React.createElement(accountFilter.LedgerAccountFilter,{from:'2026-01-01',to:'2026-11-03',accounts:trial,account:'112.300'}));
  assert.match(picker,/<optgroup label="Asset">/);
  assert.match(picker,/<option value="112\.300" selected="">112\.300 Bank - Nickel<\/option>/);
  assert.match(picker,/Clear accounts/);
  assert.match(picker,/href="\?from=2026-01-01&amp;to=2026-11-03"/);
});

test('Ledger date presets handle year rollover and leap-month endpoints',()=>{
  assert.deepEqual(utils.ledgerDatePresets('2026-01-15')[1],{label:'Last month',from:'2025-12-01',to:'2025-12-31'});
  assert.deepEqual(utils.ledgerDatePresets('2024-03-02')[1],{label:'Last month',from:'2024-02-01',to:'2024-02-29'});
});

test('Trial Balance display filters retain settled accounts with debit and credit activity',()=>{
  assert.deepEqual(utils.filterTrialAccounts(trial,'','all',false).map(row=>row.account_number),['112.300','211.100','121.100']);
  assert.equal(utils.filterTrialAccounts(trial,' nICkel ','asset',false)[0],trial[0]);
  assert.equal(utils.filterTrialAccounts(trial,'211.100','asset',true).length,0);
  assert.equal(utils.moneyTotal(trial.map(row=>row.total_debit)),35.10);
  assert.throws(()=>utils.moneyTotal(['90071992547400.00','90071992547400.00']),/precision/);
});

test('Ledger page filters search offsetting accounts and notes without changing totals',()=>{
  assert.deepEqual(utils.filterLedgerRecords(ledger,'nickel','credit'),[]);
  assert.equal(utils.filterLedgerRecords(ledger,'split','all')[0],ledger[1]);
  assert.equal(utils.filterLedgerRecords(ledger,'payable','debit')[0],ledger[0]);
  assert.equal(utils.filterLedgerRecords(ledger,'adjustment','all').length,2);
  assert.equal(utils.moneyTotal(ledger.map(row=>row.debit)),25.10);
});

test('Ledger rendering uses readable dates, explicit zeros, pills and safe audit links',()=>{
  const html=renderToStaticMarkup(React.createElement(tables.GeneralLedgerTable,{rows:ledger,from:'2026-01-01',to:'2026-11-03',page:2,pageSize:100,hasNext:false}));
  assert.match(html,/Nov 3, 2026/);
  assert.match(html,/\$0\.00/);
  assert.match(html,/account-pill-code/);
  assert.match(html,/account-pill-name/);
  assert.match(html,/Current page totals/);
  assert.match(html,/page=1/);
  assert.ok(!html.includes('href="javascript:'));
  assert.match(html,/Vendor &lt;adjustment&gt;/);
  assert.match(html,/Split \/ multiple accounts/);
  assert.match(html,/Page 2/);
});

test('Trial Balance renderer preserves all-account totals and dates submit without a page parameter',()=>{
  const html=renderToStaticMarkup(React.createElement(tables.TrialBalanceTable,{rows:trial,asOf:'2026-11-03'}));
  assert.match(html,/href="\/general-ledger\?from=2026-01-01&amp;to=2026-11-03&amp;account=112\.300"/);
  assert.match(html,/All-account totals/);
  assert.match(html,/\$35\.10/);
  assert.match(html,/Debits = Credits/);
  const dates=renderToStaticMarkup(React.createElement(dateFilter.DateFilter,{from:'2025-01-01',to:'2025-12-31'}));
  assert.match(dates,/Jan 1, 2025/);
  assert.match(dates,/Dec 31, 2025/);
  assert.match(dates,/name="from"/);
  assert.match(dates,/name="to"/);
  assert.ok(!dates.includes('name="page"'));
});

test('T-Chart renders one grouped table with linked single-account references',()=>{
  const rulesTable=load(path.join(__dirname,'PostingRulesTable.tsx'));
  const rule=(rule_code,category,debit_accounts,credit_accounts,extra={})=>({rule_code,category,sort_order:1,trigger_name:`Trigger ${rule_code}`,debit_accounts,credit_accounts,reversible:true,airtable_sources:null,when_to_post:null,fin_notes:null,audit_trail:null,...extra});
  const rules=[rule('EXP-01','expense','By Vendor (e.g., Utilities 006.002)','AP (211.100)',{reversible:null}),rule('PAY-07','payment','AP (211.100)','Bank (Nickel/Fifth Third)',{when_to_post:'When sent.',audit_trail:'Payment record'})];
  const html=renderToStaticMarkup(React.createElement(rulesTable.PostingRulesTable,{rules,asOf:'2026-11-03'}));
  assert.equal((html.match(/<table/g)||[]).length,1);
  assert.match(html,/Expenses<span>1 rule<\/span>/);
  assert.match(html,/Payments<span>1 rule<\/span>/);
  assert.match(html,/href="\/general-ledger\?from=2026-01-01&amp;to=2026-11-03&amp;account=211\.100"/);
  assert.match(html,/By Vendor \(e\.g\., Utilities 006\.002\)/);
  assert.ok(!html.includes('account=006.002'));
  assert.match(html,/Audit trail: Payment record/);
  assert.match(html,/Showing 2 of 2 rules/);
  assert.match(html,/All<span class="tchart-count">2<\/span>/);
});
