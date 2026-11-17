const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'..'),cache=new Map();
let query={pending:true,error:false,data:undefined,retry(){}};
const navigation={ReportLink:({children,...props})=>React.createElement('a',props,children),ReportForm:({children,...props})=>React.createElement('form',props,children),useReportNavigate:()=>()=>{},useReportPath:()=>'/progress',ReportDataBoundary:({children})=>children,ReportDataLoading:({label})=>React.createElement('div',{role:'status'},label)};
function load(file){
  if(file.endsWith('.css'))return{};
  if(!path.extname(file))file+=fs.existsSync(file+'.tsx')?'.tsx':'.ts';
  if(cache.has(file))return cache.get(file);
  const mod={exports:{}},code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const requireLocal=name=>name.endsWith('ReportNavigation')?navigation:name.endsWith('ReportData')?{useReportQuery:()=>query,useReportRefresh:()=>()=>{}}:name.startsWith('@/')?load(path.join(root,name.slice(2))):name.startsWith('.')?load(path.resolve(path.dirname(file),name)):require(name);
  new Function('require','module','exports',code)(requireLocal,mod,mod.exports);cache.set(file,mod.exports);return mod.exports;
}
const ui=load(path.join(__dirname,'ProgressWorkspace.tsx'));
const rule={ruleCode:'EXP-01',name:'Utilities <invoice>',category:'expense',sourceTable:'table',sourceLabel:'Invoices',family:'Operating expenses',implementationStatus:'partial',enabled:true,debitLabel:'Utilities (006.002)',creditLabel:'Accounts Payable (211.100)',postedCount:5,reversalCount:2,succeededCount:7,failedCount:3,pendingCount:0,lastActivityAt:null,notes:null};
const data={rules:[rule],total:1,page:1,pageSize:50,summary:{rules:1,enabled:1,posted:5,succeeded:7,failed:3},trackingSince:'2026-11-18T00:00:00.000Z',canManage:true};
const render=(component,props)=>renderToStaticMarkup(React.createElement(component,props));

test('rule table shows stable codes, financial mappings and independent implementation/enabled state',()=>{
  const html=render(ui.ProgressRulesTable,{data,selected:null,onSelect(){},onPage(){}});
  for(const text of ['EXP-01','Utilities &lt;invoice&gt;','Invoices','006.002','211.100','Operating expenses','Partial','Enabled','Succeeded / Failed / Posted','2 reversed'])assert(html.includes(text),text);
  assert.match(html,/progress-failure-count[^>]*>3</);
  assert.equal((html.match(/<th scope="col"/g)||[]).length,7);
  assert.match(html,/aria-label="7 succeeded, 3 failed, 5 posted"/);
  assert.match(html,/progress-source-pill/);
  assert.match(html,/role="switch"/);
  assert.match(html,/progress-rule-code/);
  assert.match(html,/aria-haspopup="dialog"/);assert.match(html,/tabindex="0"/);
  assert.doesNotMatch(html,/Fully implemented/,'enabled does not imply full implementation');
});

test('rule rows open on Enter or Space without intercepting keys from nested controls',()=>{
  const selected=[],tree=ui.ProgressRulesTable({data,selected:null,onSelect:code=>selected.push(code),onPage(){}});
  function find(node){if(!node||typeof node!=='object')return null;if(node.type==='tr'&&node.props['aria-haspopup'])return node;const children=React.Children.toArray(node.props?.children);return children.map(find).find(Boolean)??null;}
  const row=find(tree);assert(row);const target={};let prevented=0;
  for(const key of ['Enter',' ','ArrowDown'])row.props.onKeyDown({key,target,currentTarget:target,preventDefault(){prevented++;}});
  row.props.onKeyDown({key:'Enter',target:{},currentTarget:target,preventDefault(){assert.fail();}});
  assert.deepEqual(selected,['EXP-01','EXP-01']);assert.equal(prevented,2);
});

test('empty result retains a usable table and pagination',()=>{
  const html=render(ui.ProgressRulesTable,{data:{...data,rules:[],total:0},selected:null,onSelect(){},onPage(){}});
  assert.match(html,/No rules match these filters/);assert.match(html,/Rule progress table/);assert.equal((html.match(/disabled=""/g)||[]).length,2);
});

test('journal activity renders every line, signed currency and separate safe audit/ledger links',()=>{
  const journal={id:'journal',entryNumber:42,entryDate:'2026-11-17',postedAt:null,description:'Test <entry>',sourceTable:'table',sourceRecordId:'source',auditLink:'https://airtable.com/record',isReversal:true,lines:[{lineNumber:1,accountCode:'006.002',accountName:'Utilities',debit:'-25.50',credit:'0.00',branch:null,auditLink:null},{lineNumber:2,accountCode:'112.100',accountName:'Fifth Third',debit:'0.00',credit:'-25.50',branch:null,auditLink:null}]};
  const html=render(ui.ProgressJournalList,{journals:[journal]});
  assert.match(html,/Nov 17, 2026/);assert.match(html,/\(\$25\.50\)/);assert.match(html,/\$0\.00/);assert.match(html,/Test &lt;entry&gt;/);assert.match(html,/006\.002/);assert.match(html,/112\.100/);assert.match(html,/Reversal/);
  assert.match(html,/href="\/general-ledger\?from=2026-11-17&amp;to=2026-11-17&amp;entry=42"/);assert.match(html,/href="https:\/\/airtable.com\/record"/);
  assert.match(html,/aria-label="Open General Ledger for journal 42"[^>]*>Ledger/);assert.match(html,/aria-label="Open Airtable source for journal 42"[^>]*>Airtable/);
  assert.equal((html.match(/<a /g)||[]).length,2,'each journal exposes exactly the Ledger and Airtable destinations');
  const unsafe=render(ui.ProgressJournalList,{journals:[{...journal,auditLink:'javascript:alert(1)'}]});assert(!unsafe.includes('href="javascript:'));
});

test('main filters are present during data loading and history limits remain visible after loading',()=>{
  query={data:undefined,pending:true,error:false,retry(){}};
  const pending=render(ui.ProgressWorkspace,{});
  for(const label of ['Search rules','Activity period','Category','Implementation','Posting','Reset filters','Loading rule progress'])assert(pending.includes(label),label);
  assert(!pending.includes('<select'),'shared searchable dropdowns replace native context menus');
  query={data,pending:false,error:false,retry(){}};
  const ready=render(ui.ProgressWorkspace,{});assert.match(ready,/Earlier attempts are unavailable/);assert.match(ready,/Attempt tracking since/);
});

test('General Ledger drill-through identifies the exact journal without a fuzzy search',()=>{
  assert.equal(ui.progressLedgerHref({entryNumber:42,entryDate:'2026-11-17'}),'/general-ledger?from=2026-11-17&to=2026-11-17&entry=42');
  const nav=load(path.join(__dirname,'NavLinks.tsx'));const html=render(nav.NavLinks,{});assert.match(html,/href="\/progress"/);assert.match(html,/aria-current="page"/);
});


test('account presentation separates bank examples and contextual account labels without changing codes',()=>{
  assert.deepEqual(ui.progressAccounts('Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200)'),[
    {code:'112.100',name:'Bank - Fifth Third'},{code:'0747',name:'Nickel'},{code:'112.200',name:'Fidelity'}]);
  assert.deepEqual(ui.progressAccounts('Accounts Payable (211.100)\nBill being settled'),[{code:'211.100',name:'Accounts Payable'}]);
  assert.deepEqual(ui.progressAccounts('Received Not Invoiced (GRNI) (211.200)'),[{code:'211.200',name:'Received Not Invoiced (GRNI)'}]);
  const values=['005.001: Salary - Owners','005.002: Salary - W2','005.003: Salary - 1099','005.005: 401K','005.006: Payroll Taxes'];
  assert.equal(ui.progressAccounts(values.join('\n')).length,5);
  assert.deepEqual(ui.progressAccounts([...values,'005.101: Salary - Offshore'].join('\n')),[{code:null,name:'Multiple accounts'}]);
  assert.deepEqual(ui.progressAccounts('Invoice expense account linked\nExample: Utilities (006.002)'),[{code:null,name:'Multiple invoice accounts'}]);
  assert.deepEqual(ui.progressAccounts(null),[]);
});

test('switch stops row activation, reports state, and is unavailable without permission or while saving',()=>{
  const changes=[],controls={canManage:true,savingCode:null,errors:{},enabled:{},onToggle:(...args)=>changes.push(args)};
  const tree=ui.RuleToggle({rule,controls}),button=React.Children.toArray(tree.props.children)[0];
  assert.equal(button.props.role,'switch');assert.equal(button.props['aria-checked'],true);assert.equal(button.props.disabled,false);
  let stopped=0;button.props.onClick({stopPropagation(){stopped++;}});
  assert.deepEqual(changes,[['EXP-01',false]]);assert.equal(stopped,1);
  assert.equal(button.props.onKeyDown,undefined,'Tab and Escape must reach the drawer focus/close handler');
  const denied=render(ui.RuleToggle,{rule,controls:{...controls,canManage:false}});assert.match(denied,/disabled=""/);
  const saving=render(ui.RuleToggle,{rule,controls:{...controls,savingCode:'EXP-01'}});assert.match(saving,/aria-busy="true"/);assert.match(saving,/Saving/);assert.match(saving,/disabled=""/);
  const error=render(ui.RuleToggle,{rule,controls:{...controls,errors:{'EXP-01':'Could not save'}}});assert.match(error,/role="alert"/);assert.match(error,/Could not save/);
});

test('toggle sends only enabled and rule identity, and requires a confirmed response',async()=>{
  const original=global.fetch,calls=[];
  try {
    global.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({ruleCode:'EXP-01',enabled:false})};};
    assert.deepEqual(await ui.saveRuleEnabled('EXP-01',false),{ruleCode:'EXP-01',enabled:false});
    assert.equal(calls[0].url,'/api/progress');assert.equal(calls[0].options.method,'PATCH');assert.deepEqual(JSON.parse(calls[0].options.body),{ruleCode:'EXP-01',enabled:false});
    global.fetch=async()=>({ok:false,json:async()=>({error:'Only administrators can change rules.'})});
    await assert.rejects(()=>ui.saveRuleEnabled('EXP-01',true),/Only administrators/);
    global.fetch=async()=>({ok:true,json:async()=>({ruleCode:'EXP-01',enabled:false})});
    await assert.rejects(()=>ui.saveRuleEnabled('EXP-01',true),/not confirmed/);
  } finally {global.fetch=original;}
});
