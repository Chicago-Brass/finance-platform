const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file, mocks) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname,file),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(name=>name in mocks?mocks[name]:require(name),module,module.exports);
  return module.exports;
}

test('Journal entry reads scope a posted header and every ordered line by entry ID, without report filters', async () => {
  const calls = []; let denied = false, missing = false, failLines = false;
  const header = { id:'entry-id',entry_number:42,description:'Split entry' };
  const client = { from(table) {
    const call = {table,methods:[]}; calls.push(call); const query = {};
    for(const method of ['select','eq','order','range','maybeSingle']) query[method]=(...args)=>{call.methods.push([method,...args]);return query;};
    query.then = resolve => {
      if (denied || (table==='journal_lines'&&failLines)) return resolve({data:null,error:{message:'Permission denied'}});
      if(table==='journal_entries') return resolve({data:missing?null:header,error:null});
      const start=call.methods.find(item=>item[0]==='range')[1];
      resolve({data:Array.from({length:Math.min(500,1201-start)},(_,index)=>({id:start+index+1,line_no:start+index+1})),error:null});
    }; return query;
  }};
  const journal = load('journal-entry.ts',{'./report-session':{ledgerRead:fn=>fn(client)}});
  const detail=await journal.getJournalEntry(42);
  assert.equal(detail.lines.length,1201,'full entry is not truncated to a Ledger page or API page');
  assert.equal(detail.lines.at(-1).line_no,1201);
  assert.deepEqual(calls[0].methods.filter(item=>item[0]==='eq'),[['eq','entry_number',42],['eq','status','posted']]);
  for(const call of calls.slice(1)) {
    assert.equal(call.table,'journal_lines');
    assert.deepEqual(call.methods.filter(item=>item[0]==='eq'),[['eq','entry_id','entry-id']]);
    assert.deepEqual(call.methods.find(item=>item[0]==='order'),['order','line_no']);
    assert.match(call.methods[0][1],/accounts!journal_lines_account_code_fkey\(name\)/);
    assert.ok(call.methods.every(item=>!['gte','lte'].includes(item[0])));
  }
  calls.length=0; missing=true;
  assert.equal(await journal.getJournalEntry(42),null); assert.equal(calls.length,1);
  missing=false; denied=true; await assert.rejects(()=>journal.getJournalEntry(42),/Journal entry query failed/);
  denied=false; failLines=true; await assert.rejects(()=>journal.getJournalEntry(42),/Journal lines query failed/);
  for(const invalid of [null,'','0','-1','1.2','Infinity','9007199254740992','1 OR true']) assert.throws(()=>journal.journalEntryNumber(invalid),RangeError);
  assert.equal(journal.journalEntryNumber('42'),42);
});

test('Journal JSON endpoint authenticates first, validates identity and sanitizes unavailable data and errors', async () => {
  let signedIn=false, calls=0, result={entry_number:42,lines:[]}, failed=false;
  const {journalEntryNumber}=load('journal-entry.ts',{'./report-session':{}});
  const {GET}=load('../../app/api/reports/journal-entry/route.ts',{
    '@/lib/reports/report-session':{reportUser:async()=>{if(!signedIn)throw new Error('no session');}},
    '@/lib/reports/journal-entry':{journalEntryNumber,getJournalEntry:async number=>{calls++;assert.equal(number,42);if(failed)throw new Error('private DB details');return result;}},
  });
  const request=value=>new Request(`http://localhost/api/reports/journal-entry?entry=${encodeURIComponent(value)}`);
  let response=await GET(request('42')); assert.equal(response.status,401); assert.equal(calls,0);
  signedIn=true; response=await GET(request('bad')); assert.equal(response.status,400); assert.equal(calls,0);
  response=await GET(request('42')); assert.equal(response.status,200); assert.deepEqual(await response.json(),result);
  assert.equal(response.headers.get('cache-control'),'private, no-store');
  result=null; assert.equal((await GET(request('42'))).status,404);
  failed=true; response=await GET(request('42')); assert.equal(response.status,503); assert.doesNotMatch(await response.text(),/private DB/);
});
