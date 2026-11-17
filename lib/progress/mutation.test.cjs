const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
function load(file,stubs){const mod={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',code)(name=>{if(name in stubs)return stubs[name];throw Error('Unexpected import '+name);},mod,mod.exports);return mod.exports;}
function dataHarness({role='admin',roleError=null,row={rule_code:'EXP-01',enabled:false},updateError=null}={}){
 const calls=[];
 const builder={update(value){calls.push(['update',value]);return this;},eq(...args){calls.push(['eq',...args]);return this;},is(...args){calls.push(['is',...args]);return this;},select(value){calls.push(['select',value]);return this;},async maybeSingle(){return{data:row,error:updateError};}};
 const client={async rpc(name){calls.push(['rpc',name]);return{data:role,error:roleError};},from(name){calls.push(['from',name]);return builder;}};
 const api=load('lib/progress/data.ts',{'@/lib/reports/report-session':{ledgerRead:fn=>fn(client)},'./query':{PROGRESS_PAGE_SIZE:50}});
 return{api,calls};
}
test('toggle updates only enabled using the signed-in client and excludes retired rows',async()=>{
 const{api,calls}=dataHarness();assert.deepEqual(await api.setProgressEnabled('EXP-01',false),{ruleCode:'EXP-01',enabled:false});
 assert.deepEqual(calls,[['rpc','current_app_role'],['from','ledger_rules'],['update',{enabled:false}],['eq','rule_code','EXP-01'],['is','retired_at',null],['select','rule_code,enabled']]);
});
test('toggle fails closed for non-admin, unknown rule and database permission failures',async()=>{
 for(const role of ['viewer','finance',null]){const{api,calls}=dataHarness({role});await assert.rejects(()=>api.setProgressEnabled('EXP-01',true),e=>e.status===403);assert.equal(calls.length,1);}
 {const{api}=dataHarness({row:null});await assert.rejects(()=>api.setProgressEnabled('MISSING-01',true),e=>e.status===404);}
 {const{api}=dataHarness({updateError:{code:'42501'}});await assert.rejects(()=>api.setProgressEnabled('EXP-01',true),e=>e.status===403);}
 {const{api,calls}=dataHarness({roleError:{message:'private'}});await assert.rejects(()=>api.setProgressEnabled('EXP-01',true),/permission query failed/);assert.equal(calls.length,1);}
});
test('progress list and drawer expose management only from the live approved admin role',async()=>{
 for(const role of ['admin','viewer',null]){
  const calls=[],client={async rpc(name){calls.push(name);return{data:name==='current_app_role'?role:{rules:[],rule:{ruleCode:'EXP-01'}},error:null};}};
  const api=load('lib/progress/data.ts',{'@/lib/reports/report-session':{ledgerRead:fn=>fn(client)},'./query':{PROGRESS_PAGE_SIZE:50}});
  for(const rule of [null,'EXP-01']){const data=await api.getProgress({rule,from:null,to:null,page:1,query:'',category:'',implementation:'',enabled:'all'});assert.equal(data.canManage,role==='admin');}
  assert.deepEqual(calls,['get_ledger_rule_progress','current_app_role','get_ledger_rule_journals','current_app_role']);
 }
});
function routeHarness({authError=false,mutationError=null}={}){
 const calls=[];class ProgressMutationError extends Error{constructor(status,message){super(message);this.status=status;}}
 const{progressToggle}=load('lib/progress/query.ts',{});
 const route=load('app/api/progress/route.ts',{'@/lib/reports/report-session':{reportUser:async()=>{if(authError)throw Error('No user');return{id:'user'};}},'@/lib/progress/data':{ProgressMutationError,getProgress:async()=>({rules:[],canManage:true}),setProgressEnabled:async(...args)=>{calls.push(args);if(mutationError)throw mutationError==='permission'?new ProgressMutationError(403,'Only administrators can enable or disable rules.'):Error('private database error');return{ruleCode:args[0],enabled:args[1]};}},'@/lib/progress/query':{progressQuery:()=>({}),progressToggle}});
 return{route,calls};
}
const request=(body,origin='http://localhost:3010')=>new Request('http://localhost:3010/api/progress',{method:'PATCH',headers:{...(origin?{origin}:{}),'Content-Type':'application/json'},body:typeof body==='string'?body:JSON.stringify(body)});
test('PATCH requires same-origin authenticated controls and rejects malformed or broadened bodies',async()=>{
 const{route,calls}=routeHarness();for(const origin of ['https://other.test',null])assert.equal((await route.PATCH(request({ruleCode:'EXP-01',enabled:true},origin))).status,403);
 for(const body of ['{',{},[],{ruleCode:'EXP-01',enabled:true,rule_code:'PAY-01'}])assert.equal((await route.PATCH(request(body))).status,400);
 assert.equal(calls.length,0);assert.equal((await routeHarness({authError:true}).route.PATCH(request({ruleCode:'EXP-01',enabled:true}))).status,401);
});
test('PATCH returns persisted state and safe errors without leaking database details',async()=>{
 const{route,calls}=routeHarness(),response=await route.PATCH(request({ruleCode:'EXP-01',enabled:false}));assert.equal(response.status,200);assert.deepEqual(await response.json(),{ruleCode:'EXP-01',enabled:false});assert.deepEqual(calls,[['EXP-01',false]]);assert.equal(response.headers.get('Cache-Control'),'private, no-store');
 const forbidden=await routeHarness({mutationError:'permission'}).route.PATCH(request({ruleCode:'EXP-01',enabled:false}));assert.equal(forbidden.status,403);
 const failed=await routeHarness({mutationError:'database'}).route.PATCH(request({ruleCode:'EXP-01',enabled:false}));assert.equal(failed.status,503);assert.doesNotMatch(JSON.stringify(await failed.json()),/private database/);
});
