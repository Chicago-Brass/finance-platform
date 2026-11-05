const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function navigation(pending = true, extra = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, 'ReportNavigation.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const mocks = {
    react: { ...React, useContext: () => ({ pending, destination: '/balance-sheet', refresh() {} }) },
    'next/navigation': { usePathname: () => '/income-statement' },
    'next/link': { default: () => null },
    './ReportIcons': { ReportIcon: () => null },
    '@/lib/reports/report-routes': { REPORT_PATHS: {income:'/income-statement',balance:'/balance-sheet',trial:'/trial-balance',ledger:'/general-ledger',rules:'/t-chart'} },
    './ReportData': {useReportFetching:()=>pending,useReportRefresh:()=>()=>{}},
    ...extra,
  };
  new Function('require', 'module', 'exports', code)(name => mocks[name] ?? require(name), module, module.exports);
  return module.exports;
}

test('Navigation leaves destination controls accessible while data loading is independent', () => {
  const ui = navigation();
  const controls = renderToStaticMarkup(React.createElement(ui.ReportContent, null, React.createElement('button', null, 'Filter')));
  assert.match(controls, /<button>Filter<\/button>/);
  assert.doesNotMatch(controls, /inert=|aria-hidden="true"|report-loading-overlay/);
  assert.match(controls, /Updating report data/);
});

test('A render failure preserves sidebar geometry and resets for new query data', () => {
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


test('Financial navigation updates history immediately without an RSC route request', () => {
  const previousWindow=global.window,calls=[];
  global.window={location:new URL('http://localhost:3010/balance-sheet'),history:{pushState(_state,_title,href){calls.push(['history',href]);global.window.location=new URL(href,global.window.location);}}};
  try {
    const hooks={...React,useState:initial=>[initial,()=>{}],useMemo:fn=>fn(),useTransition:()=>[false,fn=>fn()]};
    const ui=navigation(false,{
      react:hooks,
      'next/navigation':{useRouter:()=>({push:(...args)=>calls.push(['router',...args]),refresh:()=>calls.push(['router-refresh'])})},
      './ReportData':{useReportFetching:()=>false,useReportRefresh:()=>()=>calls.push(['data-refresh'])},
    });
    const value=ui.ReportNavigationProvider({children:null}).props.value;
    value.navigate('/general-ledger');
    value.navigate('?q=bank');
    assert.deepEqual(calls,[['history','/general-ledger'],['history','/general-ledger?q=bank']]);
    value.refresh();assert.equal(calls.at(-1)[0],'data-refresh');
    value.navigate('/account');assert.deepEqual(calls.at(-1),['router','/account',{scroll:false}]);
  } finally {global.window=previousWindow;}
});

function dataPanel() {
  const module={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'ReportDataPanel.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  new Function('require','module','exports',code)(name=>name==='./ReportNavigation'?navigation(false):require(name),module,module.exports);
  return module.exports.ReportDataPanel;
}

test('Query loading and failure replace table data while preserving the analytics layout', () => {
  const Panel=dataPanel(),old=React.createElement('p',null,'old invoice rows');
  for(const error of [false,true]){
    const markup=renderToStaticMarkup(React.createElement(Panel,{query:{pending:!error,error,retry(){}},analytics:true},old));
    assert.doesNotMatch(markup,/old invoice rows/);
    assert.match(markup,/has-analytics/);
    assert.match(markup,error?/Try again/:/Loading report data/);
  }
});
