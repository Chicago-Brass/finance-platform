import test from 'node:test';
import assert from 'node:assert/strict';
import {createCategoryEvaluator,sourceFields} from './index.ts';
import {CATEGORIES,candidateFormula} from '../queries.ts';
import {sourceDateFilter} from '../scope.ts';
import {MANUAL_TABLE as T,MANUAL_FIELDS as F,MANUAL_LINE_TABLE as LT,MANUAL_LINE_FIELDS as L,invoiceWorkerFields as I,expenseWorkerFields as E,paymentWorkerFields as P} from '../definitions.ts';
const links=(...ids)=>ids.map(id=>({id,name:id}));
const id=n=>'rec'+String(n).padStart(14,'0');
class Record{constructor(tableId,id,fields){this.tableId=tableId;this.id=id;this.name=id;this.fields=fields;}value(f){return this.fields[f]??null;}text(f){const v=this.value(f);return v==null?'':Array.isArray(v)?v.map(x=>x?.name??x).join(', '):typeof v==='object'?v.name:String(v);}}
function fixture(){
 const rows=new Map(),reads=[];const put=(t,id,fields)=>{const r=new Record(t,id,fields);rows.set(t+'/'+id,r);return r;};
 const account=code=>{put(I.TABLES.accounts,code,{[I.ACCOUNT_FIELDS.number]:code});return code;};
 const parent=put(T,id(1),{[F.date]:'2026-11-18',[F.branch]:{name:'Chicago'},[F.lines]:links(id(2),id(3)),[F.invoices]:links(id(4))});
 const invoice=put(I.TABLES.invoices,id(4),{[I.INVOICE_FIELDS.manualJournals]:links(parent.id),[I.INVOICE_FIELDS.date]:'1999-01-01',[I.INVOICE_FIELDS.amount]:99999});
 for(const field of [I.INVOICE_FIELDS.vendors,I.INVOICE_FIELDS.clients,I.INVOICE_FIELDS.staff,I.INVOICE_FIELDS.transactions,I.INVOICE_FIELDS.purchaseOrders,I.INVOICE_FIELDS.states])invoice.fields[field]=links(id(50));
 const line=put(LT,id(2),{[L.parents]:links(parent.id),[L.amount]:100.005,[L.debit]:links(account('006.002')),[L.credit]:links(account('112.100'))});
 const second=put(LT,id(3),{[L.parents]:links(parent.id),[L.amount]:-25.25,[L.debit]:links(account('005.001')),[L.credit]:links(account('211.100'))});
 const client={async readRecord(t,id){return rows.get(t+'/'+id)??null;},async readRecords(t,ids){reads.push({table:t,ids:[...ids]});return [...new Set(ids)].map(id=>{const r=rows.get(t+'/'+id);if(!r)throw Error('Missing fixture '+t+'/'+id);return r;});}};
 const evaluate=createCategoryEvaluator(client);const rule=CATEGORIES.find(c=>c.code==='MAN-01');
 return{parent,invoice,line,second,put,rows,reads,client,rule,evaluate,manual:()=>evaluate(rule,parent)};
}
test('one manual parent produces one complete journal using its own date/branch and linked invoice references',async()=>{
 const f=fixture(),event=await f.manual();assert.equal(event.manualJournalRecordId,f.parent.id);assert.equal(event.invoiceRecordId,undefined);assert.deepEqual(event.source,{tableId:T,recordId:f.parent.id,recordName:f.parent.id});
 assert.equal(event.entryDate,'2026-11-18');assert.equal(event.categories.length,1);const journal=event.categories[0];assert.equal(journal.ruleCode,'MAN-01');assert.equal(journal.entryKey,undefined);assert.equal(journal.postings.length,2);
 assert.deepEqual(journal.postings.map(p=>[p.debitAccount.number,p.creditAccount.number,p.amount]),[['006.002','112.100','100.01'],['005.001','211.100','-25.25']]);
 for(const p of journal.postings){assert.equal(p.branch,'Chicago');assert.deepEqual(p.invoiceRecordIds,[f.invoice.id]);for(const k of ['vendorRecordIds','clientRecordIds','staffRecordIds','transactionRecordIds','poRecordIds','stateRecordIds'])assert.deepEqual(p[k],[id(50)]);}
 assert.deepEqual(journal.postings.map(p=>p.sourceRecordId),[f.line.id,f.second.id]);
});
test('manual entry without an invoice or branch still posts its supplied pairs',async()=>{
 const f=fixture();f.parent.fields[F.invoices]=[];delete f.parent.fields[F.branch];const event=await f.manual();for(const p of event.categories[0].postings){assert.equal(p.branch,undefined);assert.deepEqual(p.invoiceRecordIds,[]);assert.deepEqual(p.vendorRecordIds,[]);}
});
test('manual journal resolves all unique accounts in one bounded batch',async()=>{
 const f=fixture();const event=await f.manual();const reads=f.reads.filter(read=>read.table===I.TABLES.accounts);
 assert.equal(reads.length,1);assert.deepEqual([...reads[0].ids].sort(),['005.001','006.002','112.100','211.100']);assert.equal(event.categories[0].postings.length,2);
});
test('manual account mapping uses the same FIN tax and undotted account identities as existing categories',async()=>{
 for(const [source,target]of [['923100','011.001'],['923300','011.002'],['525300','525.300'],['922000','922.000']]){
  const f=fixture();f.put(I.TABLES.accounts,source,{[I.ACCOUNT_FIELDS.number]:source});f.line.fields[L.debit]=links(source);assert.equal((await f.manual()).categories[0].postings[0].debitAccount.number,target);
 }
});
for(const [field,value]of [[F.date,null],[F.cancelled,true],[F.posted,true],[F.reverseDate,'2026-11-18']])test('manual parent eligibility rejects '+field,async()=>{const f=fixture();f.parent.fields[field]=value;assert.equal(await f.manual(),null);});
test('manual entries validate all lines, ownership and account cardinality before returning a packet',async()=>{
 for(const amount of [null,0,NaN,Infinity,1e17]){const f=fixture();f.second.fields[L.amount]=amount;await assert.rejects(f.manual,/Line Amount/);}
 for(const field of [L.debit,L.credit]){const f=fixture();f.second.fields[field]=[];await assert.rejects(f.manual,/one debit account and one credit account/);f.second.fields[field]=links('006.002','005.001');await assert.rejects(f.manual,/one debit account and one credit account/);}
 const f=fixture();f.second.fields[L.parents]=links(id(99));await assert.rejects(f.manual,/belong to this manual journal/);f.parent.fields[F.lines]=[];await assert.rejects(f.manual,/at least one Journal Line/);
});
test('manual query, accounting date and source fields use the parent approval controls',()=>{
 const f=fixture(),q={field:(_t,f)=>`{${f}}`,eq:(_t,f,v)=>`{${f}}=${v}`,dateRange:{from:'2026-11-17',to:'2026-11-18'}};
 const formula=candidateFormula(f.rule,q);assert(formula.includes(`LEN({${F.date}}&"")>0`));assert(formula.includes(`{${F.posted}}=0`));assert(formula.includes(`{${F.cancelled}}=0`));assert(sourceDateFilter(f.rule,q).includes(F.date));for(const field of Object.values(F))assert(sourceFields(f.rule).includes(field));
});
test('all invoice, invoice-line and payment T-Charts skip manual invoices, including whole mixed payments',async()=>{
 const f=fixture(),normal=f.put(I.TABLES.invoices,id(5),{}),line=f.put(E.TABLES.lines,id(6),{[E.LINE_FIELDS.invoices]:links(f.invoice.id)}),payment=f.put(E.TABLES.payments,id(7),{[E.PAYMENT_FIELDS.invoices]:links(normal.id,f.invoice.id),[P.PAYMENT_FIELDS.miniPayments]:[]});
 for(const c of CATEGORIES.filter(c=>c.module!=='manual')){
  const source=c.tableId===I.TABLES.invoices?f.invoice:c.tableId===E.TABLES.lines?line:c.tableId===E.TABLES.payments?payment:null;
  if(source)assert.equal(await f.evaluate(c,source),null,c.code);
 }
});
test('CC batch mini-payments, prepaid logs and shipping also exclude manual-linked invoices',async()=>{
 const f=fixture(),mini=f.put(E.TABLES.payments,id(7),{[E.PAYMENT_FIELDS.invoices]:links(f.invoice.id)}),batch=f.put(E.TABLES.payments,id(8),{[E.PAYMENT_FIELDS.invoices]:[],[P.PAYMENT_FIELDS.miniPayments]:links(mini.id)});
 assert.equal(await f.evaluate(CATEGORIES.find(c=>c.code==='PAY-09'),batch),null);
 const prepay=f.put(E.TABLES.prepay,id(9),{[E.PREPAY_FIELDS.invoices]:links(f.invoice.id)});assert.equal(await f.evaluate(CATEGORIES.find(c=>c.code==='EXP-04'),prepay),null);
 const txn=f.put(I.TABLES.transactions,id(10),{[I.TRANSACTION_FIELDS.invoices]:links(f.invoice.id)}),shipping=f.put(I.TABLES.shipping,id(11),{[I.SHIPPING_FIELDS.transactions]:links(txn.id)});assert.equal(await f.evaluate(CATEGORIES.find(c=>c.code==='INV-14'),shipping),null);
});
