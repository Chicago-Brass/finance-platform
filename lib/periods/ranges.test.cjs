const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const moduleUnderTest = {exports:{}};
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,'ranges.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
new Function('require','module','exports',code)(require,moduleUnderTest,moduleUnderTest.exports);
const {periodRange,periodGroups,periodPresets,periodQueryRange}=moduleUnderTest.exports;

test('ranges use complete accounting months, accept multiple years and reject invalid or reversed dates',()=>{
  assert.deepEqual(periodRange('2024-02-15','2026-11-17'),{from:'2024-02-01',to:'2026-11-30'});
  assert.deepEqual(periodRange('2024-02-01','2024-02-29'),{from:'2024-02-01',to:'2024-02-29'});
  for(const dates of [['2026-02-30','2026-03-01'],['2026-11-17','2026-01-01'],['','2026-01-01'],['1800-01-01','2026-01-01'],['1950-01-01','2026-01-01']])assert.throws(()=>periodRange(...dates),RangeError);
});
test('quarters and years aggregate actual month counts and pending badges without inventing a monthly close state',()=>{
  const range=periodRange('2025-11-01','2026-04-30'),periods=[
    {period_month:'2026-01-01',status:'open',posted_count:'3',pending_count:2,adjustments_after_close:1},
    {period_month:'2026-02-01',status:'closed',posted_count:4,pending_count:1,adjustments_after_close:0},
  ];
  const quarters=periodGroups(range,'quarter',periods);assert.deepEqual(quarters.map(x=>x.label),['Q2 2026','Q1 2026','Q4 2025']);
  assert.deepEqual(quarters[1].months,['2026-01-01','2026-02-01','2026-03-01']);assert.equal(quarters[1].posted,7);assert.equal(quarters[1].pending,3);assert.equal(quarters[1].status,'mixed');assert.equal(quarters[1].adjustments,1);
  assert.equal(quarters[2].from,'2025-11-01');assert.equal(quarters[0].to,'2026-04-30');
  assert.deepEqual(periodGroups(range,'year',periods).map(x=>x.label),['2026','2025']);
  const months=periodGroups(range,'month',periods);assert.equal(months.length,6);assert.equal(months[0].key,'2026-04-01');assert.equal(months[5].key,'2025-11-01');
});
test('quick ranges handle year boundaries and full quarter ends',()=>{
  const presets=Object.fromEntries(periodPresets('2026-01-20').map(x=>[x.label,x.range]));
  assert.deepEqual(presets['Last month'],{from:'2025-12-01',to:'2025-12-31'});
  assert.deepEqual(presets['Last quarter'],{from:'2025-10-01',to:'2025-12-31'});
  assert.deepEqual(presets['This quarter'],{from:'2026-01-01',to:'2026-03-31'});
});
test('read API supports existing month callers and bounds selected groups to the overview range',()=>{
  assert.deepEqual(periodQueryRange(new URLSearchParams({month:'2026-11-01'})),{selected:{from:'2026-11-01',to:'2026-11-30'},overview:{from:'2026-01-01',to:'2026-12-31'}});
  const params=new URLSearchParams({from:'2025-10-01',to:'2025-12-31',overviewFrom:'2025-01-01',overviewTo:'2026-12-31'});
  assert.equal(periodQueryRange(params).selected.to,'2025-12-31');params.set('from','2024-01-01');assert.throws(()=>periodQueryRange(params),RangeError);
});

function routeFixture(email='reviewer@example.test') {
  const calls=[];
  const client={auth:{getClaims:async()=>({data:{claims:{email}},error:null})},from(table){
    const call={table,filters:[]};calls.push(call);
    const data=table==='app_users'?{can_manage_periods:false}:[];
    const result={data,error:null,count:0};
    const query={then(resolve,reject){return Promise.resolve(result).then(resolve,reject);}};
    for(const method of ['select','gte','lte','lt','eq','neq','or','order','range','in','single'])query[method]=(...args)=>{call.filters.push([method,...args]);return query;};
    return query;
  }};
  const file=path.join(__dirname,'../../app/api/periods/route.ts'),module={exports:{}};
  const route=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',route)(name=>name==='next/server'?{NextResponse:Response}:name==='@/lib/supabase/server'?{createClient:async()=>client}:moduleUnderTest.exports,module,module.exports);
  return{GET:module.exports.GET,calls};
}

test('quarter views query only selected journals and separately bound overview months with signed-in RLS client',async()=>{
  const f=routeFixture(),response=await f.GET(new Request('http://localhost/api/periods?from=2025-10-01&to=2025-12-31&overviewFrom=2025-01-01&overviewTo=2026-12-31'));
  assert.equal(response.status,200);assert.equal((await response.json()).canManage,false);assert.equal(response.headers.get('Cache-Control'),'private, no-store');
  const journals=f.calls.find(x=>x.table==='journal_entries').filters;
  assert(journals.some(x=>x[0]==='gte'&&x[1]==='period_month'&&x[2]==='2025-10-01'));assert(journals.some(x=>x[0]==='lte'&&x[1]==='period_month'&&x[2]==='2025-12-31'));assert(journals.some(x=>x[0]==='eq'&&x[1]==='status'&&x[2]==='posted'));
  const overview=f.calls.find(x=>x.table==='v_period_overview').filters;assert(overview.some(x=>x[0]==='gte'&&x[2]==='2025-01-01'));assert(overview.some(x=>x[0]==='lte'&&x[2]==='2026-12-31'));
});

test('period route rejects anonymous or invalid ranges before querying any financial table',async()=>{
  const anonymous=routeFixture(null),notSignedIn=await anonymous.GET(new Request('http://localhost/api/periods?month=2026-11-01'));assert.equal(notSignedIn.status,401);assert.equal(anonymous.calls.length,0);
  const invalid=routeFixture(),response=await invalid.GET(new Request('http://localhost/api/periods?from=2026-11-17&to=2025-01-01'));assert.equal(response.status,400);assert.equal(invalid.calls.length,0);
});
