import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import postgres from 'postgres';
import { postPayment } from '../functions/ledger-payment/ledger.ts';
import { reverseJournals } from '../functions/ledger-reversal/reversal.ts';

const url=process.env.LEDGER_TEST_DATABASE_URL;
if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Use the disposable ledger test runner.');
const sql=postgres(url,{prepare:false,max:2,onnotice(){}});
after(()=>sql.end());
const table='tblR61NG9i0giid28';
const event=(id,amount='10.00')=>({paymentRecordId:id,eventType:'sent',entryDate:'2026-11-01',categories:[{
  ruleCode:'PAY-07',transactionType:'Journal deletion check',postings:[{debitAccount:{number:'211.100'},creditAccount:{number:'112.100'},amount}],
}]});

test('deleting selected posted journals cascades their lines and preserves unrelated journals',async()=>{
  const value=event('recDeleteSelected');
  value.categories=[{...value.categories[0],entryKey:'first'},{...value.categories[0],entryKey:'second'}];
  const selected=await postPayment(sql,value),other=await postPayment(sql,event('recDeleteUnrelated','-5.00'));
  const deleted=await sql.begin(async tx=>{
    await tx`set local role service_role`;
    return tx`delete from public.journal_entries where id=any(${selected.journalEntryIds}::uuid[]) returning id`;
  });
  assert.equal(deleted.length,2);
  const [remaining]=await sql`select count(*) as n from public.journal_lines where entry_id=any(${selected.journalEntryIds}::uuid[])`;
  assert.equal(Number(remaining.n),0);
  const [untouched]=await sql`select count(*) as n from public.journal_lines where entry_id=${other.journalEntryIds[0]}::uuid`;
  assert.equal(Number(untouched.n),2);
  await sql`delete from public.journal_entries where id=${other.journalEntryIds[0]}::uuid`;
});

test('posted edits and direct deletion of individual posted lines remain blocked',async()=>{
  const result=await postPayment(sql,event('recDeleteProtected')),id=result.journalEntryIds[0];
  await assert.rejects(()=>sql`update public.journal_entries set notes='changed' where id=${id}::uuid`,/immutable/);
  await assert.rejects(()=>sql`update public.journal_lines set notes='changed' where entry_id=${id}::uuid`,/cannot be changed/);
  await assert.rejects(()=>sql`delete from public.journal_lines where entry_id=${id}::uuid`,/cannot be changed/);
  const [lines]=await sql`select count(*) as n from public.journal_lines where entry_id=${id}::uuid`;
  assert.equal(Number(lines.n),2);
});

test('deletion preserves reversal ownership constraints',async()=>{
  const value=event('recDeleteReversed'),posted=await postPayment(sql,value),id=posted.journalEntryIds[0];
  const reversal=await reverseJournals(sql,{source:{tableId:table,recordId:value.paymentRecordId},journalEntryIds:[id],reversalDate:'2026-11-09'});
  await assert.rejects(()=>sql`delete from public.journal_entries where id=${id}::uuid`,error=>error.code==='23503');
  await sql`delete from public.journal_entries where id=${reversal.reversalJournalEntryIds[0]}::uuid`;
  await sql`delete from public.journal_entries where id=${id}::uuid`;
});

test('anonymous callers gain no deletion permission',async()=>{
  await assert.rejects(()=>sql.begin(async tx=>{
    await tx`set local role anon`;
    return tx`delete from public.journal_entries where false`;
  }),error=>error.code==='42501');
});
