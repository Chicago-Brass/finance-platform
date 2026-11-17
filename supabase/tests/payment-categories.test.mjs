import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postgres from 'postgres';
import {fixture} from '../functions/ledger-daily/categories/payment-fixture.mjs';
import {paymentWorkerFields as F} from '../functions/ledger-daily/definitions.ts';
import {PAYMENT_CATEGORIES} from '../functions/ledger-daily/rules/payments.ts';
import {CHART} from '../functions/ledger-daily/rules/chart.ts';
import {postPayment} from '../functions/ledger-payment/ledger.ts';
import {reverseJournals} from '../functions/ledger-reversal/reversal.ts';
const url=process.env.LEDGER_TEST_DATABASE_URL;
if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Use the disposable ledger test runner.');
const sql=postgres(url,{prepare:false,max:1,onnotice(){}});after(()=>sql.end());
const {INVOICE_FIELDS:I,PAYMENT_FIELDS:P,LINE_FIELDS:L,TABLES:T}=F;
const links=(...ids)=>ids.map(id=>({id,name:id}));
const changes={
 'PAY-03':f=>{f.invoice.fields[I.type]={name:'AR'};f.invoice.fields[I.vendorTypeAR]={name:'AR - Refund/Credit'};},
 'PAY-28':f=>{f.invoice.fields[I.type]={name:'AR'};f.invoice.fields[I.creditsApplied]=-20;f.invoice.fields[I.sourceCredits]=links('credit');f.put(T.invoices,'credit',{[I.application]:{name:'Credit to Another Order'}});},
 'PAY-29':f=>{f.invoice.fields[I.type]={name:'AR'};f.invoice.fields[I.vendorTypeAR]={name:'AR - Refund/Credit'};f.invoice.fields[I.application]={name:'Cash Refund'};},
 'PAY-08':f=>{f.invoice.fields[I.vendorTypeAP]={name:'AP - Product'};f.payment.fields[P.accounts]=links(f.account('231.100'));},
 'PAY-09':f=>{f.payment.fields[P.recordType]={name:'CC Batch Payment'};},
 'PAY-10':f=>{f.line.fields[L.type]={name:'Discount'};},
 'PAY-11':f=>{f.payment.fields[P.amount]=0;f.payment.fields[P.accounts]=[];f.invoice.fields[I.creditsApplied]=-10.01;f.invoice.fields[I.sourceCredits]=links('credit');f.put(T.invoices,'credit',{[I.type]:{name:'AP'},[I.vendorTypeAP]:{name:'AP - Credit'},[I.creditAvailable]:-10.01});},
 'PAY-12':f=>{f.payment.fields[P.recordType]={name:'Return Payment'};},
 'PAY-30':f=>{f.payment.fields[P.recordType]={name:'Repayment'};},
 'PAY-13':f=>{f.invoice.fields[I.vendorTypeAP]={name:'AP - Refund'};},
 'PAY-20':f=>{f.invoice.fields[I.vendorTypeAP]={name:'AP - Expenses (Non-Sales Tax)'};f.invoice.fields[I.accounts]=links(f.account('316.100'));},
 'PAY-21':f=>{f.invoice.fields[I.type]={name:'AR'};f.invoice.fields[I.accounts]=links(f.account('311.200'));},
 'PAY-23':f=>{f.invoice.fields[I.type]={name:'AR'};f.invoice.fields[I.accounts]=links(f.account('004.004'));},
 'PAY-32':()=>{},'PAY-24':()=>{},
 'PAY-27':f=>{f.invoice.fields[I.type]={name:'AR'};f.invoice.fields[I.accounts]=links(f.account('004.011'));f.payment.fields[P.accounts]=links(f.account('231.100'));f.invoice.fields[I.lines]=[];},
};
for(const [code,change]of Object.entries(changes))test('current category posts once and reverses its stored signed pairs: '+code,async()=>{
 const f=fixture();change(f);let event=await f.evaluate(code);assert(event);
 const owner=event.source.recordId,id='rec'+String(7000+Number(code.slice(4))).padStart(14,'0');
 event=JSON.parse(JSON.stringify(event,(_k,v)=>v===owner?id:v));
 const first=await postPayment(sql,event,{allowAdditionalCategories:true});assert.equal(first.postedCount,event.categories.length);
 if(code==='PAY-27'){
  assert.equal(event.source.tableId,T.payments);assert.equal(event.paymentRecordId,id);assert.equal(event.invoiceRecordId,undefined);
  const [stored]=await sql`select source_table,source_record_id from public.journal_entries where source_record_id=${id}`;
  assert.equal(stored.source_table,T.payments);assert.equal(stored.source_record_id,id);
 }
 const second=await postPayment(sql,event,{allowAdditionalCategories:true});assert.equal(second.postedCount,0);assert.equal(second.duplicateCount,event.categories.length);
 const original=await sql`select l.* from public.journal_lines l join public.journal_entries e on e.id=l.entry_id where e.source_record_id=${id}`;
 const total=original.reduce((n,l)=>n+Number(l.debit)-Number(l.credit),0);assert(Math.abs(total)<0.000001);
 const reversed=await reverseJournals(sql,{source:event.source,reversalDate:'2026-11-03'});assert.equal(reversed.reversedCount,event.categories.length);
 const retry=await reverseJournals(sql,{source:event.source,reversalDate:'2026-11-03'});assert.equal(retry.reversedCount,0);
 const net=await sql`select account_code,sum(l.debit-l.credit) as net from public.journal_lines l join public.journal_entries e on e.id=l.entry_id where e.source_record_id=${id} group by account_code`;
 assert(net.every(r=>Number(r.net)===0),'Original and reversal net to zero by account.');
});
test('all 18 Payment handlers retain their codes after presentation families move sheets',async()=>{
 const codes=PAYMENT_CATEGORIES.map(c=>c.code).sort();
 const rows=await sql`select rule_code,category,sort_order,enabled,active,reversible from public.ledger_rules where rule_code in ${sql(codes)} order by rule_code`;
 assert.equal(rows.length,18);assert.deepEqual(rows.map(r=>r.rule_code),codes);
 assert(rows.every(r=>r.reversible));
 for(const row of rows){const chart=CHART[row.rule_code];assert.equal(row.sort_order,chart.row);assert.equal(row.category,chart.sheet==='Category - Expenses'?'expense':chart.sheet==='Category - Invoice Entry'?'invoice_entry':'payment');}
});
test('Payment catalog replay preserves current journals and line identities',async()=>{
 const migration=fs.readFileSync(new URL('../migrations/20261117004333_realign_payment_categories.sql',import.meta.url),'utf8');
 const snapshot=async()=>({entries:await sql`select * from public.journal_entries order by id`,lines:await sql`select * from public.journal_lines order by id`,pairs:await sql`select * from public.ledger_rule_lines where rule_code like 'PAY-%' order by id`});
 const before=await snapshot();await sql.unsafe(migration);
 for(const file of ['20261117154803_finalize_client_credit_invoice.sql','20261117161119_split_product_card_payments.sql','20261117163113_gross_product_invoice_and_discount.sql','20261117165116_finalize_vendor_return_repayment.sql','20261117170408_align_cashback_invoice_source.sql','20261117170653_route_cashback_exclusively.sql','20261117171614_route_payments_by_record_type.sql','20261117173507_route_cashback_from_payment.sql','20261117180046_route_owner_contribution_exclusively.sql','20261117181253_align_insurance_claim_account.sql'])await sql.unsafe(fs.readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 await sql.unsafe(fs.readFileSync(new URL('../migrations/20261117225315_align_grouped_tchart_catalog.sql',import.meta.url),'utf8'));
 assert.deepEqual(await snapshot(),before);
});
