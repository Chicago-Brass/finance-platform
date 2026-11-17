import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import fs from 'node:fs';
import postgres from 'postgres';
import {CHART} from '../functions/ledger-daily/rules/chart.ts';
import {postPayment} from '../functions/ledger-payment/ledger.ts';

const url=process.env.LEDGER_TEST_DATABASE_URL;
if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Use the disposable ledger test runner.');
const sql=postgres(url,{prepare:false,max:1,onnotice(){}});
after(()=>sql.end());
const migration=fs.readFileSync(new URL('../migrations/20261111203120_realign_expense_categories.sql',import.meta.url),'utf8');
const taxSourceMigration=fs.readFileSync(new URL('../migrations/20261111204842_correct_expense_tax_source_accounts.sql',import.meta.url),'utf8');
const cardSourceMigration=fs.readFileSync(new URL('../migrations/20261111211144_require_no_vendor_bill_for_card_expense.sql',import.meta.url),'utf8');
const catalogMigration=fs.readFileSync(new URL('../migrations/20261111215305_refresh_tchart_catalog.sql',import.meta.url),'utf8');
const seed=fs.readFileSync(new URL('../seed.sql',import.meta.url),'utf8');
const deferred=['EXP-12','EXP-22','EXP-24','EXP-25'];
const lineRows=()=>sql`select rule_code,side,line_order,account_code,account_selector,label,is_optional from public.ledger_rule_lines where rule_code like 'EXP-%' order by rule_code,side`;

test('fresh migration plus seed retains the 22 Expense rules and removes black archive categories',async()=>{
 const rows=await sql`select rule_code,category,sort_order,trigger_name,when_to_post,active from public.ledger_rules where rule_code like 'EXP-%' order by rule_code`;
 assert.equal(rows.length,22);
 assert(rows.every(row=>!deferred.includes(row.rule_code)));
 for(const row of rows){
  const chart=CHART[row.rule_code];assert(chart);
  assert.equal(row.category,'expense');assert.equal(row.sort_order,chart.row);
  assert.equal(row.trigger_name,chart.name.replace(/[\u2013\u2014]/g,'-'));
  if(row.when_to_post){
   assert(row.when_to_post.includes('11:00 PM America/Chicago'));assert(row.when_to_post.includes('Dashboard Sync Button'));
  }else assert(deferred.includes(row.rule_code),'An implemented category must declare its posting trigger.');
  assert.equal(row.active,!deferred.includes(row.rule_code));
 }
 const [{count}]=await sql`select count(*) from public.accounts where code='005.103'`;
 assert.equal(Number(count),0,'Deferred 13th-month classification must not create an unapproved destination account.');
});

test('the operating allowlist has postable debit-normal accounts and current enabled catalog mappings',async()=>{
 const {OPERATING_EXPENSE_ACCOUNTS,OPERATING_EXPENSE_ACCOUNT_MAPPING}=await import('../functions/ledger-daily/rules/expense-accounts.ts');
 const codes=OPERATING_EXPENSE_ACCOUNTS.map(code=>OPERATING_EXPENSE_ACCOUNT_MAPPING[code]??code);
 const accounts=await sql`select code,account_type,normal_balance,is_postable from public.accounts where code in ${sql(codes)} order by code`;
 assert.deepEqual(accounts.map(a=>a.code),[...codes].sort());
 assert(accounts.every(a=>a.account_type==='expense'&&a.normal_balance==='debit'&&a.is_postable));
 const members=await sql`select account_code from public.account_selector_members where selector='operating_expense' order by account_code`;
 assert.deepEqual(members.map(r=>r.account_code),[...codes].sort());
 const [selector]=await sql`select account_selector from public.ledger_rule_lines where rule_code='EXP-01' and side='debit'`;assert.equal(selector.account_selector,'operating_expense');
 const rules=await sql`select rule_code,enabled,dev_notes from public.ledger_rules where rule_code in ('EXP-01','EXP-14')`;
 for(const rule of rules){
  assert.equal(rule.enabled,true);assert(rule.dev_notes.includes('[Implementation]\nFully'));
  for(const account of OPERATING_EXPENSE_ACCOUNTS)assert(rule.dev_notes.includes(account));
 }
 const ids=[];
 for(const [index,account] of OPERATING_EXPENSE_ACCOUNTS.entries()){
  const record='recOpAcct'+String(index).padStart(8,'0');ids.push(record);
  const event={invoiceRecordId:record,eventType:'entry_requested',entryDate:'2026-11-01',categories:[{ruleCode:'EXP-01',entryKey:account,transactionType:'Synthetic operating invoice',postings:[{debitAccount:{number:OPERATING_EXPENSE_ACCOUNT_MAPPING[account]??account},creditAccount:{number:'211.100'},amount:'12.34'}]}]};
  const original=await postPayment(sql,event);assert.equal(original.postedCount,1,account);
 }
 const [{debit,credit}]=await sql`select sum(debit) as debit,sum(credit) as credit from public.journal_lines l join public.journal_entries e on e.id=l.entry_id where e.source_record_id in ${sql(ids)}`;
 assert.equal(Number(debit),456.58);assert.equal(Number(credit),456.58);
});

test('Expense account metadata has one final pair per category, with current payroll/tax and selected-payment selectors',async()=>{
 const rows=await lineRows();assert.equal(rows.length,44);
 for(const code of new Set(rows.map(row=>row.rule_code))){
  const pair=rows.filter(row=>row.rule_code===code);assert.equal(pair.length,2);
  assert.deepEqual(pair.map(row=>row.side),['debit','credit']);assert(pair.every(row=>row.line_order===1));
 }
 const row=(rule,side)=>rows.find(r=>r.rule_code===rule&&r.side===side);
 assert.equal(row('EXP-06','debit').account_selector,'w2_payroll_expense');assert.equal(row('EXP-06','credit').account_code,'211.100');
 assert.equal(row('EXP-13','debit').account_selector,'income_tax_expense');assert.equal(row('EXP-13','credit').account_code,'211.100');
 assert.equal(row('EXP-15','debit').account_code,'004.010');assert.equal(row('EXP-15','credit').account_code,'211.100');
 assert.equal(row('EXP-23','debit').account_code,'241.300');assert.equal(row('EXP-23','credit').account_selector,'expense_payment_account');
 assert.equal(row('EXP-02','credit').account_code,'231.100','The explicit card-purchase credit stays fixed.');
 for(const code of ['EXP-14','EXP-16','EXP-17','EXP-18','EXP-19','EXP-20','EXP-21','EXP-26','EXP-27']){
  assert.equal(row(code,'debit').account_code,'211.100');assert.equal(row(code,'credit').account_selector,'expense_payment_account');
 }
 const expected={w2_payroll_expense:['005.001','005.002','005.003','005.005','005.006'],income_tax_expense:['011.001','011.002'],expense_payment_account:['112.100','112.200','112.300','231.100']};
 for(const[selector,codes]of Object.entries(expected)){
  const members=await sql`select account_code from public.account_selector_members where selector=${selector} order by account_code`;
  assert.deepEqual(members.map(row=>row.account_code),codes);
 }
});

test('reapplying the Expense and current catalog migrations plus seed preserves metadata and existing journals',async()=>{
 const invoiceId='rec00000000009601';
 const event={invoiceRecordId:invoiceId,eventType:'entry_requested',entryDate:'2026-11-01',categories:[{ruleCode:'EXP-15',transactionType:'Synthetic product invoice',postings:[{debitAccount:{number:'004.010'},creditAccount:{number:'211.100'},amount:'5.25'}]}]};
 await postPayment(sql,event);
 const unrelated=async()=>({
  rules:await sql`select to_jsonb(r)-'updated_at' as metadata from public.ledger_rules r where rule_code not like 'EXP-%' order by rule_code`,
  lines:await sql`select * from public.ledger_rule_lines where rule_code not like 'EXP-%' order by id`,
  journals:await sql`select * from public.journal_entries order by id`,
  journalLines:await sql`select * from public.journal_lines order by id`,
 });
 const before=await unrelated(),pairs=await lineRows();
 await sql.unsafe(migration);await sql.unsafe(taxSourceMigration);await sql.unsafe(cardSourceMigration);await sql.unsafe(catalogMigration);await sql.unsafe(seed);
 assert.deepEqual(await unrelated(),before,'Replaying current chart metadata must preserve business metadata, enabled switches and journals.');
 assert.deepEqual(await lineRows(),pairs,'The old seed cannot restore obsolete Expense payroll/tax legs.');
 const removed=await sql`select rule_code,active,enabled from public.ledger_rules where rule_code in ('INV-01','INV-03','INV-04','INV-05','INV-06') order by rule_code`;
 assert.equal(removed.length,0);
 assert(removed.every(row=>!row.active),'Removed chart rows stay available as historical catalog records.');
 assert(removed.every(row=>!row.enabled),'Retired Invoice Entry paths remain disabled after seed replay.');
 const [card]=await sql`select dev_notes from public.ledger_rules where rule_code='EXP-02'`;
 assert(card.dev_notes.includes('Invoices.Mark as No Vendor Bill? = true'));
});

test('Expense tax filters use FIN identities while destination account selectors remain unchanged',async()=>{
 const rows=await sql`select rule_code,dev_notes from public.ledger_rules where rule_code in ('EXP-13','EXP-26')`;
 for(const row of rows){
  const filters=row.dev_notes.split('[Filters]\n')[1]?.split(/\n\n\[/)[0];assert(filters,'Tax filter section must be present.');
  assert(filters.includes('923100: Federal Income Tax'));
  assert(filters.includes('923300: State Income Tax'));
  assert(!filters.includes('011.001'));assert(!filters.includes('011.002'));
  if(row.rule_code==='EXP-13'){
   assert(row.dev_notes.includes('923100: Federal Income Tax -> Supabase 011.001'));
   assert(row.dev_notes.includes('923300: State Income Tax -> Supabase 011.002'));
  }
 }
 const accounts=await sql`select account_code from public.account_selector_members where selector='income_tax_expense' order by account_code`;
 assert.deepEqual(accounts.map(row=>row.account_code),['011.001','011.002']);
});
