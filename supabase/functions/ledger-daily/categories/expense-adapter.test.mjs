import test from 'node:test';
import assert from 'node:assert/strict';
import {createCategoryEvaluator, sourceFields} from './index.ts';
import {sourceDateFilter} from '../scope.ts';
import {expenseWorkerFields as F, POSTING_FIELDS} from '../definitions.ts';

const ID={invoice:'rec'+'I'.repeat(14),line:'rec'+'L'.repeat(14),payment:'rec'+'P'.repeat(14),prepay:'rec'+'R'.repeat(14),depreciation:'rec'+'D'.repeat(14)};
const links=(...ids)=>ids.map(id=>({id,name:id}));
class Record {
  constructor(tableId,id,fields){this.tableId=tableId;this.id=id;this.name=id;this.fields=fields;}
  value(field){return this.fields[field]??null;}
  text(field){const value=this.value(field);return value===null?'':Array.isArray(value)?value.map(v=>v?.name??v).join(', '):typeof value==='object'?value.name:String(value);}
}
function fixture(){
  const rows=new Map(), T=F.TABLES;
  const put=(table,id,fields)=>{const row=new Record(table,id,fields);rows.set(table+'/'+id,row);return row;};
  const account=code=>{const id='account-'+code;put(T.accounts,id,{[F.ACCOUNT_FIELDS.number]:code});return id;};
  const invoice=put(T.invoices,ID.invoice,{
    fld9e6yDIv0PtBDV0:{name:'AP'},fldXwodwAuXLJt5rP:{name:'AP - Staff'},
    fldSungTQU5nIEIvi:'2026-10-10',fldm5nXoW7MrwjkhW:999,
    fldSHm0sXlVswhqs4:['Chicago'],fldt5PjqGDrINUYT5:{name:'Chicago'},
    fldT5u0prSS8G1H4x:links(account('006.002')),fldF0uqCMkPgwuIes:links(ID.line),
    fld2YNpvvqweloE6S:{name:'Fully Paid'},fldckuYNfSzBXq0AX:true,
  });
  const line=put(T.lines,ID.line,{
    fldZpOBUbuVJbuaOG:links(ID.invoice),fldwr0Pfp8OHsNj5N:links(account('005.102')),fldkhhHCD2qKD71rI:12.50,
  });
  const payment=put(T.payments,ID.payment,{
    fld03L3JpNZBLauEC:true,fld0mYG8IMrDaNzdE:'2026-11-10',fldhP2S68pT3XkZmX:-50.25,
    fldCIQSOdytBGi91S:links(account('112.100')),fldzPDwsJ1ZT2tVIs:links(ID.invoice),
    fldkoW3MMQEe0Lwm1:'AP',fldJlmVZzUf5tuz0m:'AP - Expenses (Non-Sales Tax)',
    fldxjaur2SnqKmRfN:'Synthetic Payment Reference',
  });
  const prepay=put(T.prepay,ID.prepay,{
    fldg3040Hc1Z6AQoe:links(ID.invoice),fld5NmFxp9Dhza6BK:10.25,fldXoWjXIrS76p84x:'2026-11-09',fldBuTnJqQ5ymPhRt:'Synthetic prepaid note',
  });
  const depreciation=put(T.depreciation,ID.depreciation,{
    fld58fd0YHB0YRxC1:15.75,fldQ299tE4wJB4SmH:'2026-11-08',fldLXqVZ4TUaxq8kF:[],
  });
  const client={async readRecord(t,id){return rows.get(t+'/'+id)??null;},async readRecords(t,ids){return ids.map(id=>{const row=rows.get(t+'/'+id);assert(row,'Missing synthetic record '+t+'/'+id);return row;});},async loadLinkNames(){}};
  const definition=(code,table,eventType='entry_requested')=>({id:code,code,name:code,module:'expenses',tableId:table,eventType,input:'record',status:'implemented',filter:()=> 'TRUE()'});
  return{client,invoice,line,payment,prepay,depreciation,account,definition};
}

test('Expense source field selection follows the source table rather than category prefix',()=>{
  for(const [table,fields]of [[F.TABLES.invoices,F.INVOICE_FIELDS],[F.TABLES.lines,F.LINE_FIELDS],[F.TABLES.payments,F.PAYMENT_FIELDS],[F.TABLES.prepay,F.PREPAY_FIELDS],[F.TABLES.depreciation,F.DEPRECIATION_FIELDS]]){
    const selected=sourceFields({module:'expenses',tableId:table});
    for(const field of Object.values(fields))assert(selected.includes(field),table+' missing '+field);
    for(const field of Object.values(POSTING_FIELDS[table]??{}))assert(selected.includes(field));
    if(table!==F.TABLES.invoices)assert(!selected.includes(F.INVOICE_FIELDS.date),'Parent Invoice Date must not be requested on '+table);
  }
  assert.throws(()=>sourceFields({module:'expenses',tableId:'unknown'}),/Unsupported Expense source/);
});

test('Invoice Lines accounting-date discovery is constrained on the parent query',()=>{
  assert.equal(sourceDateFilter({tableId:F.TABLES.lines,input:'record'}, {field(){throw Error('Invoice Lines has no Invoice Date field');}}),'');
});

test('Expense line packets own the line while referencing the parent invoice and its date',async()=>{
  const f=fixture();const payload=await createCategoryEvaluator(f.client)(f.definition('EXP-05',F.TABLES.lines),f.line);
  assert(payload);assert.equal(payload.invoiceLineRecordId,ID.line);assert.equal(payload.invoiceRecordId,undefined);
  assert.equal(payload.paymentRecordId,undefined);assert.equal(payload.depreciationRecordId,undefined);
  assert.deepEqual(payload.source,{tableId:F.TABLES.lines,recordId:ID.line,recordName:ID.line});
  assert.equal(payload.entryDate,'2026-10-10');
  assert(payload.categories.some(c=>c.postings.some(p=>p.invoiceRecordId===ID.invoice||(p.invoiceRecordIds??[]).includes(ID.invoice))));
});

test('Expense payment packets retain full signed payment amount, payment identity and Payment Date',async()=>{
  const f=fixture();f.invoice.fields.fldXwodwAuXLJt5rP={name:'AP - Expenses (Non-Sales Tax)'};
  const payload=await createCategoryEvaluator(f.client)(f.definition('EXP-14',F.TABLES.payments,'sent'),f.payment);
  assert(payload);assert.equal(payload.paymentRecordId,ID.payment);assert.equal(payload.invoiceRecordId,undefined);
  assert.equal(payload.entryDate,'2026-11-10');assert.equal(payload.referenceNumber,'Synthetic Payment Reference');
  assert.equal(payload.categories.flatMap(c=>c.postings).reduce((sum,p)=>sum+Number(p.amount),0),-50.25);
});

test('Expense invoice packets retain invoice ownership and Invoice Date',async()=>{
  const f=fixture();f.invoice.fields.fldXwodwAuXLJt5rP={name:'AP - Expenses (Non-Sales Tax)'};
  const payload=await createCategoryEvaluator(f.client)(f.definition('EXP-01',F.TABLES.invoices),f.invoice);
  assert(payload);assert.equal(payload.invoiceRecordId,ID.invoice);assert.equal(payload.entryDate,'2026-10-10');
  assert.equal(payload.invoiceLineRecordId,undefined);assert.equal(payload.paymentRecordId,undefined);
});

test('Prepay and depreciation packets preserve log ownership, recorded dates and notes',async()=>{
  const f=fixture();f.invoice.fields.fldXwodwAuXLJt5rP={name:'AP - Assets'};
  const evaluate=createCategoryEvaluator(f.client);
  const prepaid=await evaluate(f.definition('EXP-04',F.TABLES.prepay,'created'),f.prepay);
  assert(prepaid);assert.equal(prepaid.prepayLogRecordId,ID.prepay);assert.equal(prepaid.invoiceRecordId,undefined);
  assert.equal(prepaid.entryDate,'2026-11-09');assert(prepaid.categories.some(c=>c.notes?.includes('Synthetic prepaid note')));
  const depreciation=await evaluate(f.definition('EXP-10',F.TABLES.depreciation,'created'),f.depreciation);
  assert(depreciation);assert.equal(depreciation.depreciationRecordId,ID.depreciation);assert.equal(depreciation.invoiceRecordId,undefined);
  assert.equal(depreciation.entryDate,'2026-11-08');
});
