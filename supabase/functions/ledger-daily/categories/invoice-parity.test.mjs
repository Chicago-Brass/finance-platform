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
 const invoice=put(T.invoices,id(1),{[I.type]:{name:'AR'},[I.kind]:{name:'Deposit Invoice'},[I.vendorTypeAR]:{name:'AR - Product'},[I.amount]:-123.45,[I.paymentProportion]:1,[I.date]:'2026-11-01',[I.branch]:{name:'Chicago'},[I.clients]:links(id(9)),[I.accounts]:links(account('004.002'))});
 const payment=put(T.payments,id(2),{[P.sent]:true,[P.recordType]:{name:'Regular Payment'},[P.amount]:-60.25,[P.date]:'2026-11-02',[P.invoices]:links(invoice.id),[P.accounts]:links(account('0747')),[P.reference]:'Synthetic payment'});
 const mta=put(T.mtas,id(3),{[M.amount]:10.005,[M.branch]:[{name:'Chicago'}],[M.states]:links(id(8))});
 const mta2=put(T.mtas,id(4),{[M.amount]:10.005,[M.branch]:[{name:'Chicago'}]});
 const shipping=put(T.shipping,id(5),{[S.shipped]:true,[S.date]:'2026-11-03T06:00:00Z',[S.mtas]:links(mta.id,mta2.id),[S.transactions]:links(id(7))});
 const client={async readRecord(t,n){return rows.get(t+'/'+n)??null;},async readRecords(t,ids){return ids.map(n=>{const r=rows.get(t+'/'+n);assert(r,'Missing fixture '+t+'/'+n);return r;});}};
 const depositBalance={cents:500000};
 put(T.transactions,id(7),{[F.TRANSACTION_FIELDS.invoices]:links(invoice.id)});
 const evaluate=async code=>{const c=INVOICE_CATEGORIES.find(c=>c.code===code);const source=c.tableId===T.payments?payment:c.tableId===T.shipping?shipping:invoice;return createCategoryEvaluator(client,async()=>depositBalance.cents)(c,source);};
 return{invoice,payment,shipping,mta,mta2,client,account,evaluate,put,depositBalance};
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
test('vendor credits negate the source amount and retain invoice ownership and references',async()=>{
 const f=fixture(),category=INVOICE_CATEGORIES.find(c=>c.code==='INV-08');
 f.invoice.fields[I.type]={name:'AP'};f.invoice.fields[I.vendorTypeAP]={name:'AP - Credit'};
 f.invoice.fields[I.vendors]=links(id(30));f.invoice.fields[I.staff]=links(id(31));f.invoice.fields[I.transactions]=links(id(32));f.invoice.fields[I.purchaseOrders]=links(id(33));f.invoice.fields[I.states]=links(id(34));
 for(const [source,amount]of [[-123.45,'123.45'],[123.45,'-123.45']]){
  f.invoice.fields[I.amount]=source;
  const packet=await createCategoryEvaluator(f.client)(category,f.invoice),p=packet.categories[0].postings[0];
  assert.equal(packet.source.tableId,T.invoices);assert.equal(packet.source.recordId,f.invoice.id);assert.equal(packet.invoiceRecordId,f.invoice.id);assert.equal(packet.paymentRecordId,undefined);
  assert.equal(packet.entryDate,'2026-11-01');assert.equal(p.amount,amount);assert.equal(p.debitAccount.number,'211.100');assert.equal(p.creditAccount.number,'131.400');
  assert.deepEqual(p.vendorRecordIds,[id(30)]);assert.deepEqual(p.clientRecordIds,[id(9)]);assert.deepEqual(p.staffRecordIds,[id(31)]);assert.deepEqual(p.transactionRecordIds,[id(32)]);assert.deepEqual(p.poRecordIds,[id(33)]);assert.deepEqual(p.stateRecordIds,[id(34)]);assert.deepEqual(p.branch,['Chicago']);
 }
 for(const mutate of [()=>f.invoice.fields[I.type]={name:'AR'},()=>{f.invoice.fields[I.type]={name:'AP'};f.invoice.fields[I.vendorTypeAP]={name:'AP - Product'};},()=>{f.invoice.fields[I.vendorTypeAP]={name:'AP - Credit'};f.invoice.fields[I.cancelled]=true;}]){
  mutate();assert.equal(await createCategoryEvaluator(f.client)(category,f.invoice),null);
 }
 f.invoice.fields[I.cancelled]=false;f.invoice.fields[I.purchaseOrders]=[];assert.equal(await createCategoryEvaluator(f.client)(category,f.invoice),null);f.invoice.fields[I.purchaseOrders]=links(id(33));
 const q={field:(_t,f)=>'{'+f+'}',eq:(_t,f,v)=>'{'+f+'}='+JSON.stringify(v),includes:(_t,f,v)=>'FIND('+JSON.stringify(v)+',{'+f+'})>0'};assert.equal(category.status,'implemented');assert(category.filter(q).includes(I.purchaseOrders));assert(category.filter(q).includes('AP - Credit'));
 f.invoice.fields[I.amount]=0;assert.equal(await createCategoryEvaluator(f.client)(category,f.invoice),null);
 f.invoice.fields[I.amount]=null;await assert.rejects(()=>createCategoryEvaluator(f.client)(category,f.invoice),/Invoice Amount/);
});

test('shipment sums extended selling values before rounding and owns its journal',async()=>{
 const f=fixture(),packet=await f.evaluate('INV-14');assert.equal(packet.shippingRecordId,f.shipping.id);assert.equal(packet.invoiceRecordId,undefined);assert.equal(packet.paymentRecordId,undefined);assert.equal(packet.eventType,'created');assert.equal(packet.entryDate,'2026-11-03');
 const p=packet.categories[0].postings[0];assert.equal(p.amount,'20.01');assert.equal(p.debitAccount.number,'221.100');assert.equal(p.creditAccount.number,'004.001');assert.deepEqual(p.branch,['Chicago']);assert.deepEqual(p.transactionRecordIds,[id(7)]);assert.deepEqual(p.stateRecordIds,[id(8)]);
 f.mta.fields[M.amount]=-10.005;f.mta2.fields[M.amount]=-10.005;assert.equal((await f.evaluate('INV-14')).categories[0].postings[0].amount,'-20.01');
});
test('shipping caps against the linked deposit and fails ambiguous relationships before posting',async()=>{
 const f=fixture();f.depositBalance.cents=1500;
 let packet=await f.evaluate('INV-14'),p=packet.categories[0].postings[0];
 assert.equal(p.amount,'15.00');assert.equal(p.invoiceRecordId,f.invoice.id);assert.deepEqual(p.invoiceRecordIds,[f.invoice.id]);
 assert.deepEqual(JSON.parse(packet.categories[0].entryKey),[f.invoice.id,2001]);
 f.depositBalance.cents=0;assert.equal(await f.evaluate('INV-14'),null);
 f.depositBalance.cents=-50;assert.equal(await f.evaluate('INV-14'),null);
 f.depositBalance.cents=500000;f.invoice.fields[I.kind]={name:'Full Invoice'};assert.equal(await f.evaluate('INV-14'),null);
 f.invoice.fields[I.kind]={name:'Deposit Invoice'};f.invoice.fields[I.cancelled]=true;assert.equal(await f.evaluate('INV-14'),null);f.invoice.fields[I.cancelled]=false;
 f.shipping.fields[S.transactions].push(...links(id(8)));await assert.rejects(()=>f.evaluate('INV-14'),/exactly one Transaction/);f.shipping.fields[S.transactions]=links(id(7));
 const second=f.put(T.invoices,id(40),{...f.invoice.fields});f.put(T.transactions,id(7),{[F.TRANSACTION_FIELDS.invoices]:links(f.invoice.id,second.id)});
 await assert.rejects(()=>f.evaluate('INV-14'),/exactly one deposit invoice/);
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
 f.invoice.fields[I.accounts]=links(f.account('010.003'));
 f.payment.fields[P.invoices].push(...links(f.put(T.invoices,id(6),{...f.invoice.fields}).id));const p=await f.evaluate('INV-18');assert.equal(p.categories[0].postings.length,1);assert.equal(p.categories[0].postings[0].amount,'-60.25');
});
test('cashback invoices and their payments are excluded from generic non-product entries',async()=>{
 const f=fixture();f.invoice.fields[I.vendorTypeAR]={name:'AR - Non-Product'};f.invoice.fields[I.accounts]=links(f.account('004.011'));
 assert.equal(await f.evaluate('INV-10'),null);assert.equal(await f.evaluate('INV-18'),null);
 const q={field:(_t,id)=>'{'+id+'}',eq:(_t,id,v)=>'{'+id+'}='+JSON.stringify(v),includes:(_t,id,v)=>'FIND('+JSON.stringify(v)+',{'+id+'})>0'};
 assert(INVOICE_CATEGORIES.find(c=>c.code==='INV-10').filter(q).includes('NOT(FIND("004.011"'));
 assert(INVOICE_CATEGORIES.find(c=>c.code==='INV-18').related.filter(q).includes('NOT(FIND("004.011"'));
 f.invoice.fields[I.accounts]=links(f.account('004.002'));assert(await f.evaluate('INV-10'));assert(await f.evaluate('INV-18'));
});
test('mixed deposit and balance payment allocates the current payment once',async()=>{
 const f=fixture();f.payment.fields[P.amount]=2043;f.invoice.fields[I.amount]=1883;f.invoice.fields[I.paymentProportion]=1883/2043;
 const balance=f.put(T.invoices,id(6),{...f.invoice.fields,[I.kind]:{name:'Full Invoice'},[I.amount]:160,[I.paymentProportion]:160/2043});
 f.payment.fields[P.invoices]=links(f.invoice.id,balance.id);
 const deposit=await f.evaluate('INV-13'),paidBalance=await f.evaluate('INV-16');
 assert.equal(deposit.categories[0].postings[0].amount,'1883.00');assert.equal(paidBalance.categories[0].postings[0].amount,'160.00');
 assert.deepEqual(deposit.categories[0].postings[0].invoiceRecordIds,[f.invoice.id]);assert.deepEqual(paidBalance.categories[0].postings[0].invoiceRecordIds,[balance.id]);
 assert.equal(Number(deposit.categories[0].postings[0].amount)+Number(paidBalance.categories[0].postings[0].amount),2043);
 assert.deepEqual(await f.evaluate('INV-13'),deposit);assert.deepEqual(await f.evaluate('INV-16'),paidBalance);
});
test('separate payments against the same invoice post only their current amount',async()=>{
 const f=fixture();f.invoice.fields.fldjIeCk9utD91Rq6=500;
 f.payment.fields[P.amount]=200;assert.equal((await f.evaluate('INV-13')).categories[0].postings[0].amount,'200.00');
 f.payment.fields[P.amount]=300;assert.equal((await f.evaluate('INV-13')).categories[0].postings[0].amount,'300.00');
});
for(const[code,kind]of [['INV-13','Deposit Invoice'],['INV-16','Balance Invoice']])test('matching proportions sum before cent allocation: '+code,async()=>{
 const f=fixture();f.payment.fields[P.amount]=0.01;f.invoice.fields[I.kind]={name:kind};f.invoice.fields[I.paymentProportion]=0.3;
 const second=f.put(T.invoices,id(6),{...f.invoice.fields,[I.kind]:{name:code==='INV-16'?'Full Invoice':kind}}),unmatched=f.put(T.invoices,id(7),{...f.invoice.fields,[I.vendorTypeAR]:{name:'AR - Non-Product'},[I.paymentProportion]:0.2});
 const cancelled=f.put(T.invoices,id(8),{...f.invoice.fields,[I.cancelled]:true,[I.paymentProportion]:0.2});
 f.payment.fields[P.invoices]=links(f.invoice.id,second.id,unmatched.id,cancelled.id);
 const p=(await f.evaluate(code)).categories[0].postings[0];assert.equal(p.amount,'0.01');assert.deepEqual(p.invoiceRecordIds,[f.invoice.id,second.id].sort());
 f.payment.fields[P.amount]=-0.01;assert.equal((await f.evaluate(code)).categories[0].postings[0].amount,'-0.01');
});
test('deposit and balance payments validate proportions while non-product payments remain unchanged',async()=>{
 const f=fixture();f.invoice.fields[I.paymentProportion]=null;await assert.rejects(()=>f.evaluate('INV-13'),/Payment Proportion/);
 f.invoice.fields[I.kind]={name:'Full Invoice'};await assert.rejects(()=>f.evaluate('INV-16'),/Payment Proportion/);
 f.invoice.fields[I.paymentProportion]=0.9;await assert.rejects(()=>f.evaluate('INV-16'),/100%/);
 f.payment.fields[P.amount]=0;assert.equal(await f.evaluate('INV-16'),null);f.payment.fields[P.amount]=-60.25;
 f.invoice.fields[I.vendorTypeAR]={name:'AR - Non-Product'};assert.equal((await f.evaluate('INV-18')).categories[0].postings[0].amount,'-60.25');
});
test('repeated payments against the same five invoices keep each category allocation separate',async()=>{
 const f=fixture();f.invoice.fields[I.amount]=100;f.invoice.fields[I.paymentProportion]=0.2;
 const invoices=[f.invoice,...[6,7,8,9].map((n,index)=>f.put(T.invoices,id(n),{...f.invoice.fields,[I.kind]:{name:index<2?'Deposit Invoice':'Full Invoice'}}))];
 f.payment.fields[P.invoices]=links(...invoices.map(i=>i.id));
 for(const [amount,deposit,balance]of [[200,'120.00','80.00'],[300,'180.00','120.00']]){
  f.payment.fields[P.amount]=amount;assert.equal((await f.evaluate('INV-13')).categories[0].postings[0].amount,deposit);assert.equal((await f.evaluate('INV-16')).categories[0].postings[0].amount,balance);
 }
});
test('mixed category cent remainders are deterministic for positive and negative payments',async()=>{
 const f=fixture();f.invoice.fields[I.paymentProportion]=0.5;const balance=f.put(T.invoices,id(6),{...f.invoice.fields,[I.kind]:{name:'Full Invoice'}});
 f.payment.fields[P.invoices]=links(balance.id,f.invoice.id);
 for(const amount of [0.01,-0.01]){f.payment.fields[P.amount]=amount;assert.equal(Number((await f.evaluate('INV-13')).categories[0].postings[0].amount),amount);assert.equal(await f.evaluate('INV-16'),null);}
 f.invoice.fields[I.paymentProportion]=1.2;balance.fields[I.paymentProportion]=-0.2;f.payment.fields[P.amount]=100;
 assert.equal((await f.evaluate('INV-13')).categories[0].postings[0].amount,'120.00');assert.equal((await f.evaluate('INV-16')).categories[0].postings[0].amount,'-20.00');
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
 for(const code of ['INV-13','INV-16','INV-17','INV-18']){const c=INVOICE_CATEGORIES.find(c=>c.code===code);assert.equal(c.related.tableId,T.invoices);assert.equal(c.related.linksFieldId,I.payments);assert(candidateFormula(c,q).includes('{'+P.amount+'}!=0'));}
 for(const code of ['INV-01','INV-03','INV-04','INV-05','INV-06'])assert(!INVOICE_CATEGORIES.some(c=>c.code===code));
 const f=fixture();for(const c of INVOICE_CATEGORIES.filter(c=>c.status==='deferred'))await assert.rejects(()=>createCategories(f.client).evaluate(c.code,f.invoice.id),/Not yet implemented/);
});

test('dynamic non-product accounts preserve approved FIN account identities',async()=>{
 for(const [source,ledger] of [['525300','525.300'],['922000','922.000']]){
  const f=fixture();f.invoice.fields[I.vendorTypeAR]={name:'AR - Non-Product'};
  f.invoice.fields[I.accounts]=links(f.account(source));
  const packet=await f.evaluate('INV-10');
  assert.equal(packet.categories[0].postings[0].creditAccount.number,ledger);
 }
});
