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
  useReportNavigate: ()=>()=>{},
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
  assert.doesNotMatch(html,/statement-toolbar|Search this page/);
  const empty=renderToStaticMarkup(React.createElement(tables.GeneralLedgerTable,{rows:[],from:'2026-01-01',to:'2026-11-03',page:1,pageSize:100,hasNext:false,account:'112.300'}));
  assert.match(empty,/No posted journal lines match these accounts/);
  const dates=renderToStaticMarkup(React.createElement(dateFilter.DateFilter,{from:'2026-01-01',to:'2026-11-03',preserve:{account:'112.300',offset:undefined}}));
  assert.match(dates,/<input type="hidden" name="account" value="112\.300"\/>/);
  assert.ok(!dates.includes('name="offset"'));
  assert.ok(dates.match(/href="\?from=[^"]*"/g).every(href=>href.includes('account=112.300')));
  const accountFilter=load(path.join(__dirname,'LedgerAccountFilter.tsx'));
  const picker=renderToStaticMarkup(React.createElement(accountFilter.LedgerAccountFilter,{from:'2026-01-01',to:'2026-11-03',accounts:trial,account:'112.300'}));
  assert.match(picker,/112\.300 Bank - Nickel/);
  assert.doesNotMatch(picker,/<select|<option|<optgroup/);
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

test('Ledger rendering uses readable dates, explicit zeros, pills and safe audit links',()=>{
  assert.equal(utils.moneyTotal(ledger.map(row=>row.debit)),25.10);
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
  assert.doesNotMatch(html,/statement-toolbar|Search rules or accounts/);
});

test('Ledger-wide query and side survive date submissions and pagination without page-only filtering',()=>{
  const html=renderToStaticMarkup(React.createElement(tables.GeneralLedgerTable,{rows:ledger,from:'2026-01-01',to:'2026-11-03',page:2,pageSize:100,hasNext:true,query:'Vendor',side:'credit'}));
  assert.match(html,/q=Vendor&amp;side=credit&amp;page=1/);
  assert.match(html,/q=Vendor&amp;side=credit&amp;page=3/);
  assert.match(html,/line-a|Vendor &lt;adjustment&gt;/);
  assert.doesNotMatch(html,/Search this page|statement-toolbar|Current page<\/span>/);
  const dates=renderToStaticMarkup(React.createElement(dateFilter.DateFilter,{from:'2026-01-01',to:'2026-11-03',preserve:{q:'Vendor',side:'credit',account:'112.300'}}));
  assert.match(dates,/name="q" value="Vendor"/);
  assert.match(dates,/name="side" value="credit"/);
  assert.ok(dates.match(/href="\?[^\"]*"/g).every(href=>href.includes('q=Vendor')&&href.includes('side=credit')));
});

function loadWorkspace(react, navigate=()=>{}) {
  const file=path.join(__dirname,'LedgerWorkspaces.tsx'), module={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const nav={...navigation,useReportNavigate:()=>navigate,ReportDataRegion:({children})=>children,ReportDataBoundary:({children})=>children,ReportDataLoading:({label})=>React.createElement('p',null,label)};
  const localRequire=name=>name==='react'?react:name.endsWith('ReportNavigation')?nav:name.startsWith('@/')?load(path.join(root,name.slice(2))):name.startsWith('.')?load(path.resolve(path.dirname(file),name)):require(name);
  new Function('require','module','exports',code)(localRequire,module,module.exports);
  return module.exports;
}

test('Ledger, Trial Balance and rules keep their controls visible while data is unresolved',()=>{
  const workspace=loadWorkspace(React), data=new Promise(()=>{});
  for(const [component,props,expected] of [
    [workspace.GeneralLedgerWorkspace,{options:{from:'2026-01-01',to:'2026-11-03',page:1,query:'Vendor',side:'all'},data,accountData:data},'Search all records'],
    [workspace.TrialBalanceWorkspace,{asOf:'2026-11-03',data},'With activity'],
    [workspace.PostingRulesWorkspace,{asOf:'2026-11-03',data},'Search rules or accounts'],
  ]){
    const html=renderToStaticMarkup(React.createElement(component,props));
    assert.match(html,new RegExp(expected));
    assert.match(html,/Loading (ledger records|trial balance|posting rules)/);
    assert.doesNotMatch(html,/statement-toolbar|<select/);
  }
});

test('Ledger search waits for blur or submit and avoids sending twice for blur plus button click',()=>{
  const calls=[],hooks={...React,useState:initial=>[initial,()=>{}],useRef:value=>({current:value}),useEffect:()=>{}};
  const workspace=loadWorkspace(hooks,href=>calls.push(href));
  const element=workspace.GeneralLedgerWorkspace({options:{from:'2026-01-01',to:'2026-11-03',page:3,query:'',side:'all'},data:new Promise(()=>{}),accountData:new Promise(()=>{})});
  const find=(node,predicate)=>{
    if(!React.isValidElement(node))return undefined;
    if(predicate(node))return node;
    for(const child of React.Children.toArray(node.props.children)){const result=find(child,predicate);if(result)return result;}
  };
  const input=find(element,node=>node.type.name==='SearchField'&&node.props.name==='q');
  const form=find(element,node=>node.type==='form'&&node.props.role==='search');
  input.props.onChange(' vendor refund ');
  assert.equal(calls.length,0,'typing does not request a new page');
  input.props.onBlur();
  form.props.onSubmit({preventDefault(){}});
  assert.equal(calls.length,1,'blur plus Search has one navigation');
  const params=new URLSearchParams(calls[0].slice(1));
  assert.equal(params.get('q'),'vendor refund');
  assert.equal(params.get('page'),'1','a changed query resets page one');
});

function findControl(node,predicate){
  if(!React.isValidElement(node))return undefined;
  if(predicate(node))return node;
  for(const child of React.Children.toArray(node.props.children)){const found=findControl(child,predicate);if(found)return found;}
}

function ledgerScopeHarness(initial,accountData=new Promise(()=>{})){
  const slots=[],calls=[],pending=[];let cursor=0,dirty=false;
  const hooks={...React,
    useState(initialValue){const index=cursor++;if(!slots[index])slots[index]={value:typeof initialValue==='function'?initialValue():initialValue};return[slots[index].value,value=>{const next=typeof value==='function'?value(slots[index].value):value;if(!Object.is(next,slots[index].value)){slots[index].value=next;dirty=true;}}];},
    useRef(value){const index=cursor++;if(!slots[index])slots[index]={current:value};return slots[index];},
    useEffect(effect,deps){const index=cursor++,previous=slots[index];if(!previous||deps.some((value,i)=>!Object.is(value,previous.deps[i]))){slots[index]={deps,cleanup:previous?.cleanup};pending.push(()=>{slots[index].cleanup?.();slots[index].cleanup=effect();});}},
  };
  const workspace=loadWorkspace(hooks,href=>calls.push(href));
  const data=new Promise(()=>{});let source=initial,element;
  const render=(options=source)=>{source=options;for(let pass=0;pass<5;pass++){cursor=0;dirty=false;element=workspace.GeneralLedgerWorkspace({options:source,data,accountData});while(pending.length)pending.shift()();if(!dirty)return element;}throw new Error('Workspace did not settle');};
  return{calls,render,find:predicate=>findControl(element,predicate),params:()=>Object.fromEntries(new URLSearchParams(calls.at(-1).slice(1)))};
}

test('Streamed account metadata accepts non-chainable React thenables and handles rejection',()=>{
  for(const failed of [false,true]){
    let resolve,reject;
    const streamed={then(onValue,onError){resolve=onValue;reject=onError;}};
    const fixture=ledgerScopeHarness({from:'2026-01-01',to:'2026-11-03',page:1},streamed);
    fixture.render();
    const rows=[{account_number:'112.100',account_name:'Bank',account_type:'asset'}];
    if(failed)reject(new Error('Unavailable'));else resolve(rows);
    fixture.render();
    const picker=fixture.find(node=>node.type.name==='LedgerAccountFilter');
    assert.deepEqual(picker.props.accounts,failed?[]:rows);
    assert.equal(picker.props.unavailable,failed);
  }
});

test('Rapid account, side, offset and date changes merge into the newest requested ledger scope',()=>{
  const initial={from:'2026-01-01',to:'2026-11-03',page:3,query:'vendor',side:'all'};
  const fixture=ledgerScopeHarness(initial);fixture.render();
  const picker=()=>fixture.find(node=>node.type.name==='LedgerAccountFilter');
  const period=()=>fixture.find(node=>node.type===dateFilter.DateFilter);
  picker().props.onChange({account:'112.300'});fixture.render();
  assert.equal(picker().props.account,'112.300','selection changes before a server response');
  fixture.find(node=>node.type.name==='SegmentedControl'&&node.props.label==='Entry side').props.onChange('debit');fixture.render();
  assert.deepEqual(fixture.params(),{from:initial.from,to:initial.to,account:'112.300',q:'vendor',side:'debit',page:'1'});
  fixture.render({...initial,account:'112.300',page:1});
  assert.equal(picker().props.side,'debit','an older account-only response cannot remove the pending side');
  picker().props.onChange({offset:'211.100'});fixture.render();
  assert.equal(fixture.params().account,'112.300');assert.equal(fixture.params().side,'debit');assert.equal(fixture.params().offset,'211.100');
  assert.deepEqual(period().props.preserve,{account:'112.300',offset:'211.100',q:'vendor',side:'debit'});
  period().props.onRangeChange({from:'2026-07-01',to:'2026-09-30'});fixture.render();
  assert.deepEqual(fixture.params(),{from:'2026-07-01',to:'2026-09-30',account:'112.300',offset:'211.100',q:'vendor',side:'debit',page:'1'});
  fixture.find(node=>node.type==='button'&&node.props.children==='Reset filters').props.onClick();fixture.render();
  assert.deepEqual(fixture.params(),{from:'2026-07-01',to:'2026-09-30',page:'1'});
  assert.equal(picker().props.account,undefined);assert.equal(picker().props.side,'all');
});

test('A completed request preserves newer focused search edits and Back clears abandoned optimistic filters',()=>{
  const listeners=new Map(),previousWindow=global.window;
  global.window={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
  try{
    const initial={from:'2026-01-01',to:'2026-11-03',page:1,query:'vendor',side:'all'},fixture=ledgerScopeHarness(initial);fixture.render();
    const picker=()=>fixture.find(node=>node.type.name==='LedgerAccountFilter');
    picker().props.onChange({account:'112.300'});fixture.render();
    let search=fixture.find(node=>node.type.name==='SearchField'&&node.props.name==='q');search.props.onFocus();search.props.onChange('vendor revised');fixture.render();
    fixture.render({...initial,account:'112.300'});
    search=fixture.find(node=>node.type.name==='SearchField'&&node.props.name==='q');assert.equal(search.props.value,'vendor revised');
    search.props.onBlur();fixture.render();
    assert.equal(fixture.params().q,'vendor revised');assert.equal(fixture.params().account,'112.300');
    picker().props.onChange({offset:'211.100'});fixture.render();assert.equal(picker().props.offset,'211.100');
    listeners.get('popstate')();fixture.render();
    assert.equal(picker().props.offset,undefined,'Back clears the abandoned pending offset');
    fixture.render(initial);assert.equal(picker().props.account,undefined);assert.equal(fixture.find(node=>node.type.name==='SearchField'&&node.props.name==='q').props.value,'vendor');
  }finally{global.window=previousWindow;}
});
