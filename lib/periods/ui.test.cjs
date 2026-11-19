const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'../..');
let stateValues=[],updates=[],stateIndex=0;
function load(file,cache=new Map()){
  if(file.endsWith('.css'))return {};
  if(!path.extname(file))file+=fs.existsSync(file+'.tsx')?'.tsx':'.ts';
  if(cache.has(file))return cache.get(file);
  const module={exports:{}},isPeriod=file.endsWith('/PeriodManagement.tsx');
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const requireLocal=name=>{
    if(name==='react'&&isPeriod)return {...React,useState:initial=>{const index=stateIndex++;return [stateValues[index]===undefined?initial:stateValues[index],value=>updates.push({index,value})];},useEffect(){},useMemo:fn=>fn(),useRef:()=>({current:null})};
    if(name==='./ReportData')return {useReportRefresh:()=>()=>{},useReportRevision:()=>0,
      useReportQuery:()=>({data:{status:'pending',description:'Held invoice',entry_date:'2026-11-02',lines:[]}})};
    if(name==='@/lib/supabase/client')return {createClient(){throw Error('No financial action may run in UI checks');}};
    if(name==='@/lib/dates')return {todayChicago:()=> '2026-11-17'};
    if(name.startsWith('@/'))return load(path.resolve(root,name.slice(2)),cache);
    if(name.startsWith('.'))return load(path.resolve(path.dirname(file),name),cache);
    return require(name);
  };
  new Function('require','module','exports',code)(requireLocal,module,module.exports);cache.set(file,module.exports);return module.exports;
}
const ui=load(path.resolve(root,'components/PeriodManagement.tsx'));
const render=(component,props)=>renderToStaticMarkup(React.createElement(component,props));
const period={period_month:'2026-11-01',status:'open',posted_count:1,pending_count:1,adjustments_after_close:0,closed_at:null,closed_by:null};
const request={id:'request-1',kind:'posting',source_table:'table',source_record_id:'record',accounting_date:'2026-11-02',created_at:'2026-11-17T12:00:00Z',status:'pending',writeback_pending:false,journals:[{id:'journal-42',entry_number:42,status:'pending',description:'Held invoice',rule_code:'EXP-01'}],payload:{source:{recordName:'Held invoice'}}};
function page({grouping='month',status='open',canManage=true,pending=false,review=request,selected=false}={}){
  stateIndex=0;stateValues=[];stateValues[1]=grouping;stateValues[3]=pending?'pending':'posted';stateValues[7]={canManage,periods:[{...period,status}],rows:pending?[review]:[],total:pending?1:0};stateValues[8]=false;stateValues[10]={canManage,periods:[{...period,status}]};
  if(selected){ stateValues[17]=review.id; stateValues[18]={item:review,accounts:[],lines:[]}; }
  updates=[];
  return ui.PeriodManagement();
}
function find(node,predicate){if(!node||typeof node!=='object')return null;if(predicate(node))return node;return React.Children.toArray(node.props?.children).map(child=>find(child,predicate)).find(Boolean)||null;}

test('period controls contain only date range and grouping, with month-only close or reopen actions',()=>{
  for(const status of ['open','closed','not_open']){
    const html=renderToStaticMarkup(page({status}));
    assert.match(html,/>Periods<\/h1>/);assert.match(html,/Date range/);assert.match(html,/Group by/);
    assert.doesNotMatch(html,/filter-control-label[^>]*>Year<|filter-control-label[^>]*>Selected period<|Manage month|>Open period</);
    assert.match(html,status==='open'?/>Close period</:/>Reopen period</);
  }
  for(const grouping of ['quarter','year'])assert.doesNotMatch(renderToStaticMarkup(page({grouping})),/>Close period<|>Reopen period<|Manage month/);
  assert.doesNotMatch(renderToStaticMarkup(page({canManage:false})),/>Close period<|>Reopen period</);
});

test('source period states display compact open/closed pills without changing missing-period semantics',()=>{
  assert.match(render(ui.PeriodStatusPill,{status:'open'}),/period-badge open[^>]*>Open</);
  for(const status of ['closed','not_open'])assert.match(render(ui.PeriodStatusPill,{status}),/period-badge closed[^>]*>Closed</);
  assert.match(render(ui.PeriodStatusPill,{status:'mixed'}),/>Mixed</);
});

test('clicking the pending row or its keyboard-accessible Review button opens the same journal review', () => {
  const tree = page({pending:true,grouping:'quarter'});
  assert.match(renderToStaticMarkup(tree),/Entry #42/);
  const row = find(tree,node=>node.type==='tr' && node.props.className==='period-review-row');
  const actions=find(tree,node=>node.type===ui.PeriodReviewActions);
  assert(row);assert(actions);
  assert.match(render(ui.PeriodReviewActions,actions.props),/>Review</);
  assert.doesNotMatch(render(ui.PeriodReviewActions,actions.props),/>Allow entry<|>Retry links</);
  row.props.onClick({target:{closest:()=>null}});
  assert(updates.some(update=>update.value==='request-1'));
  updates=[];
  actions.props.onView();
  assert(updates.some(update=>update.value==='request-1'));
  assert.match(render(ui.PeriodReviewActions,{...actions.props,canManage:false}),/>View</);
  assert.match(render(ui.PeriodReviewActions,{...actions.props,status:'posted',writebackPending:true}),/>Retry links</);
});

test('the two approval choices send the original or new posting date and reject the same month', () => {
  const submitted=[];
  const panel=(move,date)=>{
    stateIndex=0;stateValues=[move,date,'  Verified  '];
    return ui.ReviewPostingControls({originalDate:'2026-10-31',today:'2026-11-17',busy:false,error:'',onApprove:(...args)=>submitted.push(args)});
  };
  const keep=panel(false,'2026-11-17');
  assert.match(renderToStaticMarkup(keep),/Approve original date/);
  keep.props.onSubmit({preventDefault(){}});
  const moved=panel(true,'2026-11-17');
  assert.match(renderToStaticMarkup(moved),/Post on new date/);
  assert.match(renderToStaticMarkup(moved),/type="date"/);
  moved.props.onSubmit({preventDefault(){}});
  const same=panel(true,'2026-10-12');
  assert.match(renderToStaticMarkup(same),/Choose a date in a different month/);
  same.props.onSubmit({preventDefault(){}});
  assert.deepEqual(submitted,[['Verified',undefined],['Verified','2026-11-17']]);
});

test('review sidebar shows saved journal lines below the controls and respects manager permissions', () => {
  const html=renderToStaticMarkup(page({pending:true,selected:true}));
  assert.match(html,/Review journal entries/);
  assert.match(html,/Approve original date/);
  assert.match(html,/Saved journal entries/);
  assert.match(html,/Journal lines/);
  assert(html.indexOf('Approve posting') < html.indexOf('Saved journal entries'));
  const readOnly=renderToStaticMarkup(page({pending:true,selected:true,canManage:false}));
  assert.match(readOnly,/Journal lines/);
  assert.doesNotMatch(readOnly,/Approve original date/);
});

test('rejected reviews retry a failed Airtable writeback via the existing reject action', () => {
  const tree = page({pending:true,review:{...request,status:'rejected',writeback_pending:true,journals:[{...request.journals[0],status:'rejected'}]}});
  const actions = find(tree,node=>node.type===ui.PeriodReviewActions);
  assert.match(render(ui.PeriodReviewActions,actions.props),/>Retry links</);
  actions.props.onAllow();
  assert(updates.some(({value})=>value?.action==='reject'&&value.requestId==='request-1'&&value.repairLinks===true&&value.month==='2026-11-01'));
  assert.doesNotMatch(render(ui.PeriodReviewActions,{...actions.props,canManage:false}),/>Retry links</);
  assert.doesNotMatch(render(ui.PeriodReviewActions,{...actions.props,writebackPending:false}),/>Retry links</);
});
