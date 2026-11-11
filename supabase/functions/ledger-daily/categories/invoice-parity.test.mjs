import test from 'node:test';
import assert from 'node:assert/strict';
import { invoiceWorkerFields as F, POSTING_FIELDS } from '../definitions.ts';
import { createCategories } from './invoice-entry.js';
import { createCategoryEvaluator, sourceFields } from './index.ts';
import { INVOICE_CATEGORIES } from '../rules/invoice-entry.ts';
import { candidateFormula } from '../queries.ts';
import { sourceDateFilter } from '../scope.ts';
const {TABLES:T,INVOICE_FIELDS:I,PAYMENT_FIELDS:P,SHIPPING_FIELDS:S,MTA_FIELDS:M,ACCOUNT_FIELDS:A}=F;
const links=(...ids)=>ids.map(id=>({id,name:id}));
const id=n=>'rec'+String(n).padStart(14,'0');
class Record {
 constructor(tableId,id,fields){this.tableId=tableId;this.id=id;this.name=id;this.fields=fields;}
 value(f){return this.fields[f]??null;}
 text(f){const v=this.value(f);return v===null?'':Array.isArray(v)?v.map(v=>v?.name??v).join(', '):typeof v==='object'?v.name:String(v);}
}
function fixture(){
 const rows=new Map();const put=(t,n,f)=>{const r=new Record(t,n,f);rows.set(t+'/'+n,r);return r;};
 let next=10;const account=code=>{const a=id(next++);put(T.accounts,a,{[A.number]:code});return a;};
 const invoice=put(T.invoices,id(1),{[I.type]:{name:'AR'},[I.kind]:{name:'Deposit Invoice'},[I.vendorTypeAR]:{name:'AR - Product'},[I.amount]:-123.45,[I.date]:'2026-11-01',[I.branch]:{name:'Chicago'},[I.clients]:links(id(9)),[I.accounts]:links(account('004.002'))});
 const payment=put(T.payments,id(2),{[P.sent]:true,[P.amount]:-60.25,[P.date]:'2026-11-02',[P.invoices]:links(invoice.id),[P.accounts]:links(account('0747')),[P.reference]:'Synthetic payment'});
 const mta=put(T.mtas,id(3),{[M.amount]:10.005,[M.branch]:[{name:'Chicago'}],[M.states]:links(id(8))});
 const mta2=put(T.mtas,id(4),{[M.amount]:10.005,[M.branch]:[{name:'Chicago'}]});
 const shipping=put(T.shipping,id(5),{[S.shipped]:true,[S.date]:'2026-11-03T06:00:00Z',[S.mtas]:links(mta.id,mta2.id),[S.transactions]:links(id(7))});
 const client={async readRecord(t,n){return rows.get(t+'/'+n)??null;},async readRecords(t,ids){return ids.map(n=>{const r=rows.get(t+'/'+n);assert(r,'Missing fixture '+t+'/'+n);return r;});}};
 const evaluate=async code=>{const c=INVOICE_CATEGORIES.find(c=>c.code===code);const source=c.tableId===T.payments?payment:c.tableId===T.shipping?shipping:invoice;return createCategoryEvaluator(client)(c,source);};
 return{invoice,payment,shipping,mta,mta2,client,account,evaluate,put};
}
const cases=[['INV-12','121.100','221.100','-123.45'],['INV-13','0747','121.100','-60.25'],['INV-15','121.100','004.001','-123.45'],['INV-16','0747','121.100','-60.25'],['INV-07','143.300','211.100','-123.45'],['INV-17','211.100','0747','-60.25'],['INV-10','121.100','004.002','-123.45'],['INV-18','0747','121.100','-60.25']];
for(const[code,debit,credit,amount]of cases)test('current Invoice Entry mapping '+code,async()=>{
 const f=fixture();if(['INV-15','INV-16'].includes(code))f.invoice.fields[I.kind]={name:'Full Invoice'};
 if(['INV-07','INV-17'].includes(code)){f.invoice.fields[I.type]={name:'AP'};f.invoice.fields[I.vendorTypeAP]={name:'AP - Assets'};f.invoice.fields[I.accounts]=links(f.account('143.300'));}
 if(['INV-10','INV-18'].includes(code))f.invoice.fields[I.vendorTypeAR]={name:'AR - Non-Product'};
 const packet=await f.evaluate(code);assert(packet);const p=packet.categories[0].postings[0];
 assert.equal(p.debitAccount.number,debit);assert.equal(p.creditAccount.number,credit);assert.equal(p.amount,amount);
 assert.equal(packet.source.recordId,code==='INV-13'||code==='INV-16'||code==='INV-17'||code==='INV-18'?f.payment.id:f.invoice.id);
 assert.deepEqual(p.clientRecordIds,[id(9)]);assert(!packet.categories.some(c=>c.notes));
 assert.equal(packet.entryDate,packet.paymentRecordId?'2026-11-02':'2026-11-01');
});
test('shipment sums extended selling values before rounding and owns its journal',async()=>{
 const f=fixture(),packet=await f.evaluate('INV-14');assert.equal(packet.shippingRecordId,f.shipping.id);assert.equal(packet.invoiceRecordId,undefined);assert.equal(packet.paymentRecordId,undefined);assert.equal(packet.eventType,'created');assert.equal(packet.entryDate,'2026-11-03');
 const p=packet.categories[0].postings[0];assert.equal(p.amount,'20.01');assert.equal(p.debitAccount.number,'221.100');assert.equal(p.creditAccount.number,'004.001');assert.deepEqual(p.branch,['Chicago']);assert.deepEqual(p.transactionRecordIds,[id(7)]);assert.deepEqual(p.stateRecordIds,[id(8)]);
 f.mta.fields[M.amount]=-10.005;f.mta2.fields[M.amount]=-10.005;assert.equal((await f.evaluate('INV-14')).categories[0].postings[0].amount,'-20.01');
});
test('filters reject unsent, canceled, wrong kinds and unrelated asset accounts',async()=>{
 const f=fixture();f.payment.fields[P.sent]=false;assert.equal(await f.evaluate('INV-13'),null);f.payment.fields[P.sent]=true;
 f.invoice.fields[I.cancelled]=true;assert.equal(await f.evaluate('INV-12'),null);assert.equal(await f.evaluate('INV-13'),null);f.invoice.fields[I.cancelled]=false;
 f.invoice.fields[I.kind]={name:'Balance Invoice'};assert.equal(await f.evaluate('INV-12'),null);assert(await f.evaluate('INV-15'));
 f.invoice.fields[I.type]={name:'AP'};f.invoice.fields[I.vendorTypeAP]={name:'AP - Assets'};assert.equal(await f.evaluate('INV-07'),null);
 f.invoice.fields[I.accounts]=links(f.account('143.300'));f.invoice.fields[I.prepaid]=true;assert.equal(await f.evaluate('INV-07'),null);assert.equal(await f.evaluate('INV-17'),null);
});
test('non-product credit is dynamic, multiple accounts fail and full payment is never allocated',async()=>{
 const f=fixture();f.invoice.fields[I.vendorTypeAR]={name:'AR - Non-Product'};f.invoice.fields[I.accounts]=links(f.account('010.003'));assert.equal((await f.evaluate('INV-10')).categories[0].postings[0].creditAccount.number,'010.003');
 f.invoice.fields[I.accounts].push(...links(f.account('004.002')));await assert.rejects(()=>f.evaluate('INV-10'),/exactly one/);
 f.payment.fields[P.invoices].push(...links(f.put(T.invoices,id(6),{...f.invoice.fields}).id));const p=await f.evaluate('INV-18');assert.equal(p.categories[0].postings.length,1);assert.equal(p.categories[0].postings[0].amount,'-60.25');
});
test('AR non-product invoices do not also qualify for the product invoice-kind rules',async()=>{
 const f=fixture();f.invoice.fields[I.vendorTypeAR]={name:'AR - Non-Product'};
 assert.equal(await f.evaluate('INV-12'),null);assert.equal(await f.evaluate('INV-13'),null);
 f.invoice.fields[I.kind]={name:'Full Invoice'};assert.equal(await f.evaluate('INV-15'),null);assert.equal(await f.evaluate('INV-16'),null);
 assert(await f.evaluate('INV-10'));assert(await f.evaluate('INV-18'));
});
test('shipping refuses missing valuations and skips unshipped records',async()=>{
 const f=fixture();f.shipping.fields[S.shipped]=false;assert.equal(await f.evaluate('INV-14'),null);f.shipping.fields[S.shipped]=true;
 f.mta.fields[M.amount]=null;await assert.rejects(()=>f.evaluate('INV-14'),/Extended Sell Price/);
 f.shipping.fields[S.mtas]=[];await assert.rejects(()=>f.evaluate('INV-14'),/no linked MTAs/);
});
test('source selection, dates, linked discovery and retired/deferred routes follow the new sheet',async()=>{
 const q={field:(_t,f)=>'{'+f+'}',eq:(_t,f,v)=>'{'+f+'}='+JSON.stringify(v),includes:(_t,f,v)=>'FIND('+JSON.stringify(v)+',{'+f+'})>0'};
 for(const c of INVOICE_CATEGORIES.filter(c=>c.status!=='deferred')){const fields=sourceFields(c);for(const id of Object.values(POSTING_FIELDS[c.tableId]))assert(fields.includes(id));assert(candidateFormula(c,q).includes(c.code));}
 const ship=INVOICE_CATEGORIES.find(c=>c.code==='INV-14');assert(sourceDateFilter(ship,q).includes(S.date));assert(ship.filter(q).includes(S.shipped));
 for(const code of ['INV-13','INV-16','INV-17','INV-18']){const c=INVOICE_CATEGORIES.find(c=>c.code===code);assert.equal(c.related.tableId,T.invoices);assert.equal(c.related.linksFieldId,I.payments);}
 for(const code of ['INV-01','INV-03','INV-04','INV-05','INV-06'])assert(!INVOICE_CATEGORIES.some(c=>c.code===code));
 const f=fixture();for(const c of INVOICE_CATEGORIES.filter(c=>c.status==='deferred'))await assert.rejects(()=>createCategories(f.client).evaluate(c.code,f.invoice.id),/Not yet implemented/);
});
