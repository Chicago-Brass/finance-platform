import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import fs from 'node:fs';
import postgres from 'postgres';
import {postPayment} from '../functions/ledger-payment/ledger.ts';
import {reverseJournals} from '../functions/ledger-reversal/reversal.ts';
import {CHART} from '../functions/ledger-daily/rules/chart.ts';
const url=process.env.LEDGER_TEST_DATABASE_URL;
if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Use the disposable ledger test runner.');
const sql=postgres(url,{prepare:false,max:1,onnotice(){}});after(()=>sql.end());
const migration=fs.readFileSync(new URL('../migrations/20261111231329_finalize_expense_invoice_rules.sql',import.meta.url),'utf8');
test('only the 27 fully implemented Expense and Invoice Entry rules are enabled',async()=>{
 const rows=await sql`select rule_code,enabled from public.ledger_rules where category in ('expense','invoice_entry')`;
 assert.equal(rows.length,37);assert.equal(rows.filter(r=>r.enabled).length,27);
 for(const row of rows)assert.equal(row.enabled,CHART[row.rule_code].status==='Fully',row.rule_code);
 const removed=await sql`select rule_code from public.ledger_rules where rule_code in ('EXP-08','INV-02','INV-11','INV-01','INV-03','INV-04','INV-05','INV-06')`;
 assert.equal(removed.length,0);
});
test('cleanup retains a referenced historical rule and preserves reversal while disabling new posting',async()=>{
 const recordId='rec00000000006605';
 await sql`insert into public.ledger_rules(rule_code,category,sort_order,trigger_name,reversible,enabled) values('INV-01','invoice_entry',999,'Synthetic historical category',true,true)`;
 try{
  const event={invoiceRecordId:recordId,eventType:'entry_requested',entryDate:'2026-11-01',categories:[{ruleCode:'INV-01',transactionType:'Historical test',postings:[{debitAccount:{number:'121.100'},creditAccount:{number:'221.100'},amount:'9.25'}]}]};
  const original=await postPayment(sql,event);
  await sql.unsafe(migration);
  const [rule]=await sql`select active,enabled from public.ledger_rules where rule_code='INV-01'`;
  assert.equal(rule.active,false);assert.equal(rule.enabled,false);
  const [{count}]=await sql`select count(*) from public.journal_entries where id=${original.journalEntryIds[0]}::uuid`;assert.equal(Number(count),1);
  const result=await reverseJournals(sql,{source:{tableId:'tbldQXuqNEp8G5pfs',recordId},reversalDate:'2026-11-02'});assert.equal(result.reversedCount,1);
 }finally{
  await sql`delete from public.journal_entries where source_record_id=${recordId} and reverses_entry_id is not null`;
  await sql`delete from public.journal_entries where source_record_id=${recordId}`;
  await sql`delete from public.ledger_rules where rule_code='INV-01'`;
 }
});
