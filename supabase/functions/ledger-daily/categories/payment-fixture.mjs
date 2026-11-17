import assert from 'node:assert/strict';
import {createCategoryEvaluator} from './index.ts';
import {paymentWorkerFields as F} from '../definitions.ts';
import {PAYMENT_CATEGORIES} from '../rules/payments.ts';
const {TABLES:T,INVOICE_FIELDS:I,PAYMENT_FIELDS:P,LINE_FIELDS:L,ACCOUNT_FIELDS:A}=F;
const links=(...ids)=>ids.map(id=>({id,name:id}));
class Record {
 constructor(tableId,id,fields){this.tableId=tableId;this.id=id;this.name=id;this.fields=fields;}
 value(id){return this.fields[id]??null;}
 text(id){const v=this.value(id);return v==null?'':Array.isArray(v)?v.map(x=>x?.name??x).join(', '):typeof v==='object'?v.name:String(v);}
}
export function fixture(){
 const rows=new Map();const put=(t,id,f)=>{const r=new Record(t,id,f);rows.set(t+'/'+id,r);return r;};
 const account=code=>{put(T.accounts,code,{[A.number]:code});return code;};
 const invoice=put(T.invoices,'invoice',{[I.type]:{name:'AP'},[I.vendorTypeAP]:{name:'AP - Assets'},[I.vendorTypeAR]:{name:'AR - Non-Product'},[I.amount]:-10.005,[I.date]:'2026-11-01',[I.status]:{name:'Fully Paid'},[I.accounts]:links(account('143.200')),[I.branch]:{name:'Chicago'},[I.payments]:links('payment'),[I.lines]:links('line')});
 for(const [f,id]of [[I.vendors,'vendor'],[I.clients,'client'],[I.staff,'staff'],[I.transactions,'transaction'],[I.purchaseOrders,'po'],[I.states,'state']])invoice.fields[f]=links(id);
 const payment=put(T.payments,'payment',{[P.type]:'AP',[P.sent]:true,[P.recordType]:{name:'Regular Payment'},[P.amount]:-12.30,[P.date]:'2026-11-02',[P.accounts]:links(account('0747')),[P.invoices]:links(invoice.id),[P.reference]:'TEST'});
 const line=put(T.lines,'line',{[L.invoices]:links(invoice.id),[L.accounts]:links(account('004.011')),[L.type]:{name:'Expense'},[L.amount]:-10.005});
 const client={dateRange:{from:'2026-11-01',to:'2026-11-30'},async readRecord(t,id){return rows.get(t+'/'+id)??null;},async readRecords(t,ids){return [...new Set(ids)].map(id=>{const r=rows.get(t+'/'+id);assert(r,'Missing fixture '+t+'/'+id);return r;});}};
 const evaluate=async code=>{const c=PAYMENT_CATEGORIES.find(c=>c.code===code);return createCategoryEvaluator(client)(c,c.tableId===T.invoices?invoice:c.tableId===T.lines?line:payment);};
 return {invoice,payment,line,put,account,client,evaluate};
}
