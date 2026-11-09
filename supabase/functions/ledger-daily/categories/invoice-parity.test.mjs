import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {expenseFields as F,invoiceEntryFields as V,paidExpenseFields as P,depreciationFields as D,prepayFields as L} from '../definitions.ts';
import {createCategories as expenses} from './expense-entry.js';
import {createCategories as paid} from './expense-fully-paid.js';
import {createCategories as invoices} from './invoice-entry.js';
import {createCategories as outbound} from './invoice-created.js';
import {createCategories as depreciation} from './depreciation-created.js';
import {createCategories as prepay} from './prepay-created.js';
import {createCategoryEvaluator} from './index.ts';
import {CATEGORIES} from '../queries.ts';
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const I={...F.INVOICE_FIELDS,...V.INVOICE_FIELDS},T=F.TABLES,A=F.ACCOUNT_FIELDS,LN=F.LINE_FIELDS;
const links=(...ids)=>ids.map(id=>({id,name:id}));
class Record {constructor(id,fields){this.id=id;this.name=id;this.fields=fields;}value(id){return this.fields[id]??null;}text(id){const value=this.value(id);return value===null?'':Array.isArray(value)?value.map(v=>v?.name??v).join(', '):typeof value==='object'?value.name:String(value);}getCellValue(id){return this.value(id);}getCellValueAsString(id){return this.text(id);}}
function fixture(){
 const db=new Map();const put=(t,id,fields)=>{const r=new Record(id,fields);db.set(t+'/'+id,r);return r;};
 const account=code=>{const id='acct'+code;put(T.accounts,id,{[A.number]:code});return id;};
 const invoice=put(T.invoices,'invoice',{[I.type]:'AP',[I.vendorType]:'AP - Expenses (Non-Sales Tax)',[I.vendorTypeAP]:{name:'AP - Expenses (Non-Sales Tax)'},[I.vendorTypeAR]:{name:'AR - Non-Product'},[I.date]:'2026-05-01',[I.amount]:-100,[I.branch]:{name:'Chicago'},[I.lines]:[],[I.accounts]:[],[I.payments]:links('payment'),[I.employeeBranch]:['Milwaukee'],[P.INVOICE_FIELDS.status]:'Fully Paid'});
 put(P.TABLES.payments,'payment',{[P.PAYMENT_FIELDS.accounts]:links(account('112.100'))});
 const client={async readRecord(t,id){return db.get(t+'/'+id)??null;},async readRecords(t,ids){return ids.map(id=>{const r=db.get(t+'/'+id);assert(r,'Missing fixture '+t+'/'+id);return r;});},async loadLinkNames(){}};
 const base={getTable(t){return {async selectRecordAsync(id){return client.readRecord(t,id);},async selectRecordsAsync({recordIds}){return {records:await client.readRecords(t,recordIds)};}};}};
 const line=(id,code,amount)=>{put(T.lines,id,{[LN.accounts]:links(account(code)),[LN.amount]:amount,[LN.invoices]:links('invoice')});invoice.fields[I.lines].push(...links(id));};
 const staff=()=>{invoice.fields[I.vendorType]='AP - Staff';invoice.fields[I.vendorTypeAP]={name:'AP - Staff'};};
 const vendor=type=>{invoice.fields[I.vendorType]=type;invoice.fields[I.vendorTypeAP]={name:type};};
 put(D.TABLE,'depreciation',{[D.FIELDS.amount]:-20.25,[D.FIELDS.date]:'2026-05-01',[D.FIELDS.assets]:[]});
 put(L.TABLE,'prepay',{[L.FIELDS.amount]:-15.50,[L.FIELDS.date]:'2026-05-01',[L.FIELDS.invoices]:links('invoice'),[L.FIELDS.name]:'Synthetic prepaid use'});
 return {db,put,invoice,client,base,account,line,staff,vendor};
}
const cases=[
 ['EXP-01','expense-entry',expenses,'handleOperatingExpense',f=>f.invoice.fields[I.accounts]=links(f.account('006.002'))],
 ['EXP-02','expense-fully-paid',paid,'handleCardExpense',f=>{f.invoice.fields[I.accounts]=links(f.account('008.001'));f.put(P.TABLES.payments,'payment',{[P.PAYMENT_FIELDS.accounts]:links(f.account('231.100'))});}],
 ['EXP-03','expense-entry',expenses,'handlePrepaidExpense',f=>f.invoice.fields[I.prepaid]=true],
 ['EXP-04','prepay-created',prepay,'handlePrepaidUse',()=>{}],
 ['EXP-05','expense-entry',expenses,'handleTechAllowance',f=>{f.staff();f.line('a','005.102',10.005);f.line('b','005.102',10.005);}],
 ['EXP-06','expense-entry',expenses,'handleW2Payroll',f=>{f.staff();f.line('a','005.002',10.005);f.line('b','005.002',10.005);f.line('tax','005.006',-2.25);f.line('401k','005.005',3);}],
 ['EXP-07','expense-entry',expenses,'handleOffshorePayroll',f=>{f.staff();f.line('a','005.101',-50);f.line('b','005.003',10);}],
 ['EXP-09','expense-entry',expenses,'handleBonusCommission',f=>{f.staff();f.line('a','005.201',-20);}],
 ['EXP-10','depreciation-created',depreciation,'handleMonthlyDepreciation',()=>{}],
 ['EXP-11','expense-fully-paid',paid,'handleBankFees',f=>f.invoice.fields[I.accounts]=links(f.account('007.002'))],
 ['EXP-12','expense-entry',expenses,'handleBadDebtReserve',f=>f.invoice.fields[I.accounts]=links(f.account('007.005'))],
 ['EXP-13','expense-entry',expenses,'handleIncomeTaxAccrual',f=>f.invoice.fields[I.accounts]=links(f.account('242.100'))],
 ['INV-01','invoice-entry',invoices,'handleReceivedProductInvoice',f=>{f.vendor('AP - Product');f.invoice.fields[I.receivedNotInvoiced]=100;}],
 ['INV-03','invoice-entry',invoices,'handleVendorDepositInvoice',f=>{f.vendor('AP - Product');f.invoice.fields[I.poStatus]=['Confirmed'];}],
 ['INV-04','invoice-entry',invoices,'handleInboundFreightInvoice',f=>{f.vendor('AP - Product');f.invoice.fields[I.freight]=-2.50;}],
 ['INV-05','invoice-created',outbound,'handleOutboundShippingInvoice',f=>f.invoice.fields[I.accounts]=links(f.account('004.013'))],
 ['INV-06','invoice-entry',invoices,'handleSalesTaxInvoice',f=>f.vendor('AP - Expenses (Sales Tax)')],
 ['INV-07','invoice-entry',invoices,'handleAssetInvoice',f=>f.vendor('AP - Assets')],
 ['INV-08','invoice-entry',invoices,'handleVendorReturnCredit',f=>{f.vendor('AP - Credit');f.invoice.fields[I.purchaseOrders]=links('po');}],
 ['INV-09','invoice-entry',invoices,'handleVendorPriceCredit',f=>f.vendor('AP - Credit')],
 ['INV-10','invoice-entry',invoices,'handleCustomerNonProductInvoice',f=>{f.invoice.fields[I.type]='AR';f.invoice.fields[I.accounts]=links(f.account('010.001'));}],
];
for(const [code,file,factory,handler,change]of cases)test('native invoice/expense parity: '+code,async()=>{
 const f=fixture();change(f);
 const load=file.startsWith('expense')?'loadExpenseData':file.startsWith('invoice')?'loadInvoiceData':file.startsWith('prepay')?'loadPrepayData':'loadDepreciationData';
 const id=file.startsWith('prepay')?'prepay':file.startsWith('depreciation')?'depreciation':'invoice';
 const source=fs.readFileSync(new URL('../../../../airtable/'+file+'.js',import.meta.url),'utf8');
 const exported=await new AsyncFunction('base','input','console',source.replace(/^await main\([^\n]*\);/m,`return {${load},handler:${handler}${file==='expense-entry'?',accountEntries':''}};`))(f.base,{config:()=>({})},{log(){}});
 const data=await exported[load](id),expected=[];await exported.handler(data,expected);
 const grouped=file==='expense-entry'?expected.flatMap(exported.accountEntries):expected;
 const actual=await factory(f.client).evaluate(code,id);
 assert.deepEqual(actual.results,grouped);
 assert(grouped.length,'Fixture must qualify');
 const definition=CATEGORIES.find(c=>c.code===code);
 const record=await f.client.readRecord(definition.tableId,id);
 const payload=await createCategoryEvaluator(f.client)(definition,record);
 assert(payload);assert.equal(payload.source.recordId,id);assert.equal(payload.entryDate,'2026-05-01');
 assert(payload.categories.some(c=>c.postings.some(p=>Number(p.amount)!==0)));
 if(code==='EXP-06'){assert.equal(payload.categories.length,3);assert.equal(payload.categories.find(c=>c.postings[0].debitAccount.number==='005.002').postings[0].amount,'20.01');}
});
