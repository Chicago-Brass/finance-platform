const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, mocks) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,file),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(name=>name in mocks ? mocks[name] : require(name),module,module.exports);
  return module.exports;
}

test('Report cache isolates sessions, verifies auth before hits, reuses reads and never caches failures', async () => {
  let actor='one', token='private-token-one', request=0, reads=0, clientCreates=0, denied=false;
  const entries=new Map(), keys=[], settings=[];
  const readCache=load('read-cache.ts',{
    react:{cache:fn=>{const requests=new Map();return ()=>{if(!requests.has(request)) requests.set(request,fn());return requests.get(request);};}},
    'next/cache':{unstable_cache:(fn,key,options)=>async()=>{
      keys.push(key);settings.push(options);
      const id=JSON.stringify(key);
      if(entries.has(id)) return entries.get(id);
      const result=await fn();entries.set(id,result);return result;
    }},
    '@/lib/supabase/server':{createClient:async()=>{
      clientCreates++;
      return {actor,auth:{getUser:async()=>({data:{user:denied?null:{id:actor}},error:null}),getSession:async()=>({data:{session:token?{access_token:token}:null}})}};
    }},
  });
  const read=async client=>{reads++;return client.actor;};
  assert.deepEqual(await Promise.all([readCache.cachedLedgerRead(['balance','2026-11-03'],read),readCache.cachedLedgerRead(['balance','2026-11-03'],read)]),['one','one']);
  assert.equal(clientCreates,1);
  request++;
  assert.equal(await readCache.cachedLedgerRead(['balance','2026-11-03'],read),'one');
  const before=reads;
  actor='two';token='private-token-two';request++;
  assert.equal(await readCache.cachedLedgerRead(['balance','2026-11-03'],read),'two');
  assert.equal(reads,before+1);
  assert.ok(keys.every(key=>!JSON.stringify(key).includes('private-token')));
  assert.ok(settings.every(option=>option.revalidate===30));
  denied=true;request++;
  await assert.rejects(()=>readCache.cachedLedgerRead(['balance','2026-11-03'],read),/Sign in/);
  denied=false;request++;
  await assert.rejects(()=>readCache.cachedLedgerRead(['failed'],async()=>{throw new Error('upstream failed');}),/upstream failed/);
  assert.equal(await readCache.cachedLedgerRead(['failed'],read),'two');
});

test('Ledger requests 100 rows plus one lookahead with stable line ordering and isolated page keys', async () => {
  const calls=[], keys=[];
  let count=101;
  const query={};
  for(const name of ['select','gte','lte','order','range']) query[name]=(...args)=>{calls.push([name,...args]);return query;};
  query.then=(resolve)=>resolve({data:Array.from({length:count},(_,index)=>({line_id:`line-${index}`})),error:null});
  const ledger=load('ledger.ts',{
    '@/lib/supabase/server':{},
    './read-cache':{cachedLedgerRead:async(key,fn)=>{keys.push(key);return fn({from:()=>query});}},
  });
  const page=await ledger.getGeneralLedger('2026-01-01','2026-07-31',2);
  assert.equal(page.rows.length,100);
  assert.equal(page.hasNext,true);
  assert.equal(page.page,2);
  assert.deepEqual(calls.find(call=>call[0]==='range'),['range',100,200]);
  assert.deepEqual(calls.filter(call=>call[0]==='order').map(call=>call[1]),['date','entry_number','line_no']);
  assert.deepEqual(keys[0],['general-ledger','2026-01-01','2026-07-31','2']);
  count=100;calls.length=0;
  const last=await ledger.getGeneralLedger('2026-01-01','2026-07-31',-5);
  assert.equal(last.page,1);
  assert.equal(last.hasNext,false);
  assert.deepEqual(calls.find(call=>call[0]==='range'),['range',0,100]);
});
