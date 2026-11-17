// Authorized FIN/develop campaign only. Source IDs/values live in the reviewed private manifest.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {performance} from 'node:perf_hooks';
import {AirtableClient} from '../functions/ledger-daily/airtable.ts';
import {LINK_FIELDS} from '../functions/_shared/ledger-links.ts';
import {POSTING_FIELDS,paymentWorkerFields as F,expenseWorkerFields as E} from '../functions/ledger-daily/definitions.ts';
import {CHART} from '../functions/ledger-daily/rules/chart.ts';
const [manifestPath,output]=process.argv.slice(2);
if(!manifestPath||!output||!process.argv.includes('--execute'))throw Error('Supply approved manifest, private output path and --execute.');
const ref='vaaykmqshkuunewjrxuy',url=process.env.DEVELOP_SUPABASE_URL;
assert.equal(new URL(url).hostname,ref+'.supabase.co','This runner refuses production.');
const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
const approved=JSON.parse(await fs.readFile('/tmp/ledger-validation-campaign-state.json','utf8'));
assert(approved.approved&&approved.productionCronPaused&&approved.routesChanged.length===4,'Complete approved isolation setup first.');
assert.equal(path.resolve(manifestPath),approved.manifest);
const secret=process.env.LEDGER_WEBHOOK_SECRET,pat=process.env.AIRTABLE_API_RW||process.env.AIRTABLE_PAT;
assert(secret&&pat&&process.env.SUPABASE_ACCESS_TOKEN,'Missing private credentials.');
const headers={'Content-Type':'application/json',Authorization:`Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`};
let result;try{result=JSON.parse(await fs.readFile(output,'utf8'));assert.equal(result.target,ref);}catch(error){if(error.code!=='ENOENT')throw error;result={startedAt:new Date().toISOString(),target:ref,rows:[],stage:'starting',failures:[]};}
const save=()=>fs.writeFile(output,JSON.stringify(result,null,2));
const query=async sql=>{
 const r=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:'POST',headers,body:JSON.stringify({query:sql}),signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error('Develop query '+r.status+': '+await r.text());return r.json();
};
const q=s=>"'"+s.replaceAll("'","''")+"'";
const cents=v=>{const n=Number(v);assert(Number.isFinite(n));return Math.round((Math.abs(n)+Number.EPSILON)*100)*Math.sign(n);};
const sorted=a=>[...new Set(a??[])].sort();
const ids=(single,multiple)=>sorted([...(single?[single]:[]),...(multiple??[])]);
const account=ref=>ref.number==='0747'?'112.300':ref.number;
const client=new AirtableClient(pat,Date.now()+2*60*60_000,fetch,{maxRequests:3000,dateRange:{from:'2020-01-01',to:'2026-11-18'}});
await client.initialize();
const fields=s=>({...LINK_FIELDS[s.tableId],...POSTING_FIELDS[s.tableId]});
const airtable=async s=>{const f=fields(s);client.clearRecordCache();const row=await client.readRecord(s.tableId,s.recordId,Object.values(f));return Object.fromEntries(Object.values(f).map(id=>[id,row.value(id)]));};
const webhook=async(name,body)=>{
 let last;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const r=await fetch(url+'/functions/v1/'+name,{method:'POST',headers:{'Content-Type':'application/json','x-ledger-secret':secret,'x-region':'us-west-2'},body:JSON.stringify(body),signal:AbortSignal.timeout(110000)});
   const data=await r.json();
   if(!r.ok)throw Error(name+' '+r.status+': '+JSON.stringify(data));
   assert(!data.busy,'Another sync is running.');return data;
  }catch(error){last=error;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));}
 }
 throw last;
};
const sync=async(s,rule)=>{
 const body={dryRun:false,categoryCodes:[rule],source:{tableId:s.tableId,recordId:s.recordId},fromDate:'2020-01-01',toDate:'2026-11-18',runKey:'validation-'+crypto.randomUUID(),maxRecords:5};
 let response;for(let n=0;n<8;n++){response=await webhook('ledger-daily',body);assert.equal(response.errors?.length??0,0,JSON.stringify(response.errors));if(response.done)return response;}
 throw Error('Targeted run did not finish.');
};
const stored=async s=>query(`select e.*,coalesce((select json_agg(l order by line_no) from public.journal_lines l where l.entry_id=e.id),'[]'::json) as lines from public.journal_entries e where source_system='airtable' and source_table=${q(s.tableId)} and source_record_id=${q(s.recordId)} order by e.reverses_entry_id nulls first,e.rule_code,e.source_entry_key`);
function expectedLines(s,p){
 const invoice=ids(p.invoiceRecordId,p.invoiceRecordIds);if(!invoice.length&&s.tableId===F.TABLES.invoices)invoice.push(s.recordId);
 const common={vendor_ref:ids(p.vendorRecordId,p.vendorRecordIds),customer_ref:ids(p.clientRecordId,p.clientRecordIds),employee_ref:ids(p.staffRecordId,p.staffRecordIds),order_ref:ids(p.transactionRecordId,p.transactionRecordIds),po_ref:ids(p.poRecordId,p.poRecordIds),state_ref:sorted(p.stateRecordIds),airtable_record_id:p.sourceRecordId??null,airtable_record_ids:sorted(p.sourceRecordIds),branch:Array.isArray(p.branch)?(sorted(p.branch).length===1?p.branch[0]:null):p.branch??null};
 const debitInvoice=p.debitInvoiceRecordId!==undefined||p.debitInvoiceRecordIds!==undefined?ids(p.debitInvoiceRecordId,p.debitInvoiceRecordIds):invoice;
 const creditInvoice=p.creditInvoiceRecordId!==undefined||p.creditInvoiceRecordIds!==undefined?ids(p.creditInvoiceRecordId,p.creditInvoiceRecordIds):invoice;
 return [{...common,invoice_ref:sorted(debitInvoice),account_code:account(p.debitAccount),debit:cents(p.amount),credit:0},{...common,invoice_ref:sorted(creditInvoice),account_code:account(p.creditAccount),debit:0,credit:cents(p.amount)}];
}
function verifyOriginals(s,entries){
 const originals=entries.filter(e=>!e.reverses_entry_id),expected=s.packets.flatMap(p=>p.categories.map(c=>({c,date:p.entryDate})));
 assert.equal(originals.length,expected.length,'Original count');
 for(const {c,date}of expected){
  const e=originals.find(e=>e.rule_code===c.ruleCode&&e.source_entry_key===(c.entryKey??''));assert(e,'Missing rule/entry key');assert.equal(e.entry_date,date);assert.equal(e.status,'posted');
  const lines=c.postings.flatMap(p=>expectedLines(s,p));assert.equal(e.lines.length,lines.length);
  e.lines.forEach((actual,i)=>{for(const [field,value]of Object.entries(lines[i]))assert.deepEqual(field==='debit'||field==='credit'?cents(actual[field]):Array.isArray(value)?sorted(actual[field]):actual[field],value,`${s.recordId} ${field}`);assert(actual.audit_link?.includes(s.recordId),'Missing source audit link');});
  assert.equal(e.lines.reduce((sum,l)=>sum+cents(l.debit)-cents(l.credit),0),0,'Unbalanced original');
 }
 return originals;
}
async function verifyLinks(s,entries,reversed){
 const f=fields(s),values=await airtable(s),originals=entries.filter(e=>!e.reverses_entry_id),reversals=entries.filter(e=>e.reverses_entry_id),postings=JSON.parse(values[f.postings]??'[]');
 assert.deepEqual(sorted(JSON.parse(values[f.ids]??'[]')),sorted(originals.map(e=>e.id)));
 assert.deepEqual(sorted(JSON.parse(values[f.reversalIds]??'[]')),sorted(reversals.map(e=>e.id)));
 assert.equal(postings.length,originals.length);
 for(const p of postings){const e=originals.find(e=>e.id===p.id);assert(e);assert.equal(p.rule,e.rule_code);assert.equal(p.key,e.source_entry_key);assert(Number.isFinite(Date.parse(p.datetime)));}
 if(reversed){assert.equal(values[f.reverse],true);assert.equal(values[f.reverseDate],'2026-11-17');}
 return values;
}
function verifyReversals(entries){
 const originals=entries.filter(e=>!e.reverses_entry_id),reverse=entries.filter(e=>e.reverses_entry_id);assert.equal(reverse.length,originals.length);
 for(const e of originals){const r=reverse.find(r=>r.reverses_entry_id===e.id);assert(r);assert.equal(r.entry_date,'2026-11-17');assert.equal(r.lines.length,e.lines.length);
  for(let n=0;n<e.lines.length;n++){const a=e.lines[n],b=r.lines[n];for(const field of ['account_code','vendor_ref','customer_ref','employee_ref','order_ref','po_ref','invoice_ref','state_ref','branch','airtable_record_id','airtable_record_ids'])assert.deepEqual(b[field],a[field],field);assert.equal(cents(b.debit),cents(a.credit));assert.equal(cents(b.credit),cents(a.debit));}
 }
 const net={};for(const e of entries)for(const l of e.lines){const key=JSON.stringify([l.account_code,l.branch,sorted(l.invoice_ref)]);net[key]=(net[key]??0)+cents(l.debit)-cents(l.credit);}assert(Object.values(net).every(v=>v===0),'Reversal did not restore account/invoice/branch balances');
}
// Reuse the exact frontend report builders with real develop report RPC data.
const require=createRequire(import.meta.url),ts=require('typescript'),cache=new Map();
async function loadReport(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file);const mod={exports:{}},code=ts.transpileModule(await fs.readFile(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const imports=[...code.matchAll(/require\("([^"\n]+)"\)/g)].map(m=>m[1]),dependencies=new Map();for(const name of imports)dependencies.set(name,name.startsWith('.')?await loadReport(path.resolve(path.dirname(file),name+'.ts')):require(name));
 new Function('require','module','exports',code)(name=>dependencies.get(name),mod,mod.exports);cache.set(file,mod.exports);return mod.exports;
}
const repo=path.resolve(new URL('../../',import.meta.url).pathname),income=await loadReport(path.join(repo,'lib/reports/income-statement.ts')),balance=await loadReport(path.join(repo,'lib/reports/balance-sheet.ts'));
const report=async()=>{
 const data=await query("select json_build_object('all',(select json_agg(t) from public.get_trial_balance('2026-11-30',null,null) t),'current',(select json_agg(t) from public.get_trial_balance('2026-11-30','2026-01-01',null) t),'prior',(select json_agg(t) from public.get_trial_balance('2025-12-31',null,null) t),'entries',(select count(*) from public.journal_entries where status='posted')) as snapshot");
 const d=data[0].snapshot,period={key:'p1',label:'2026',from:'2026-01-01',to:'2026-11-30'},pl=income.getIncomeStatement({year:2026,from:1,to:11,grain:'year',summary:false},[{period,accounts:d.current}],d.entries),bs=balance.getBalanceSheet({asOf:'2026-11-30',grain:'single',summary:false},[{period,accounts:d.all}],new Map([[2026,d.prior]]),d.entries);
 const value=(r,id)=>r.lines.find(l=>l.id===id)?.values.p1;
 const scalar={income:value(pl,'net-income'),assets:value(bs,'total-assets'),liabilitiesEquity:value(bs,'total-le'),posted:d.entries};
 assert.equal(cents(scalar.assets),cents(scalar.liabilitiesEquity),'Balance Sheet does not balance');
 const visible=new Set([...pl.lines,...bs.lines].flatMap(l=>l.accountCode?[l.accountCode]:[]));const missing=d.all.filter(a=>cents(a.total_debit)!==cents(a.total_credit)&&!visible.has(a.account_number));assert.deepEqual(missing,[],'A nonzero account is missing from reports');return {...scalar,accounts:d.all};
};
const waitUI=async(row,stage)=>{result.stage=stage;result.activeRule=row.rule;result.report=await report();await save();const marker=output+'.'+row.rule+'.'+stage;for(let i=0;i<1200;i++){try{await fs.access(marker);return;}catch{}await new Promise(resolve=>setTimeout(resolve,500));}throw Error('UI verification timed out.');};
const groups=new Map();for(const s of manifest.sources)for(const rule of s.rules){if(!groups.has(rule))groups.set(rule,[]);groups.get(rule).push(s);}
const families=[['EXP-01','EXP-14'],['EXP-15','EXP-16'],['EXP-11','EXP-27'],['INV-12','INV-13'],['INV-15','INV-16'],['INV-10','INV-18']];
const sourceRules=new Map(manifest.sources.map(source=>[source.recordId,source.rules[0]]));
for(const [recognition,payment]of families)if(groups.has(recognition)&&groups.has(payment)){
 groups.set(recognition,[...groups.get(recognition),...groups.get(payment)]);groups.delete(payment);
}
const pairs=JSON.parse(await fs.readFile('/tmp/ledger-validation-approved-pairs.json','utf8'));
await save();
for(const [rule,sources]of groups){
 if(result.rows.some(r=>r.rule===rule&&r.complete))continue;
 const previous=result.rows.find(r=>r.rule===rule);
 if(previous?.error){previous.attemptErrors=[...(previous.attemptErrors??[]),previous.error];delete previous.error;result.failures=result.failures.filter(f=>f.rule!==rule);}
 const row=previous??{rule,sheet:CHART[rule].sheet,row:CHART[rule].row,name:CHART[rule].name,sources:[],startedAt:new Date().toISOString()},start=performance.now();if(!previous)result.rows.push(row);
 try{
  row.coveredRules=sorted(sources.flatMap(source=>source.rules));
  const family=families.find(pair=>pair[0]===rule);
  for(const s of sources){
   const sourceRule=sourceRules.get(s.recordId);
   if(family&&sourceRule===family[1]&&!row.recognitionChecked){await waitUI(row,'recognition');row.recognitionChecked=true;await save();}
   if(row.sources.some(r=>r.recordId===s.recordId&&r.postingVerified))continue;
   const before=await airtable(s);for(const [field,value]of Object.entries(s.before))assert.deepEqual(before[field]??null,value,`Source ${s.recordId} changed before test`);
   const began=performance.now(),posted=await sync(s,sourceRule),entries=await stored(s);verifyOriginals(s,entries);await verifyLinks(s,entries,false);
   if(s===sources[0]){const replay=await sync(s,sourceRule);assert.equal(replay.stats.posted,0);assert.equal((await stored(s)).length,entries.length);}
   row.sources.push({tableId:s.tableId,recordId:s.recordId,rule:sourceRule,posted:posted.stats.posted,postingMs:Math.round(performance.now()-began),journalIds:entries.map(e=>e.id),postingVerified:true,writebackVerified:true,replayVerified:s===sources[0]});await save();console.log(rule,s.recordId,'posted and verified');
  }
  if(family){
   row.lifecycle=[];
   for(const pair of [...pairs.invoiceEntryPairs,...pairs.otherApprovedFamilies].filter(pair=>pair.recognition.rules.includes(rule)&&sources.some(source=>source.recordId===pair.payment.recordId))){
    const records=[pair.recognition.recordId,pair.payment.recordId];
    const net=await query(`select coalesce(sum(l.debit-l.credit),0) as balance from public.journal_lines l join public.journal_entries e on e.id=l.entry_id where e.source_record_id=any(array[${records.map(q).join(',')}]) and e.reverses_entry_id is null and l.account_code=${q(pair.settlementAccount)} and ${q(pair.invoiceId)}=any(l.invoice_ref)`);
    assert.equal(cents(net[0].balance),pair.expectedSettlementBalanceCents,'Invoice/payment did not clear '+pair.invoiceId);
    row.lifecycle.push({invoiceId:pair.invoiceId,recognition:pair.recognition.recordId,payment:pair.payment.recordId,account:pair.settlementAccount,balanceCents:cents(net[0].balance)});
   }
  }
  await waitUI(row,'posted');
  for(const s of sources){
   const f=fields(s),current=await airtable(s);
   if(!current[f.reverse]){await client.update(s.tableId,[{id:s.recordId,fields:{[f.reverse]:true}}]);console.log(rule,s.recordId,'Reverse Ledger checked');}
   let entries,done=false,lastReason='No reversal yet';
   for(let n=0;n<60;n++){
    entries=await stored(s);
    if(entries.filter(e=>e.reverses_entry_id).length===entries.filter(e=>!e.reverses_entry_id).length){
     try{await verifyLinks(s,entries,true);done=true;break;}catch(error){lastReason=error.message;}
    }
    await new Promise(resolve=>setTimeout(resolve,1000));
   }
   assert(done,'Native reversal/writeback did not finish for '+s.recordId+': '+lastReason);verifyReversals(entries);
   if(s===sources[0]){const retry=await webhook('ledger-reversal',{source:{tableId:s.tableId,recordId:s.recordId},reversalDate:'2026-11-17'});assert.equal(retry.reversedCount,0);assert.equal((await stored(s)).length,entries.length);}
   Object.assign(row.sources.find(r=>r.recordId===s.recordId),{reversalVerified:true,reversalReplayVerified:s===sources[0],reversalIds:entries.filter(e=>e.reverses_entry_id).map(e=>e.id)});await save();console.log(rule,s.recordId,'native reversal and net zero verified');
  }
  const totals=await report();assert(totals.accounts.every(a=>cents(a.total_debit)===cents(a.total_credit)),'Cumulative balances did not return to zero');
  await waitUI(row,'reversed');row.complete=true;row.durationMs=Math.round(performance.now()-start);await save();console.log(rule,'ROW COMPLETE',row.durationMs+'ms');
 }catch(error){row.error=error.message;result.failures.push({rule,error:error.message});result.stage='failed';await save();console.error(rule,error.message);process.exitCode=1;break;}
}
if(!result.failures.length){result.stage='complete';result.finishedAt=new Date().toISOString();await save();console.log('CAMPAIGN COMPLETE');}
