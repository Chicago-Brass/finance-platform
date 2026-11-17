import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import postgres from 'postgres';
import {postPayment} from '../functions/ledger-payment/ledger.ts';
import {reverseJournals} from '../functions/ledger-reversal/reversal.ts';
import {DatabaseRunStore} from '../functions/ledger-daily/store.ts';
const url=process.env.LEDGER_TEST_DATABASE_URL;
if(!url||!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw Error('Use the disposable database runner.');
const sql=postgres(url,{prepare:false,max:2,onnotice(){}});after(()=>sql.end());
const rule='PROG-TEST',sourceTable='tbldQXuqNEp8G5pfs',id=n=>'rec'+String(n).padStart(14,'0');
const approved='progress-viewer@example.test';
async function viewer(email,fn){return sql.begin(async tx=>{await tx`set local role authenticated`;await tx`select set_config('request.jwt.claims',${JSON.stringify({email,role:'authenticated'})},true)`;return fn(tx);});}
async function overview(tx=sql,args={}){const [row]=await tx`select public.get_ledger_rule_progress(${args.from??null}::date,${args.to??null}::date,${args.q??''},${args.category??''},${args.implementation??''},${args.enabled??'all'},${args.rule??rule},${args.page??1},${args.size??50}) result`;return row.result;}
async function detail(tx=sql,page=1){const [row]=await tx`select public.get_ledger_rule_journals(${rule},null,null,${page}) result`;return row.result;}
let journalId;
test('progress metadata and real posted/reversal counts do not depend on telemetry history',async()=>{
 await sql`insert into app_users(email,role) values(${approved},'viewer')`;
 await sql`insert into ledger_rules(rule_code,category,sort_order,trigger_name,enabled,reversible,source_table,source_label,implementation_status,chart_family,debit_label,credit_label)
 values(${rule},'other',1,'Progress accounting test',true,true,${sourceTable},'Invoices','fully','Vendor purchases','Utilities 006.002','Fifth Third 112.100')`;
 const packet={invoiceRecordId:id(14001),eventType:'entry_requested',entryDate:'2026-11-18',categories:[{ruleCode:rule,transactionType:'Progress accounting test',postings:[{debitAccount:{number:'006.002'},creditAccount:{number:'112.100'},amount:'12.50',branch:'Chicago'}]}]};
 journalId=(await postPayment(sql,packet)).journalEntryIds[0];
 let result=await viewer(approved,tx=>overview(tx));assert.equal(result.rules.length,1);let row=result.rules[0];assert.equal(row.postedCount,1);assert.equal(row.reversalCount,0);assert.equal(row.succeededCount,0);assert.equal(row.failedCount,0);assert(result.trackingSince);assert.equal(row.family,'Vendor purchases');
 await reverseJournals(sql,{source:{tableId:sourceTable,recordId:id(14001)},reversalDate:'2026-11-18'});
 result=await viewer(approved,tx=>overview(tx));row=result.rules[0];assert.equal(row.postedCount,1);assert.equal(row.reversalCount,1);assert.equal(result.summary.posted,1);
 const data=await viewer(approved,tx=>detail(tx));assert.equal(data.total,2);assert.equal(data.journals.length,2);assert(data.journals.some(j=>j.id===journalId));assert(data.journals.some(j=>j.isReversal));assert(data.journals.every(j=>j.lines.length===2));assert(data.journals.every(j=>j.lines.every(l=>l.branch==='Chicago'&&l.accountName)));assert(data.journals.every(j=>j.auditLink.includes(id(14001))));assert.equal(data.attemptsLimit,20);assert.equal((await detail(sql,2)).journals.length,0);
});
test('rule attempts persist with the checkpoint, dedupe resume writes, and preserve precise Chicago date boundaries',async()=>{
 const runId=crypto.randomUUID(),lease=crypto.randomUUID();
 await sql`insert into ledger_daily_runs(id,run_key,state,lease_token) values(${runId},${'progress-test-'+runId},${sql.json({done:false})},${lease})`;
 const event=(n,outcome,occurredAt,error=null)=>({ruleCode:rule,sourceTable,sourceRecordId:id(n),outcome,error,occurredAt});
 const job={id:runId,leaseToken:lease,state:{done:true},attempts:[event(14010,'succeeded','2026-11-18T05:59:59.000Z'),event(14011,'failed','2026-11-18T06:00:00.000Z','Journal Line Amount must be a finite number.')]};
 const original=structuredClone(job.attempts),store=new DatabaseRunStore(sql);await store.save(job);assert.deepEqual(job.attempts,[]);job.attempts=original;await store.save(job);
 const all=await viewer(approved,tx=>overview(tx));assert.equal(all.rules[0].succeededCount,1);assert.equal(all.rules[0].failedCount,1);
 const before=await viewer(approved,tx=>overview(tx,{from:'2026-11-17',to:'2026-11-17'}));assert.equal(before.rules[0].succeededCount,1);assert.equal(before.rules[0].failedCount,0);
 const after=await viewer(approved,tx=>overview(tx,{from:'2026-11-18',to:'2026-11-18'}));assert.equal(after.rules[0].succeededCount,0);assert.equal(after.rules[0].failedCount,1);
 const data=await viewer(approved,tx=>detail(tx));assert.equal(data.attempts.length,2);assert.equal(data.attempts[0].outcome,'failed');assert(data.attempts[0].auditLink.endsWith(id(14011)));
});
test('lost lease rolls back attempt metadata together with its checkpoint',async()=>{
 const runId=crypto.randomUUID();await sql`insert into ledger_daily_runs(id,run_key,state,lease_token) values(${runId},${'progress-lost-'+runId},'{}',${crypto.randomUUID()})`;
 const job={id:runId,leaseToken:crypto.randomUUID(),state:{done:true},attempts:[{ruleCode:rule,sourceTable,sourceRecordId:id(14020),outcome:'failed',error:'test',occurredAt:new Date().toISOString()}]};
 await assert.rejects(()=>new DatabaseRunStore(sql).save(job),/lease was lost/);assert.equal(job.attempts.length,1);const [count]=await sql`select count(*) n from ledger_rule_attempts where run_id=${runId}`;assert.equal(Number(count.n),0);
});
test('approved reads filter/search all account labels; retired rules vanish without deleting accounting history',async()=>{
 assert.equal((await viewer(approved,tx=>overview(tx,{q:'112.100'}))).total,1);assert.equal((await viewer(approved,tx=>overview(tx,{q:'Invoices'}))).total,1);
 assert.equal((await viewer(approved,tx=>overview(tx,{q:'not found'}))).total,0);assert.equal((await viewer(approved,tx=>overview(tx,{enabled:'disabled'}))).total,0);
 await sql`update ledger_rules set retired_at=now(),enabled=false where rule_code=${rule}`;assert.equal((await viewer(approved,tx=>overview(tx))).total,0);assert.equal(await detail(),null);const [count]=await sql`select count(*) n from journal_entries where rule_code=${rule}`;assert.equal(Number(count.n),2);await sql`update ledger_rules set retired_at=null,enabled=true where rule_code=${rule}`;
});
test('progress obeys approved-user RLS and never grants browser writes or anonymous function execution',async()=>{
 assert.equal((await viewer('outsider@example.test',tx=>overview(tx))).total,0);
 await assert.rejects(()=>viewer(approved,tx=>tx`insert into ledger_rule_attempts(run_id,rule_code,source_table,source_record_id,outcome) values(${crypto.randomUUID()},${rule},${sourceTable},${id(14030)},'succeeded')`),e=>e.code==='42501');
 await assert.rejects(()=>sql.begin(async tx=>{await tx`set local role anon`;return overview(tx);}),e=>e.code==='42501');
 await assert.rejects(()=>overview(sql,{page:0}),e=>e.code==='22023');await assert.rejects(()=>overview(sql,{from:'2026-11-18',to:'2026-11-17'}),e=>e.code==='22023');
});
test('period overview includes a month containing only posted journals',async()=>{
 const month='2099-11-01';
 await sql`insert into accounting_periods(period_month,status) values(${month},'open') on conflict(period_month) do update set status='open'`;
 const packet={invoiceRecordId:id(14040),eventType:'entry_requested',entryDate:'2099-11-18',categories:[{ruleCode:rule,transactionType:'Journal-only month',postings:[{debitAccount:{number:'006.002'},creditAccount:{number:'112.100'},amount:'1.00'}]}]};
 assert.equal((await postPayment(sql,packet)).postedCount,1);
 await sql`delete from accounting_periods where period_month=${month}`;
 const [row]=await viewer(approved,tx=>tx`select status,posted_count from v_period_overview where period_month=${month}`);
 assert(row);assert.equal(row.status,'not_open');assert.equal(Number(row.posted_count),1);
});

test('journal detail pages contain 25 complete entries without gaps or duplicates',async()=>{
 const pageRule='PROG-PAGE';
 await sql`insert into ledger_rules(rule_code,category,sort_order,trigger_name,enabled,reversible) values(${pageRule},'other',1,'Journal pagination check',true,true)`;
 for(let n=0;n<26;n++) await postPayment(sql,{invoiceRecordId:id(14100+n),eventType:'entry_requested',entryDate:'2026-11-18',categories:[{ruleCode:pageRule,transactionType:'Journal pagination check',postings:[{debitAccount:{number:'006.002'},creditAccount:{number:'112.100'},amount:'1.00'}]}]});
 const read=page=>viewer(approved,async tx=>(await tx`select public.get_ledger_rule_journals(${pageRule},null,null,${page}) result`)[0].result);
 const first=await read(1),second=await read(2);
 assert.equal(first.pageSize,25);assert.equal(first.total,26);assert.equal(first.journals.length,25);assert.equal(second.journals.length,1);
 const all=[...first.journals,...second.journals];assert.equal(new Set(all.map(j=>j.id)).size,26);assert(all.every(j=>j.lines.length===2));assert(first.journals[24].entryNumber>second.journals[0].entryNumber);
});
test('existing catalog RLS allows active admins to toggle while denying viewer, finance and anonymous writes',async()=>{
 const admin='progress-admin@example.test',finance='progress-finance@example.test',inactive='progress-inactive@example.test';
 await sql`insert into app_users(email,role,active) values(${admin},'admin',true),(${finance},'finance',true),(${inactive},'admin',false)`;
 for(const email of [approved,finance,inactive,'unknown@example.test']){
  const changed=await viewer(email,tx=>tx`update ledger_rules set enabled=false where rule_code=${rule} and retired_at is null returning rule_code`);assert.equal(changed.length,0,email);
 }
 const [before]=await sql`select to_jsonb(r) state from ledger_rules r where rule_code=${rule}`;
 const rollback=Error('Rollback toggle proof');
 await assert.rejects(()=>viewer(admin,async tx=>{
  const [state]=await tx`select current_app_role() role`;assert.equal(state.role,'admin');
  const [changed]=await tx`update ledger_rules set enabled=false where rule_code=${rule} and retired_at is null returning to_jsonb(ledger_rules) state`;
  assert.deepEqual({...changed.state,updated_at:before.state.updated_at},{...before.state,enabled:false});
  assert.equal((await tx`update ledger_rules set enabled=true where rule_code='MISSING-PROGRESS' and retired_at is null returning rule_code`).length,0);
  throw rollback;
 }),e=>e===rollback);
 const [after]=await sql`select to_jsonb(r) state from ledger_rules r where rule_code=${rule}`;assert.deepEqual(after.state,before.state);
 await sql`update ledger_rules set retired_at=now() where rule_code=${rule}`;
 assert.equal((await viewer(admin,tx=>tx`update ledger_rules set enabled=false where rule_code=${rule} and retired_at is null returning rule_code`)).length,0);
 await sql`update ledger_rules set retired_at=null where rule_code=${rule}`;
 await assert.rejects(()=>sql.begin(async tx=>{await tx`set local role anon`;return tx`update ledger_rules set enabled=false where rule_code=${rule}`;}),e=>e.code==='42501');
});
