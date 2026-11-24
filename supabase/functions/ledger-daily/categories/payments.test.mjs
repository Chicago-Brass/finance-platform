import test from 'node:test';
import assert from 'node:assert/strict';
import {createCategoryEvaluator,sourceFields} from './index.ts';
import {paymentWorkerFields as F,POSTING_FIELDS,LOAN_RECORDS} from '../definitions.ts';
import {PAYMENT_CATEGORIES} from '../rules/payments.ts';
import {candidateFormula,CATEGORIES} from '../queries.ts';
import {expectedPaymentRecordType} from '../rules/common.ts';
import {sourceDateFilter} from '../scope.ts';
const {TABLES:T,INVOICE_FIELDS:I,PAYMENT_FIELDS:P,LINE_FIELDS:L,ACCOUNT_FIELDS:A}=F;
import {fixture} from './payment-fixture.mjs';
const links=(...ids)=>ids.map(id=>({id,name:id}));
function pair(packet,debit,credit,amount){assert(packet);const p=packet.categories[0].postings[0];assert.equal(p.debitAccount.number,debit);assert.equal(p.creditAccount.number,credit);assert.equal(p.amount,amount);return p;}
for(const [code,type,vendor,accountCode,debit,credit,amount]of [
 ['PAY-32','AP','AP - Assets','143.200','143.200','211.100','-10.01'],
 ['PAY-24','AP','AP - Assets','143.200','211.100','0747','-12.30'],
 ['PAY-20','AP','AP - Expenses (Non-Sales Tax)','316.100','316.100','0747','-12.30'],
 ['PAY-21','AR','AR - Non-Product','311.200','0747','311.200','-12.30'],
 ['PAY-23','AR','AR - Non-Product','004.004','112.100','004.004','-12.30'],
])test('source, signed amount and references: '+code,async()=>{
 const f=fixture();f.invoice.fields[I.type]={name:type};f.invoice.fields[type==='AP'?I.vendorTypeAP:I.vendorTypeAR]={name:vendor};f.invoice.fields[I.accounts]=links(f.account(accountCode));
 const packet=await f.evaluate(code),p=pair(packet,debit,credit,amount);
 assert.equal(packet.source.recordId,code==='PAY-32'?'invoice':'payment');assert.equal(packet.entryDate,code==='PAY-32'?'2026-11-01':'2026-11-02');
 assert.deepEqual(p.branch,['Chicago']);for(const [name,id]of [['vendor','vendor'],['client','client'],['staff','staff'],['transaction','transaction'],['po','po'],['state','state']])assert.deepEqual(p[name+'RecordIds'],[id]);
 assert.deepEqual(await f.evaluate(code),packet);f.invoice.fields[I.cancelled]=true;assert.equal(await f.evaluate(code),null);
});
test('card purchase has only the chart filters, selected clearing account and full payment',async()=>{
 const f=fixture();f.invoice.fields[I.vendorTypeAP]={name:'AP - Product'};f.payment.fields[P.accounts]=links(f.account('231.101'));
 pair(await f.evaluate('PAY-08'),'211.100','231.101','-12.30');f.payment.fields[P.sent]=false;assert.equal(await f.evaluate('PAY-08'),null);
});
test('owner contributions post through the dedicated payment route, excluding both generic AR routes',async()=>{
 const f=fixture();f.invoice.fields[I.type]={name:'AR'};f.invoice.fields[I.accounts]=links(f.account('311.200'));
 f.invoice.fields[I.amount]=9000;f.payment.fields[P.type]='AR';f.payment.fields[P.amount]=2500;
 const packet=await f.evaluate('PAY-21');pair(packet,'0747','311.200','2500.00');
 assert.equal(packet.source.recordId,'payment');assert.equal(packet.entryDate,'2026-11-02');
 const evaluate=createCategoryEvaluator(f.client);
 assert.equal(await evaluate(CATEGORIES.find(c=>c.code==='INV-10'),f.invoice),null);
 assert.equal(await evaluate(CATEGORIES.find(c=>c.code==='INV-18'),f.payment),null);
 const q={field:(_t,id)=>'{'+id+'}',eq:(_t,id,v)=>'{'+id+'}='+JSON.stringify(v),includes:(_t,id,v)=>'FIND('+JSON.stringify(v)+',{'+id+'})>0'};
 for(const code of ['INV-10','INV-18']){
  const c=CATEGORIES.find(c=>c.code===code),filter=code==='INV-10'?c.filter(q):c.related.filter(q);
  for(const account of ['004.011','311.200','004.004'])assert(filter.includes('NOT(FIND("'+account+'"'),code+' excludes '+account);
 }
 f.payment.fields[P.sent]=false;assert.equal(await f.evaluate('PAY-21'),null);
});
test('insurance payout posts once through its payment and excludes both generic AR routes',async()=>{
 const f=fixture();f.invoice.fields[I.type]={name:'AR'};f.invoice.fields[I.accounts]=links(f.account('004.004'));
 f.invoice.fields[I.amount]=9000;f.payment.fields[P.type]='AR';f.payment.fields[P.amount]=2500;
 const packet=await f.evaluate('PAY-23');pair(packet,'112.100','004.004','2500.00');
 assert.equal(packet.source.recordId,'payment');assert.equal(packet.entryDate,'2026-11-02');
 const evaluate=createCategoryEvaluator(f.client);
 assert.equal(await evaluate(CATEGORIES.find(c=>c.code==='INV-10'),f.invoice),null);
 assert.equal(await evaluate(CATEGORIES.find(c=>c.code==='INV-18'),f.payment),null);
 const q={field:(_t,id)=>'{'+id+'}',eq:(_t,id,v)=>'{'+id+'}='+JSON.stringify(v),includes:(_t,id,v)=>'FIND('+JSON.stringify(v)+',{'+id+'})>0'};
 assert(PAYMENT_CATEGORIES.find(c=>c.code==='PAY-23').related.filter(q).includes('004.004'));
 f.payment.fields[P.sent]=false;assert.equal(await f.evaluate('PAY-23'),null);f.payment.fields[P.sent]=true;
 f.invoice.fields[I.cancelled]=true;assert.equal(await f.evaluate('PAY-23'),null);f.invoice.fields[I.cancelled]=false;
 f.invoice.fields[I.accounts]=links(f.account('004.002'));assert.equal(await f.evaluate('PAY-23'),null);
});
test('statement payment debits the single linked card and credits the funding bank',async()=>{
 const f=fixture();f.payment.fields[P.recordType]={name:'CC Batch Payment'};f.payment.fields[P.invoices]=[];
 await assert.rejects(()=>f.evaluate('PAY-09'),/linked mini-payments/);
 const mini=f.put(T.payments,'mini',{[P.invoices]:links('invoice'),[P.accounts]:links(f.account('231.102'))});
 f.payment.fields[P.miniPayments]=links('mini');
 const p=pair(await f.evaluate('PAY-09'),'231.102','0747','-12.30');
 assert.deepEqual(p.branch,['Chicago']);assert.deepEqual(p.vendorRecordIds,['vendor']);
 f.put(T.payments,'amex-mini',{[P.accounts]:links(f.account('231.101'))});
 f.payment.fields[P.miniPayments]=links(mini.id,'amex-mini');
 await assert.rejects(()=>f.evaluate('PAY-09'),/one Amex or Chase/);
});
test('return uses the payment bank and date, and resolves the linked invoice branch',async()=>{
 const f=fixture();f.payment.fields[P.recordType]={name:'Return Payment'};
 const packet=await f.evaluate('PAY-12');
 assert.equal(packet.eventType,'sent');
 assert.equal(packet.entryDate,'2026-11-02');
 assert.deepEqual(pair(packet,'0747','211.100','12.30').branch,['Chicago']);
 f.invoice.fields[I.branch]=null;f.invoice.fields[I.transactionBranch]=['Milwaukee'];
 assert.deepEqual(pair(await f.evaluate('PAY-12'),'0747','211.100','12.30').branch,['Milwaukee']);
 f.invoice.fields[I.transactionBranch]=['Milwaukee','Chicago'];
 assert.deepEqual(pair(await f.evaluate('PAY-12'),'0747','211.100','12.30').branch,[]);
 f.payment.fields[P.cancelled]=true;assert.equal(await f.evaluate('PAY-12'),null);
});
test('customer refunds use a separate sent negative payment and debit funded credit',async()=>{
 const f=fixture();f.invoice.fields[I.type]={name:'AR'};
 f.invoice.fields[I.vendorTypeAR]={name:'AR - Refund/Credit'};f.invoice.fields[I.application]={name:'Cash Refund'};
 f.invoice.fields[I.transactions]=links('transaction');f.invoice.fields[I.transactionBranch]=['Milwaukee'];
 f.invoice.fields[I.originalCreditPayment]=links('origin');
 const packet=await f.evaluate('PAY-29');
 assert.deepEqual(pair(packet,'221.300','0747','12.30').branch,['Milwaukee']);
 assert.deepEqual(packet.customerSettlement.credit,{originId:'origin',invoiceId:'invoice',cents:1230});
 f.invoice.fields[I.originalCreditPayment]=links('payment');await assert.rejects(()=>f.evaluate('PAY-29'),/cannot also be its refund/);
 f.invoice.fields[I.originalCreditPayment]=links('origin');f.customerBalance.credit=async()=>1;
 await assert.rejects(()=>f.evaluate('PAY-29'),/exceeds the posted customer credit/);
 f.customerBalance.credit=async()=>100000;
 f.payment.fields[P.amount]=12.30;await assert.rejects(()=>f.evaluate('PAY-29'),/exceeds the posted customer credit/);
 f.invoice.fields[I.type]={name:'AP'};f.invoice.fields[I.vendorTypeAP]={name:'AP - Refund'};
 pair(await f.evaluate('PAY-13'),'0747','211.100','-12.30');
});
test('AR applications use a funded source credit with the right method and branch',async()=>{
 const f=fixture();f.invoice.fields[I.type]={name:'AR'};f.invoice.fields[I.creditsApplied]=-71.24;f.invoice.fields[I.sourceCredits]=links('credit');
 const credit=f.put(T.invoices,'credit',{[I.type]:{name:'AR'},[I.vendorTypeAR]:{name:'AR - Refund/Credit'},
  [I.application]:{name:'Credit to Another Order'},[I.clients]:links('client'),[I.transactions]:links('transaction'),[I.transactionBranch]:['Chicago'],[I.originalCreditPayment]:links('origin')});
 const packet=await f.evaluate('PAY-28'),posting=pair(packet,'221.300','121.100','71.24');
 assert.equal(packet.invoiceRecordId,'invoice');assert.equal(packet.paymentRecordId,undefined);
 assert.equal(posting.debitInvoiceRecordId,'credit');assert.equal(posting.creditInvoiceRecordId,'invoice');
 credit.fields[I.clients]=[];await assert.rejects(()=>f.evaluate('PAY-28'),/same customer/);
 credit.fields[I.clients]=links('client');
 credit.fields[I.transactionBranch]=['Milwaukee'];await assert.rejects(()=>f.evaluate('PAY-28'),/branches must match/);
 credit.fields[I.transactionBranch]=['Chicago'];credit.fields[I.application]={name:'Cash Refund'};
 await assert.rejects(()=>f.evaluate('PAY-28'),/Method of Application/);
 credit.fields[I.application]={name:'Credit to Another Order'};f.customerBalance.receivable=async()=>7000;
 await assert.rejects(()=>f.evaluate('PAY-28'),/open AR/);
});
test('expense-related payment rules use the invoice transaction branch lookup when it has one unique value',async()=>{
 const f=fixture();
 f.invoice.fields[I.vendorTypeAP]={name:'AP - Product'};
 f.payment.fields[P.accounts]=links(f.account('231.101'));
 f.invoice.fields[I.amount]=100;
 f.invoice.fields[I.amountToPay]=80;
 f.payment.fields[P.amount]=80;
 f.invoice.fields[I.creditsApplied]=-20;
 f.invoice.fields[I.sourceCredits]=links('credit');
 f.put(T.invoices,'credit',{[I.type]:{name:'AP'},[I.vendorTypeAP]:{name:'AP - Credit'},[I.application]:{name:'Credit to Another Order'},[I.creditAvailable]:-20});
 f.line.fields[L.type]={name:'Discount'};
 for(const [invoiceBranch,lookupBranches,expected] of [
  [{name:'Chicago'},['Minneapolis'],['Chicago']],
  [null,['Milwaukee'],['Milwaukee']],
  [null,['Milwaukee','Milwaukee'],['Milwaukee']],
  [null,['Milwaukee','Minneapolis'],[]],
  [null,[],[]],
  [null,null,[]],
 ]){
  f.invoice.fields[I.branch]=invoiceBranch;
  f.invoice.fields[I.transactionBranch]=lookupBranches;
  for(const code of ['PAY-08','PAY-10','PAY-11']){
   const packet=await f.evaluate(code);
   assert.deepEqual(packet.categories[0].postings[0].branch,expected,code);
  }
 }
});

test('zero-cash vendor credit payment owns journals with distinct bill/source-credit legs',async()=>{
 const f=fixture();f.payment.fields[P.amount]=0;f.payment.fields[P.accounts]=[];f.invoice.fields[I.creditsApplied]=-20.01;f.invoice.fields[I.sourceCredits]=links('credit1','credit2');
 for(const id of ['credit1','credit2'])f.put(T.invoices,id,{[I.type]:{name:'AP'},[I.vendorTypeAP]:{name:'AP - Credit'},[I.application]:{name:'Credit to Another Order'},[I.creditAvailable]:-10.005});
 const packet=await f.evaluate('PAY-11');assert.equal(packet.paymentRecordId,'payment');assert.equal(packet.categories[0].entryKey,'invoice');
 const ps=packet.categories[0].postings;assert.equal(ps.length,2);assert.equal(ps[0].amount,'10.01');assert.equal(ps[1].amount,'10.00');
 for(const p of ps){assert.equal(p.debitInvoiceRecordId,'invoice');assert.match(p.creditInvoiceRecordId,/credit[12]/);assert.equal(p.debitAccount.number,'211.100');assert.equal(p.creditAccount.number,'211.100');}
 f.invoice.fields[I.sourceCredits]=[];await assert.rejects(()=>f.evaluate('PAY-11'),/no source credit/);
});
test('rebate is payment-owned and uses the full signed Payment Amount once',async()=>{
 const f=fixture();f.invoice.fields[I.type]={name:'AR'};f.invoice.fields[I.accounts]=links(f.account('010.001'));
 f.invoice.fields[I.date]='2020-01-01';f.invoice.fields[I.amount]=22.34;f.invoice.fields[I.lines]=[];f.line.fields[L.amount]=999;
 f.payment.fields[P.accounts]=links(f.account('231.101'));f.payment.fields[P.amount]=500;
 const packet=await f.evaluate('PAY-27'),refs=pair(packet,'231.101','010.001','500.00');
 assert.equal(packet.source.tableId,T.payments);assert.equal(packet.source.recordId,'payment');assert.equal(packet.paymentRecordId,'payment');
 assert.equal(packet.invoiceLineRecordId,undefined);assert.equal(packet.invoiceRecordId,undefined);assert.equal(packet.entryDate,'2026-11-02');
 assert.deepEqual(refs.invoiceRecordIds,['invoice']);assert.deepEqual(refs.vendorRecordIds,['vendor']);assert.deepEqual(refs.branch,['Chicago']);assert.deepEqual(await f.evaluate('PAY-27'),packet);
 const evaluator=createCategoryEvaluator(f.client);
 assert.equal(await evaluator(CATEGORIES.find(c=>c.code==='INV-10'),f.invoice),null);
 assert.equal(await evaluator(CATEGORIES.find(c=>c.code==='INV-18'),f.payment),null);
 f.invoice.fields[I.amount]=0;pair(await f.evaluate('PAY-27'),'231.101','010.001','500.00');
 f.payment.fields[P.amount]=-9.005;pair(await f.evaluate('PAY-27'),'231.101','010.001','-9.01');
 f.payment.fields[P.amount]=0;assert.equal(await f.evaluate('PAY-27'),null);f.payment.fields[P.amount]=500;
 f.payment.fields[P.sent]=false;assert.equal(await f.evaluate('PAY-27'),null);f.payment.fields[P.sent]=true;
 f.invoice.fields[I.status]={name:'Unpaid'};assert.equal(await f.evaluate('PAY-27'),null);f.invoice.fields[I.status]={name:'Fully Paid'};
 f.invoice.fields[I.accounts]=links(f.account('004.002'));assert.equal(await f.evaluate('PAY-27'),null);
});
test('rebate uses only its own Regular Sent card-clearing payment',async()=>{
 const f=fixture();f.invoice.fields[I.type]={name:'AR'};f.invoice.fields[I.accounts]=links(f.account('010.001'));
 assert.equal(await f.evaluate('PAY-27'),null);f.payment.fields[P.accounts]=links(f.account('231.101'));
 for(const name of ['Return Payment','Repayment','CC Batch Payment','Credit Payment','']){f.payment.fields[P.recordType]={name};assert.equal(await f.evaluate('PAY-27'),null);}
 f.payment.fields[P.recordType]={name:'Regular Payment'};
 f.put(T.payments,'later-card',{[P.sent]:true,[P.recordType]:{name:'Regular Payment'},[P.date]:'2026-11-04',[P.accounts]:links('231.101')});
 f.invoice.fields[I.payments]=links('payment','later-card');
 assert.equal((await f.evaluate('PAY-27')).entryDate,'2026-11-02');
 f.payment.fields[P.sent]=false;assert.equal(await f.evaluate('PAY-27'),null);
 f.payment.fields[P.sent]=true;f.payment.fields[P.cancelled]=true;assert.equal(await f.evaluate('PAY-27'),null);
});
test('several matching cashback invoices retain their references without multiplying the payment',async()=>{
 const f=fixture();f.invoice.fields[I.type]={name:'AR'};f.invoice.fields[I.accounts]=links(f.account('010.001'));f.invoice.fields[I.amount]=22.34;f.invoice.fields[I.paymentProportion]=22.34/500;
 f.put(T.invoices,'invoice2',{...f.invoice.fields,[I.amount]:477.66,[I.paymentProportion]:477.66/500});f.payment.fields[P.invoices]=links('invoice','invoice2');f.payment.fields[P.amount]=500;f.payment.fields[P.accounts]=links(f.account('231.101'));
 const packet=await f.evaluate('PAY-27'),p=pair(packet,'231.101','010.001','500.00');
 assert.equal(packet.categories.length,1);assert.equal(packet.categories[0].postings.length,1);assert.deepEqual(p.invoiceRecordIds,['invoice','invoice2']);assert.equal(packet.paymentRecordId,'payment');
});
test('Amex and Chase statement discounts reduce the selected card by the signed AP share',async()=>{
 for(const card of ['231.101','231.102']){
  const f=fixture();f.invoice.fields[I.vendorTypeAP]={name:'AP - Expenses (Non-Sales Tax)'};
  f.invoice.fields[I.accounts]=links(f.account('010.001'));f.invoice.fields[I.amount]=-25;
  f.invoice.fields[I.paymentProportion]=-25/75;
  f.put(T.invoices,'purchase',{...f.invoice.fields,[I.vendorTypeAP]:{name:'AP - Product'},[I.accounts]:links(f.account('004.010')),[I.amount]:100,[I.paymentProportion]:100/75});
  f.payment.fields[P.invoices]=links('invoice','purchase');f.payment.fields[P.amount]=75;
  f.payment.fields[P.accounts]=links(f.account(card));
  pair(await f.evaluate('PAY-27'),card,'010.001','25.00');
  pair(await f.evaluate('PAY-08'),'211.100',card,'100.00');
  f.invoice.fields[I.amount]=25;assert.equal(await f.evaluate('PAY-27'),null);
 }
});
test('active loan funding distinguishes bank cash and financed assets and uses the effective date',async()=>{
 const f=fixture(),loan=LOAN_RECORDS;
 f.put(T.accounts,'liability',{[A.number]:'232.100',[loan.accountType]:{name:'Liability'}});
 f.put(T.accounts,'asset-account',{[A.number]:'151.100',[loan.accountType]:{name:'Asset'}});
 f.put(loan.assetTable,'asset',{[loan.assetAccount]:links('asset-account')});
 const source=f.put(loan.table,'loan',{[loan.active]:true,[loan.setup]:{name:loan.cashSetup},
  [loan.account]:links('liability'),[loan.amount]:30000,[loan.date]:['2026-11-10T00:00:00.000Z'],[loan.asset]:links('asset')});
 let packet=await f.evaluate('PAY-31');pair(packet,'112.100','232.100','30000.00');assert.equal(packet.entryDate,'2026-11-10');assert.equal(packet.loanRecordId,'loan');assert.equal(await f.evaluate('PAY-33'),null);
 source.fields[loan.setup]={name:loan.purchaseSetup};source.fields[loan.overrideDate]='2026-11-12';
 packet=await f.evaluate('PAY-33');pair(packet,'151.100','232.100','30000.00');assert.equal(packet.entryDate,'2026-11-12');assert.equal(await f.evaluate('PAY-31'),null);
 source.fields[loan.active]=false;assert.equal(await f.evaluate('PAY-33'),null);
});
test('monthly loan repayment uses each line and exactly one linked settlement',async()=>{
 const f=fixture(),loan=LOAN_RECORDS;
 f.invoice.fields[I.monthlyLoan]=links('loan');f.put(loan.table,'loan',{[loan.account]:links(f.account('232.100'))});
 f.line.fields[L.accounts]=links('232.100');f.line.fields[L.amount]=450;
 const principal=await f.evaluate('PAY-16');pair(principal,'232.100','0747','450.00');assert.equal(principal.invoiceLineRecordId,'line');assert.equal(principal.entryDate,'2026-11-02');
 f.line.fields[L.accounts]=links(f.account('007.003'));f.line.fields[L.amount]=50;
 pair(await f.evaluate('PAY-16'),'007.003','0747','50.00');
 f.payment.fields[P.sent]=false;await assert.rejects(()=>f.evaluate('PAY-16'),/exactly one sent/);
 f.invoice.fields[I.status]={name:'Partially Paid'};assert.equal(await f.evaluate('PAY-16'),null);
});
test('vendor return and repayment use their record types and ignore retired checkboxes',async()=>{
 const f=fixture();f.payment.fields[P.amount]=-100;
 f.payment.fields[P.recordType]={name:'Return Payment'};
 pair(await f.evaluate('PAY-12'),'0747','211.100','100.00');
 assert.equal(await f.evaluate('PAY-30'),null);
 f.payment.fields[P.amount]=100;pair(await f.evaluate('PAY-12'),'0747','211.100','-100.00');
 f.payment.fields[P.recordType]={name:'Regular Payment'};
 for(const id of ['fldRvZLik2A6g0KVd','fldnatNUng6JguZPe','fldPJasaFXnVScm2J'])f.payment.fields[id]=true;
 assert.equal(await f.evaluate('PAY-12'),null);
 assert.equal(await f.evaluate('PAY-30'),null);
 pair(await f.evaluate('PAY-24'),'211.100','0747','100.00');
 f.payment.fields[P.recordType]={name:'Repayment'};
 const packet=await f.evaluate('PAY-30');pair(packet,'211.100','0747','100.00');
 assert.equal(packet.source.recordId,'payment');assert.equal(packet.entryDate,'2026-11-02');
 assert.deepEqual(packet.categories[0].postings[0].branch,['Chicago']);
 assert.equal(await f.evaluate('PAY-12'),null);
 f.payment.fields[P.amount]=-100;pair(await f.evaluate('PAY-30'),'211.100','0747','-100.00');
 f.payment.fields[P.sent]=false;assert.equal(await f.evaluate('PAY-30'),null);
 f.payment.fields[P.sent]=true;f.payment.fields[P.type]='AR';assert.equal(await f.evaluate('PAY-30'),null);
});
test('all payment routes enforce exactly one Payment Record Type in discovery and targeted evaluation',async()=>{
 const f=fixture();
 const q={field:(_t,id)=>'{'+id+'}',eq:(_t,id,v)=>'{'+id+'}='+JSON.stringify(v),includes:(_t,id,v)=>'FIND('+JSON.stringify(v)+',{'+id+'})>0'};
 for(const c of CATEGORIES.filter(c=>c.tableId===T.payments)){
  const expected=expectedPaymentRecordType(c.code);
  assert(candidateFormula(c,q).includes('{'+P.recordType+'}='+JSON.stringify(expected)),c.code);
  assert(sourceFields(c).includes(P.recordType),c.code);
  for(const name of ['Regular Payment','Return Payment','Repayment','CC Batch Payment','Credit Payment','']){
   if(name===expected)continue;f.payment.fields[P.recordType]={name};
   assert.equal(await createCategoryEvaluator(f.client)(c,f.payment),null,c.code+' rejects '+name);
  }
 }
});
test('original payment, return and repayment leave exactly one bank withdrawal',async()=>{
 const f=fixture();f.invoice.fields[I.vendorTypeAP]={name:'AP - Product'};
 f.payment.fields[P.amount]=100;f.payment.fields[P.accounts]=links(f.account('112.100'));
 f.payment.fields['fldRvZLik2A6g0KVd']=true;
 const evaluate=createCategoryEvaluator(f.client),ordinary=CATEGORIES.find(c=>c.code==='EXP-16');
 const original=await evaluate(ordinary,f.payment);pair(original,'211.100','112.100','100.00');
 const returned=f.put(T.payments,'returned',{...f.payment.fields,[P.recordType]:{name:'Return Payment'},[P.amount]:-100});
 const returnPacket=await evaluate(CATEGORIES.find(c=>c.code==='PAY-12'),returned);pair(returnPacket,'112.100','211.100','100.00');
 const replacement=f.put(T.payments,'replacement',{...f.payment.fields,[P.recordType]:{name:'Repayment'}});
 assert.equal(await evaluate(ordinary,replacement),null);
 const repaid=await evaluate(CATEGORIES.find(c=>c.code==='PAY-30'),replacement);pair(repaid,'211.100','112.100','100.00');
 const net={};for(const packet of [original,returnPacket,repaid])for(const p of packet.categories[0].postings){const cents=Math.round(Number(p.amount)*100);net[p.debitAccount.number]=(net[p.debitAccount.number]||0)+cents;net[p.creditAccount.number]=(net[p.creditAccount.number]||0)-cents;}
 assert.deepEqual(net,{'211.100':10000,'112.100':-10000});
});
test('discovery uses 18 unique source-aware categories and no retired routes',()=>{
 assert.equal(PAYMENT_CATEGORIES.length,18);assert.equal(new Set(PAYMENT_CATEGORIES.map(c=>c.code)).size,18);
 for(const code of ['PAY-01','PAY-02','PAY-04','PAY-05','PAY-06','PAY-07','PAY-14','PAY-15','PAY-17','PAY-18','PAY-19','PAY-22','PAY-25','PAY-26'])assert(!PAYMENT_CATEGORIES.some(c=>c.code===code));
 const q={field:(_t,f)=>'{'+f+'}',eq:(_t,f,v)=>'{'+f+'}='+JSON.stringify(v),includes:(_t,f,v)=>'FIND('+JSON.stringify(v)+',{'+f+'})>0'};
 for(const c of PAYMENT_CATEGORIES){for(const field of Object.values(POSTING_FIELDS[c.tableId]))assert(sourceFields(c).includes(field));assert(candidateFormula(c,q).includes(c.tableId===LOAN_RECORDS.table?"main:"+c.code:c.code));}
 const credits=PAYMENT_CATEGORIES.find(c=>c.code==='PAY-11');assert(!candidateFormula(credits,q).includes('{'+P.amount+'}!=0'));
 const discount=PAYMENT_CATEGORIES.find(c=>c.code==='PAY-10');assert.equal(discount.tableId,T.lines);assert.equal(discount.related.tableId,T.payments);assert.equal(discount.related.linksFieldId,P.invoices);assert.equal(discount.related.through.linksFieldId,I.lines);assert(discount.related.filter(q).includes(P.date));assert.equal(sourceDateFilter(discount,q),'');
 const rebate=PAYMENT_CATEGORIES.find(c=>c.code==='PAY-27');assert.equal(rebate.tableId,T.payments);assert.equal(rebate.input,'record');assert.equal(rebate.related.tableId,T.invoices);assert.equal(rebate.related.linksFieldId,I.payments);assert.equal(rebate.related.through,undefined);assert(rebate.related.filter(q).includes(I.accounts));assert(rebate.related.filter(q).includes(I.status));assert(rebate.filter(q).includes(P.accounts));assert(sourceDateFilter(rebate,q).includes(P.date));
});
test('missing money, multiple accounts and unsent/invalid parents never prepare postings',async()=>{
 const f=fixture();f.invoice.fields[I.amount]=null;await assert.rejects(()=>f.evaluate('PAY-32'),/Invoice Amount/);f.invoice.fields[I.amount]=1;
 f.invoice.fields[I.accounts]=links(f.account('143.200'),f.account('143.300'));await assert.rejects(()=>f.evaluate('PAY-32'),/exactly one/);
 f.invoice.fields[I.accounts]=links('143.200');f.payment.fields[P.sent]=false;assert.equal(await f.evaluate('PAY-24'),null);
});

test('credit creation is absent from the invoice-owned payment rules',()=>{
 assert(!PAYMENT_CATEGORIES.some(category=>category.code==='PAY-03'));
});

test('early-payment discount owns only the line amount, negates its sign and retains source references',async()=>{
 const f=fixture();f.line.fields[L.type]={name:'Discount'};f.line.fields[L.amount]=-3;
 f.invoice.fields[I.vendorTypeAP]={name:'AP - Product'};
 f.payment.fields[P.amount]=97;f.invoice.fields[I.amount]=97;
 const packet=await f.evaluate('PAY-10');pair(packet,'211.100','004.011','3.00');
 f.invoice.fields[I.vendorTypeAP]={name:'AP - Expenses (Sales Tax)'};
 pair(await f.evaluate('PAY-10'),'211.100','004.011','3.00');
 f.invoice.fields[I.vendorTypeAP]={name:'AP - Expenses (Non-Sales Tax)'};
 assert.equal(await f.evaluate('PAY-10'),null);
 f.invoice.fields[I.vendorTypeAP]={name:'AP - Product'};
 assert.equal(packet.source.tableId,T.lines);assert.equal(packet.source.recordId,'line');
 assert.equal(packet.invoiceLineRecordId,'line');assert.equal(packet.paymentRecordId,undefined);assert.equal(packet.entryDate,'2026-11-02');
 const refs=packet.categories[0].postings[0];assert.deepEqual(refs.vendorRecordIds,['vendor']);assert.deepEqual(refs.branch,['Chicago']);
 f.line.fields[L.amount]=3;pair(await f.evaluate('PAY-10'),'211.100','004.011','-3.00');
 f.line.fields[L.amount]=0;assert.equal(await f.evaluate('PAY-10'),null);
 f.line.fields[L.amount]=-3;f.line.fields[L.discountStatus]={name:'Expired'};assert.equal(await f.evaluate('PAY-10'),null);
 f.line.fields[L.discountStatus]={name:'Applied'};f.payment.fields[P.sent]=false;assert.equal(await f.evaluate('PAY-10'),null);
 f.payment.fields[P.sent]=true;for(const name of ['Return Payment','Repayment','CC Batch Payment','']){f.payment.fields[P.recordType]={name};assert.equal(await f.evaluate('PAY-10'),null);}f.payment.fields[P.recordType]={name:'Regular Payment'};
 f.payment.fields[P.sent]=true;f.invoice.fields[I.status]={name:'Unpaid'};assert.equal(await f.evaluate('PAY-10'),null);
});

for(const [code,type,vendor,account]of [
 ['PAY-20','AP','AP - Expenses (Non-Sales Tax)','316.100'],
 ['PAY-21','AR','AR - Non-Product','311.200'],
 ['PAY-23','AR','AR - Non-Product','004.004'],
 ['PAY-24','AP','AP - Assets','143.200'],
 ['PAY-27','AR','AR - Non-Product','010.001'],
])test('account-specific payment skips blank/unrelated invoice accounts before strict mapping: '+code,async()=>{
 const f=fixture();f.invoice.fields[I.type]={name:type};f.invoice.fields[type==='AP'?I.vendorTypeAP:I.vendorTypeAR]={name:vendor};
 f.payment.fields[P.accounts]=code==='PAY-27'?links(f.account('231.101')):[];
 for(const blank of [null,[]]){f.invoice.fields[I.accounts]=blank;assert.equal(await f.evaluate(code),null);}
 f.invoice.fields[I.accounts]=links(f.account('004.002'));assert.equal(await f.evaluate(code),null);
 f.invoice.fields[I.accounts]=links(f.account(account),f.account('004.002'));await assert.rejects(()=>f.evaluate(code),/Invoice must link exactly one account/);
 f.invoice.fields[I.accounts]=links('missing-account');await assert.rejects(()=>f.evaluate(code),/Invoice account number is missing/);
 f.invoice.fields[I.accounts]=links(f.account(account));f.payment.fields[P.accounts]=[];
 if(code==='PAY-23')pair(await f.evaluate(code),'112.100','004.004','-12.30');
 else await assert.rejects(()=>f.evaluate(code),/Payment must link exactly one account/);
});

for(const[code,type,vendor,account,bank,negate]of [
 ['PAY-08','AP','AP - Product','004.010','231.101',false],
 ['PAY-13','AP','AP - Refund','004.010','0747',true],['PAY-20','AP','AP - Expenses (Non-Sales Tax)','316.100','0747',false],
 ['PAY-21','AR','AR - Non-Product','311.200','0747',false],['PAY-23','AR','AR - Non-Product','004.004','112.100',false],
 ['PAY-24','AP','AP - Assets','143.200','0747',false],['PAY-27','AR','AR - Non-Product','010.001','231.101',false],
])test('Payment category allocates only its matching invoices: '+code,async()=>{
 const f=fixture();f.invoice.fields[I.type]={name:type};f.invoice.fields[type==='AP'?I.vendorTypeAP:I.vendorTypeAR]={name:vendor};f.invoice.fields[I.accounts]=links(f.account(account));f.invoice.fields[I.application]={name:'Cash Refund'};f.invoice.fields[I.paymentProportion]=0.4;f.payment.fields[P.amount]=100;f.payment.fields[P.accounts]=links(f.account(bank));
 const other=f.put(T.invoices,'other',{...f.invoice.fields,[I.vendorTypeAP]:{name:'Unrelated'},[I.vendorTypeAR]:{name:'Unrelated'},[I.paymentProportion]:0.6});f.payment.fields[P.invoices].push(...links(other.id));
 const packet=await f.evaluate(code),p=packet.categories[0].postings[0];assert.equal(p.amount,negate?'-40.00':'40.00');assert.deepEqual(p.invoiceRecordIds,['invoice']);
 f.payment.fields[P.amount]=-100;assert.equal((await f.evaluate(code)).categories[0].postings[0].amount,negate?'40.00':'-40.00');
});
