import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import postgres from 'postgres';
import {postPayment} from './ledger.ts';
import {reverseJournals} from '../ledger-reversal/reversal.ts';
import {enabledRuleCodes} from '../ledger-daily/store.ts';

const url=process.env.LEDGER_TEST_DATABASE_URL;
if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Use the disposable ledger test runner.');
const sql=postgres(url,{prepare:false,max:1,onnotice(){}});
after(()=>sql.end());
const invoiceTable='tbldQXuqNEp8G5pfs';
const category=ruleCode=>({ruleCode,transactionType:'Synthetic category toggle',postings:[{debitAccount:{number:'004.010'},creditAccount:{number:'211.100'},amount:'5.25'}]});
const event=recordId=>({invoiceRecordId:recordId,eventType:'entry_requested',entryDate:'2026-11-01',categories:[category('EXP-15')]});

test('existing and newly registered rules default enabled without changing the active label',async()=>{
 const retired=await sql`select enabled from public.ledger_rules where rule_code in ('INV-01','INV-03','INV-04','INV-05','INV-06','INV-02','INV-08','INV-09','INV-11')`;
 assert.equal(retired.length,2,'Only red Invoice Entry rules remain; black and obsolete rows are removed.');
 assert(retired.every(rule=>!rule.enabled));
 await sql`insert into public.ledger_rules (rule_code,category,sort_order,trigger_name,active) values ('TEST-ENABLED','expense',999,'Synthetic toggle default',false)`;
 try {
  const [rule]=await sql`select enabled,active from public.ledger_rules where rule_code='TEST-ENABLED'`;
  assert.equal(rule.enabled,true);assert.equal(rule.active,false);
 } finally { await sql`delete from public.ledger_rules where rule_code='TEST-ENABLED'`; }
});

test('disabled rules reject new journals atomically but retain exact replays and reversals',async()=>{
 const original=event('rec00000000099001');
 const first=await postPayment(sql,original);assert.equal(first.postedCount,1);
 const [prior]=await sql`select enabled,active from public.ledger_rules where rule_code='EXP-15'`;
 try {
  await sql`update public.ledger_rules set enabled=false where rule_code='EXP-15'`;
  assert(!(await enabledRuleCodes(sql)).has('EXP-15'));
  assert.equal((await postPayment(sql,structuredClone(original))).duplicateCount,1);
  const changed=structuredClone(original);changed.categories[0].postings[0].amount='5.26';
  await assert.rejects(()=>postPayment(sql,changed),error=>error.code==='23505');
  const fresh=event('rec00000000099002');
  await assert.rejects(()=>postPayment(sql,fresh),/EXP-15 is disabled for new postings/);
  const mixed=event('rec00000000099003');mixed.categories.unshift(category('EXP-11'));
  await assert.rejects(()=>postPayment(sql,mixed),/EXP-15 is disabled for new postings/);
  const [{count}]=await sql`select count(*) from public.journal_entries where source_record_id in ('rec00000000099002','rec00000000099003')`;
  assert.equal(Number(count),0,'A disabled later category cannot leave another category partially posted.');
  const reversed=await reverseJournals(sql,{source:{tableId:invoiceTable,recordId:original.invoiceRecordId},reversalDate:'2026-11-02'});
  assert.equal(reversed.reversedCount,1);assert.equal(reversed.reversalJournalEntryIds.length,1);
  await sql`update public.ledger_rules set enabled=true,active=false where rule_code='EXP-15'`;
  assert((await enabledRuleCodes(sql)).has('EXP-15'));
  assert.equal((await postPayment(sql,event('rec00000000099004'))).postedCount,1,'active remains a label.');
 } finally {
  await sql`update public.ledger_rules set enabled=${prior.enabled},active=${prior.active} where rule_code='EXP-15'`;
 }
});
