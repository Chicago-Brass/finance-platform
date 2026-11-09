const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const root = path.resolve(__dirname,'..');
function loader(mocks={}) {
  const cache=new Map();
  function load(file) {
    if(file.endsWith('.css'))return {};
    if(!path.extname(file)) file+=fs.existsSync(file+'.tsx')?'.tsx':'.ts';
    if(cache.has(file))return cache.get(file);
    const module={exports:{}};
    const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
    new Function('require','module','exports',code)(name=>Object.hasOwn(mocks,name)?mocks[name]:name.startsWith('@/')?load(path.join(root,name.slice(2))):name.startsWith('.')?load(path.resolve(path.dirname(file),name)):require(name),module,module.exports);
    cache.set(file,module.exports);return module.exports;
  }return file=>load(path.resolve(__dirname,file));
}
const line = (id,account_code,debit,credit,extra={})=>({id,line_no:id,account_code,account:{name:account_code==='112.100'?'Operating bank':'Loan component'},debit,credit,notes:null,audit_link:null,offset_account_code:null,vendor_ref:[],customer_ref:[],order_ref:[],po_ref:[],invoice_ref:[],employee_ref:[],state_code:null,airtable_record_id:null,branch:null,...extra});
const entry={id:'journal-id',entry_number:42,entry_date:'2026-01-09',source_date:'2026-01-08',status:'posted',description:'Loan principal + interest',rule_code:'PAY-16',transaction_type:'Loan payment',notes:'Full <entry> notes',audit_link:'https://airtable.com/source',source_system:'airtable',source_event_type:'sent',source_table:'Payments',source_record_id:'source-id',external_ref:'REF-42',created_at:'2026-01-09T14:00:00Z',created_by:'Operator',posted_at:'2026-01-09T14:01:00Z',posted_by:'Ledger',reverses_entry_id:null,reversal_reason:null,lines:[line(1,'112.100','0.00','1000.00'),line(2,'232.100','700.00','0.00',{invoice_ref:['invoice-id'],po_ref:['po-id'],vendor_ref:['vendor-id'],airtable_record_id:'airtable-id',audit_link:'https://airtable.com/line'}),line(3,'007.003','300.00','0.00',{audit_link:'javascript:alert(1)'})]};

test('Journal entry displays every split line, cents totals and organized source/posting details',()=>{
  const {JournalEntryDetails}=loader()('JournalEntryDrawer.tsx');
  const html=renderToStaticMarkup(React.createElement(JournalEntryDetails,{entry,selectedLineId:'2'}));
  for(const heading of ['Entry details','Journal lines','Posting information'])assert.ok(html.includes(`<h3>${heading}</h3>`));
  for(const value of ['112.100','232.100','007.003','source-id','PAY-16','Jan 9, 2026'])assert.ok(html.includes(value),value);
  const details=html.match(/<section[^>]*aria-label="Entry details"[\s\S]*?<\/section>/)[0];
  const posting=html.match(/<section[^>]*aria-label="Posting information"[\s\S]*?<\/section>/)[0];
  for(const label of ['Source','Table','Record','Accounting date','Source date','Transaction type']) assert.ok(details.includes(`<dt>${label}</dt>`));
  assert.doesNotMatch(details,/<dt>Rule<\/dt>/);
  for(const label of ['Rule','Created','Posted','Journal ID']) assert.ok(posting.includes(`<dt>${label}</dt>`));
  assert.doesNotMatch(html,/<dt>(Event|Posted by|Created by|Status)<\/dt>|<h3>References<\/h3>/);
  assert.match(html,/>3 lines</); assert.match(html,/aria-selected="true"/);
  for(const label of ['Account','Debit','Credit']) assert.ok(html.includes(`>${label}</th>`));
  assert.doesNotMatch(html,/journal-line-number|Selected line|Open line source|Debits equal credits/);
  assert.match(html,/aria-label="Open source for 232\.100"/);
  assert.doesNotMatch(html,/invoice-id|po-id|vendor-id|airtable-id|>Vendor<\/th>|>Invoice<\/th>|>Airtable record<\/th>/);
  const table=html.match(/<table[\s\S]*?<\/table>/)[0];
  assert.equal((table.match(/scope="col"/g)||[]).length,4,'only account, debit, credit and source columns');
  assert.equal((html.match(/\$1,000\.00/g)||[]).length,3,'one cash line and equal debit/credit totals');
  assert.match(html,/\$0\.00/); assert.doesNotMatch(html,/role="alert"/);
  assert.match(html,/Full &lt;entry&gt; notes/); assert.doesNotMatch(html,/href="javascript:/);
  const unbalanced=renderToStaticMarkup(React.createElement(JournalEntryDetails,{entry:{...entry,lines:entry.lines.slice(0,2)}}));
  assert.match(unbalanced,/Debit and credit totals differ by \$300\.00/);
});

function find(node,predicate){
  if(!React.isValidElement(node))return undefined;
  if(predicate(node))return node;
  for(const child of React.Children.toArray(node.props.children)){const found=find(child,predicate);if(found)return found;}
}

test('Full Ledger rows open the journal with pointer, Enter or Space while audit links stay independent',()=>{
  const updates=[],hooks={...React,useState:()=>[null,value=>updates.push(value)]};
  const {GeneralLedgerTable}=loader({react:hooks})('LedgerTable.tsx');
  const row={line_id:'2',line_no:2,date:entry.entry_date,entry_number:42,account_number:'232.100',account_name:'Auto Loan',offsetting_account_number:'112.100',offsetting_account_name:'Bank',debit:'700.00',credit:'0.00',notes:null,audit_link:'https://airtable.com/source',offset_is_split:false};
  const tree=GeneralLedgerTable({rows:[row],from:'2026-01-01',to:'2026-01-31',page:1,pageSize:100,hasNext:false});
  const tableRow=find(tree,node=>node.type==='tr'&&node.props.className?.includes('ledger-entry-row'));
  assert.equal(tableRow.props.tabIndex,0); assert.equal(tableRow.props['aria-haspopup'],'dialog');
  let focused=0;const current={focus(){focused++;}};
  tableRow.props.onClick({target:{closest:()=>null},currentTarget:current});
  assert.deepEqual(updates.at(-1),{entryNumber:42,lineId:'2'});assert.equal(focused,1);
  for(const key of ['Enter',' ']){
    let prevented=false;
    tableRow.props.onKeyDown({key,target:current,currentTarget:current,preventDefault(){prevented=true;}});
    assert.equal(prevented,true);assert.deepEqual(updates.at(-1),{entryNumber:42,lineId:'2'});
  }
  const count=updates.length;
  tableRow.props.onClick({target:{closest:()=>({tagName:'A'})},currentTarget:current});
  tableRow.props.onKeyDown({key:'Enter',target:{tagName:'A'},currentTarget:current});
  assert.equal(updates.length,count,'source-link activation never opens a drawer');
});

test('Journal drawer header renders immediately; loading and error states do not show stale details',()=>{
  for(const failed of [false,true]) {
    const query={data:undefined,pending:!failed,error:failed,retry(){}};
    const {JournalEntryDrawer}=loader({'./ReportData':{useReportQuery:url=>{assert.equal(url,'/api/reports/journal-entry?entry=42');return query;}}})('JournalEntryDrawer.tsx');
    const html=renderToStaticMarkup(React.createElement(JournalEntryDrawer,{entryNumber:42,onClose(){}}));
    assert.match(html,/role="dialog"/);assert.match(html,/Journal entry #42/);
    assert.ok(html.includes(failed?'Journal entry could not be loaded.':'Loading journal entry...'));
    assert.doesNotMatch(html,/Entry totals|\$0\.00/);
  }
});

test('Loaded journal uses a single header row with an icon source link and no repeated subtitle',()=>{
  const {JournalEntryDrawer}=loader({'./ReportData':{useReportQuery:()=>({data:entry,pending:false,error:false,retry(){}})}})('JournalEntryDrawer.tsx');
  const html=renderToStaticMarkup(React.createElement(JournalEntryDrawer,{entryNumber:42,onClose(){}}));
  const header=html.match(/<header[\s\S]*?<\/header>/)[0];
  assert.match(header,/Journal entry #42/);
  assert.match(header,/aria-label="Open source record"/);
  assert.match(header,/href="https:\/\/airtable.com\/source"/);
  assert.doesNotMatch(header,/<p(?:\s|>)|General Ledger|Complete entry|>Open source record</);
});

test('Journal table preserves vertical scroll chaining to the drawer while containing horizontal scrolling',()=>{
  const css=fs.readFileSync(path.join(__dirname,'journal-entry-drawer.css'),'utf8');
  assert.doesNotMatch(css,/\.journal-drawer\s*\{[^}]*\bwidth\s*:/,'journal inherits the shared account drawer width');
  const inner=css.match(/\.journal-lines-scroll\{([^}]+)\}/)[1];
  assert.match(inner,/overscroll-behavior-y:auto/);
  assert.match(inner,/overscroll-behavior-x:contain/);
  assert.doesNotMatch(inner,/overscroll-behavior:(none|contain)/);
  const outer=css.match(/\.journal-content\{([^}]+)\}/)[1];
  assert.match(outer,/overflow:auto/);
  assert.match(outer,/overscroll-behavior:none/,'only the drawer boundary stops page scrolling');
});

test('Shared drawer traps keyboard focus, closes outside or on Escape and restores the opener',()=>{
  const previous=global.document, effects=[];let openedFocus=0,firstFocus=0,lastFocus=0,closed=0;
  const opener={isConnected:true,focus(){openedFocus++;}},first={offsetParent:{},focus(){firstFocus++;}},last={offsetParent:{},focus(){lastFocus++;}};
  global.document={activeElement:opener};
  try{
    const panel={querySelector:()=>first,querySelectorAll:()=>[first,{offsetParent:null},last]};
    const {DetailDrawer}=loader({react:{...React,useRef:()=>({current:panel}),useEffect:effect=>effects.push(effect)}})('DetailDrawer.tsx');
    const tree=DetailDrawer({titleId:'title',onClose(){closed++;},children:'Details'});
    const cleanup=effects[0]();assert.equal(firstFocus,1);
    const aside=find(tree,node=>node.type==='aside');
    global.document.activeElement=last;aside.props.onKeyDown({key:'Tab',shiftKey:false,preventDefault(){}});assert.equal(firstFocus,2);
    global.document.activeElement=first;aside.props.onKeyDown({key:'Tab',shiftKey:true,preventDefault(){}});assert.equal(lastFocus,1);
    aside.props.onKeyDown({key:'Escape',stopPropagation(){}});assert.equal(closed,1);
    find(tree,node=>node.props.className==='drill-scrim').props.onPointerDown();assert.equal(closed,2);
    cleanup();assert.equal(openedFocus,1);
  }finally{global.document=previous;}
});
