const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const React=require('react');
const root=path.resolve(__dirname,'..');

function appHarness(){
  let pathname='/income-statement',search=new URLSearchParams('year=2026&from=1&to=3');
  const calls=[],pending={data:undefined,pending:true,error:false,retry(){}};
  const Income=()=>null,Balance=()=>null,Trial=()=>null,Ledger=()=>null,Rules=()=>null;
  const mocks={
    react:{...React,useEffect(){}},
    'next/navigation':{useSearchParams:()=>search},
    './ReportNavigation':{useReportPath:()=>pathname},
    './ReportData':{useReportQuery:url=>{calls.push(url);return pending;}},
    './StatementWorkspace':{IncomeStatementWorkspace:Income,BalanceSheetWorkspace:Balance},
    './LedgerWorkspaces':{TrialBalanceWorkspace:Trial,GeneralLedgerWorkspace:Ledger,PostingRulesWorkspace:Rules},
  };
  const cache=new Map();
  function load(file){
    if(!path.extname(file))file+=fs.existsSync(file+'.tsx')?'.tsx':'.ts';
    if(cache.has(file))return cache.get(file);
    const module={exports:{}};
    const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
    new Function('require','module','exports',code)(name=>mocks[name]??(name.startsWith('@/')?load(path.join(root,name.slice(2))):name.startsWith('.')?load(path.resolve(path.dirname(file),name)):require(name)),module,module.exports);
    cache.set(file,module.exports);return module.exports;
  }
  const App=load(path.join(__dirname,'ReportApplication.tsx')).ReportApplication;
  return {calls,Income,Balance,Trial,Ledger,Rules,render(route,params=''){
    pathname=route;search=new URLSearchParams(params);
    const shell=App({children:'account page'});
    return typeof shell==='string'?{shell}: {shell,workspace:shell.type(shell.props)};
  }};
}

test('Each destination gets its own immediate shell without waiting for financial data',()=>{
  const ui=appHarness();
  const income=ui.render('/income-statement','year=2026&from=1&to=3');
  assert.equal(income.workspace.type,ui.Income);
  assert.equal(income.workspace.props.data.pending,true);
  assert.equal(income.workspace.props.data.data,undefined);
  const balance=ui.render('/balance-sheet','asof=2026-11-05');
  assert.equal(balance.workspace.type,ui.Balance);
  assert.notEqual(balance.shell.key,income.shell.key,'different pages reset their local filter state');
  assert.equal(balance.workspace.props.options.asOf,'2026-11-05');
  const ledger=ui.render('/general-ledger','from=2026-01-01&to=2026-11-05&q=bank&page=2');
  assert.equal(ledger.workspace.type,ui.Ledger);
  assert.equal(ledger.workspace.props.options.page,2);
  assert.equal(ledger.workspace.props.accountData.pending,true);
  assert.equal(ui.calls.at(-1),'/api/reports/data?report=accounts');
  assert.equal(ui.render('/trial-balance','to=2026-11-05').workspace.type,ui.Trial);
  assert.equal(ui.render('/t-chart').workspace.type,ui.Rules);
  const count=ui.calls.length;
  assert.equal(ui.render('/account').shell,'account page');
  assert.equal(ui.calls.length,count,'non-report pages do not request financial data');
});

test('Display changes share one financial request key and metadata is only requested for Ledger',()=>{
  const ui=appHarness();
  ui.render('/income-statement','year=2026&from=1&to=3&grain=month');
  const request=ui.calls.at(-2);
  ui.render('/income-statement','year=2026&from=1&to=3&grain=quarter&layout=summary');
  assert.equal(ui.calls.at(-2),request);
  assert.equal(ui.calls.at(-1),null);
});
