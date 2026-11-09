import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {createCategories as sent} from './payment-sent.js';
import {createCategories as events} from './payment-events.js';
import {paymentSentFields as S,paymentEventsFields as E}from '../definitions.ts';
import {createCategoryEvaluator}from './index.ts';
import {CATEGORIES}from '../queries.ts';
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const T=S.TABLES,P=S.PAYMENT_FIELDS,I=S.INVOICE_FIELDS,L=S.LINE_FIELDS,C=S.CREDIT_FIELDS,A=S.ACCOUNT_FIELDS;
class Record {
 constructor(id,fields,name=id){this.id=id;this.fields=fields;this.name=name}
 value(id){return this.fields[id]??null}
 text(id){let v=this.value(id);return v==null?'':Array.isArray(v)?v.map(x=>x?.name??x??'').join(', '):typeof v==='object'?v.name:String(v)}
 getCellValue(id){return this.value(id)}getCellValueAsString(id){return this.text(id)}
}
const links=(...ids)=>ids.map(id=>({id,name:id}));
function fixture(){
 const db=new Map();const put=(t,id,fields,name)=>{let r=new Record(id,fields,name);db.set(t+'/'+id,r);return r};
 put(T.accounts,'bank',{[A.number]:'112.100'});put(T.accounts,'nickel',{[A.number]:'0747'});put(T.accounts,'card',{[A.number]:'231.100'});
 let invoice=put(T.invoices,'invoice',{[I.name]:'Synthetic invoice',[I.amount]:100,[I.amountToPay]:100,[I.totalPaid]:100,[I.remaining]:0,[I.accounts]:[],[I.lines]:[],[I.branch]:{name:'Chicago'},[I.clients]:links('client'),[I.application]:'Cash Refund',[I.firstShipDate]:['5/1/2026']},'Synthetic invoice');
 let payment=put(T.payments,'payment',{[P.name]:'Synthetic payment',[P.sent]:true,[P.type]:'AR',[P.vendorType]:'AR - Product',[P.vendorTypesAR]:['AR - Product'],[P.date]:'2026-05-01',[P.amount]:100,[P.accounts]:links('bank'),[P.invoices]:links('invoice'),[P.recordType]:{name:'Regular Payment'},[P.method]:{name:'Our ACH / Wire'},[E.PAYMENT_FIELDS.cancelledDate]:'2026-05-02',[E.PAYMENT_FIELDS.reconciledDate]:'2026-05-03'},'Synthetic payment');
 const client={async readRecord(t,id){return db.get(t+'/'+id)||null},async readRecords(t,ids){let rows=[...new Set(ids)].map(id=>db.get(t+'/'+id));assert(rows.every(Boolean),'Fixture missing linked record');return rows},async loadLinkNames(){}};
 const base={getTable(t){return{getField:id=>({name:id}),async selectRecordAsync(id){return client.readRecord(t,id)},async selectRecordsAsync({recordIds}){return{records:await client.readRecords(t,recordIds)}}}}};
 function type(t,v){payment.fields[P.type]=t;payment.fields[P.vendorType]=v;payment.fields[P.vendorTypesAR]=t==='AR'?[v]:[];payment.fields[P.vendorTypesAP]=t==='AP'?[v]:[]}
 function account(code){let id='account'+code;put(T.accounts,id,{[A.number]:code});return id}
 function line(id,code,amount){put(T.lines,id,{[L.amount]:amount,[L.accounts]:links(account(code)),[L.invoices]:links('invoice')});invoice.fields[I.lines].push(...links(id))}
 return{db,put,payment,invoice,client,base,type,account,line};
}
const names={
'PAY-01':'handleCustomerDeposit','PAY-02':'handleCustomerPaymentAfterShipment','PAY-03':'handleClientOverpayment','PAY-04':'handleSmallPaymentDifference','PAY-05':'handleClientCashRefund','PAY-07':'handleVendorBankPayment','PAY-08':'handleVendorCardPayment','PAY-09':'handleCreditCardStatementPayment','PAY-10':'handleEarlyPaymentDiscount','PAY-11':'handleVendorCreditApplication','PAY-12':'handleVendorPaymentReturned','PAY-13':'handleVendorRefund','PAY-15':'handleStaffPayment','PAY-16':'handleLoanPayment','PAY-17':'handleLineOfCreditDraw','PAY-18':'handleLineOfCreditRepayment','PAY-19':'handleBankTransfer','PAY-20':'handleOwnerDistribution','PAY-21':'handleOwnerContribution','PAY-22':'handleIncomeTaxPayment','PAY-23':'handleInsuranceClaimReceipt','PAY-24':'handleSecurityDepositPayment','PAY-25':'handleFidelityIncome','PAY-27':'handleCreditCardRebate'};
const canon=results=>results.map(r=>({row:r.tChartRow,key:r.entryKey||'',invoice:r.invoice?.id,postings:r.postings}));
async function native(f,code,eventType){
 const file=eventType==='sent'?'payment-sent':'payment-events';const handler=eventType==='sent'?names[code]:code==='PAY-06'?'handleClientPaymentCancelled':code==='PAY-12'?'handleVendorPaymentCancelled':'handleBankReconciliationDifference';
 const source=fs.readFileSync(new URL('../../../../airtable/'+file+'.js',import.meta.url),'utf8');
 const exported=await new AsyncFunction('base','input','console',source.replace(/^await main\([^\n]*\);/m,`return {loadPaymentData,${eventType==='sent'?'loadInvoiceData,':''} handler:${handler}};`))(f.base,{config:()=>({})},{log(){}});
 let data=await exported.loadPaymentData('payment');if(eventType==='sent')data={...data,...await exported.loadInvoiceData(data)};else data.eventType=eventType;
 let results=[];await exported.handler(data,results);return{data,results};
}
const cases=[
 ['same-day deposit','PAY-01',f=>{}],['after shipment','PAY-02',f=>f.payment.fields[P.date]='2026-05-02'],
 ['split deposit/balance','PAY-01',f=>{f.invoice.fields[I.amountToPay]=50;f.invoice.fields[I.firstShipDate]=['5/2/2026'];f.put(T.invoices,'invoice2',{...f.invoice.fields,[I.amountToPay]:150,[I.firstShipDate]:['4/1/2026']});f.payment.fields[P.invoices]=links('invoice','invoice2')}],
 ['overpaid rounding','PAY-04',f=>f.payment.fields[P.overpaid]=0.50],['underpaid invoice','PAY-04',f=>{f.invoice.fields[I.totalPaid]=98;f.invoice.fields[I.remaining]=2}],
 ['cash refund','PAY-05',f=>f.type('AR','AR - Refund/Credit')],['client credit','PAY-03',f=>{f.type('AR','AR - Refund/Credit');f.invoice.fields[I.application]='Credit to Another Order'}],
 ['vendor bank','PAY-07',f=>{f.type('AP','AP - Product');f.invoice.fields[I.vendors]=links('vendor')}],
 ['vendor card','PAY-08',f=>{f.type('AP','AP - Product');f.invoice.fields[I.vendors]=links('vendor');f.payment.fields[P.accounts]=links('card')}],
 ['credit-card statement','PAY-09',f=>{f.type('AP','AP - Expenses (Non-Sales Tax)');f.payment.fields[P.recordType]={name:'CC Batch Payment'};f.payment.fields[P.miniPayments]=links('mini');f.put(T.payments,'mini',{...f.payment.fields,[P.amount]:100,[P.method]:{name:'CC - Visa'},[P.miniPayments]:[]})}],
 ['vendor refund signed','PAY-13',f=>{f.type('AP','AP - Credit');f.payment.fields[P.amount]=-12.30}],
 ['staff sum before rounding','PAY-15',f=>{f.type('AP','AP - Staff');f.line('salary1','005.002',10.005);f.line('salary2','005.002',10.005);f.line('tax','005.006',2.50)}],
 ['loan principal/interest','PAY-16',f=>{f.type('AP','AP - Expenses (Non-Sales Tax)');f.line('principal','232.100',80);f.line('interest','007.003',-1.25)}],
 ['line of credit principal/interest','PAY-18',f=>{f.type('AP','AP - Expenses (Non-Sales Tax)');f.line('principal','231.200',80);f.line('interest','007.003',2)}],
 ['line of credit draw','PAY-17',f=>{f.type('AR','AR - Non-Product');f.invoice.fields[I.accounts]=links(f.account('231.200'))}],
 ['bank transfer','PAY-19',f=>{f.type('AP','AP - Expenses (Non-Sales Tax)');f.invoice.fields[I.accounts]=links('nickel')}],
 ['same-bank transfer excluded','PAY-19',f=>{f.type('AP','AP - Expenses (Non-Sales Tax)');f.invoice.fields[I.accounts]=links('bank')}],
 ['owner distribution','PAY-20',f=>{f.type('AP','AP - Expenses (Non-Sales Tax)');f.invoice.fields[I.accounts]=links(f.account('316.100'))}],
 ['owner contribution','PAY-21',f=>{f.type('AR','AR - Non-Product');f.invoice.fields[I.accounts]=links(f.account('311.200'))}],
 ['income tax','PAY-22',f=>{f.type('AP','AP - Expenses (Non-Sales Tax)');f.invoice.fields[I.accounts]=links(f.account('242.100'))}],
 ['security deposit','PAY-24',f=>{f.type('AP','AP - Expenses (Non-Sales Tax)');f.invoice.fields[I.accounts]=links(f.account('143.200'))}],
 ['interest amount from invoice','PAY-25',f=>{f.type('AR','AR - Non-Product');f.invoice.fields[I.accounts]=links(f.account('010.003'));f.invoice.fields[I.amount]=12.34}],
 ['card rebate','PAY-27',f=>{f.type('AR','AR - Non-Product');f.invoice.fields[I.accounts]=links(f.account('004.011'));f.invoice.fields[I.paymentStatus]='Fully Paid';f.invoice.fields[I.rebateTotal]=7.89}],
 ['AP return','PAY-12',f=>{f.type('AP','AP - Product');f.payment.fields[P.returned]=true}],
 ['client cancellation','PAY-06',f=>f.payment.fields[E.PAYMENT_FIELDS.cancelled]=true,'cancelled'],
 ['vendor cancellation','PAY-12',f=>{f.type('AP','AP - Product');f.payment.fields[E.PAYMENT_FIELDS.cancelled]=true},'cancelled'],
 ['reconciliation signed discrepancy','PAY-26',f=>{f.payment.fields[E.PAYMENT_FIELDS.reconciled]=true;f.payment.fields[E.PAYMENT_FIELDS.discrepancy]=-1.25},'reconciled'],
 ['credit application','PAY-11',f=>{f.type('AP','AP - Product');f.invoice.fields[I.paymentStatus]='Fully Paid';f.invoice.fields[I.creditsApplied]=-20;f.invoice.fields[I.sourceCredits]=links('credit');f.put(T.invoices,'credit',{[C.type]:'AP',[C.vendorTypeAP]:{name:'AP - Credit'},[C.available]:-20,[C.recipientInvoices]:links('invoice')})}],
];
for(const[name,code,change,eventType='sent']of cases)test('native parity: '+name,async()=>{
 const f=fixture();change(f);const old=await native(f,code,eventType);const actual=await(eventType==='sent'?sent(f.client):events(f.client)).evaluate(code,'payment',eventType);assert.deepEqual(canon(actual.results),canon(old.results));
 if(code==='PAY-15'){assert.equal(actual.results[0].postings[0].amount,'20.01');assert.equal(actual.results.length,2)}
});

test('invoice-owned interest picks the latest eligible Sent payment and keeps owner invoice',async()=>{
 const f=fixture();f.type('AR','AR - Non-Product');f.invoice.fields[I.accounts]=links(f.account('010.003'));f.invoice.fields[I.amount]=12.34;f.invoice.fields['fldeNFOgl9OBHPlNm']=links('payment','later');f.put(T.payments,'later',{...f.payment.fields,[P.date]:new Date().toISOString().slice(0,10)},'Later payment');
 const category=CATEGORIES.find(c=>c.code==='PAY-25');const event=await createCategoryEvaluator(f.client)(category,f.invoice);assert.equal(event.source.recordId,'invoice');assert.equal(event.paymentRecordId,'later');assert.equal(event.entryDate,new Date().toISOString().slice(0,10));assert.equal(event.categories[0].postings[0].amount,'12.34');
});

test('blocked categories throw; multiple raw vendor types fail instead of being coerced',async()=>{
 const f=fixture();f.type('AR','AR - Non-Product');f.invoice.fields[I.accounts]=links(f.account('122.100'));await assert.rejects(()=>sent(f.client).evaluate('PAY-23','payment','sent'),/Not yet implemented/);
 f.payment.fields[P.vendorTypesAR]=['AR - Non-Product','AR - Product'];await assert.rejects(()=>sent(f.client).evaluate('PAY-01','payment','sent'),/multiple Vendor Types/);
});

test('discount mapping stays blocked in the port',async()=>{
 const f=fixture();f.type('AP','AP - Product');f.invoice.fields[I.paymentStatus]='Fully Paid';f.invoice.fields[I.discountTotal]=5;f.line('discount','004.011',-5);const line=f.db.get(T.lines+'/discount');line.fields[L.type]={name:'Discount'};line.fields[L.discountStatus]={name:'Applied'};
 await assert.rejects(()=>native(f,'PAY-10','sent'),/Not yet implemented/);await assert.rejects(()=>sent(f.client).evaluate('PAY-10','payment','sent'),/Not yet implemented/);
});
