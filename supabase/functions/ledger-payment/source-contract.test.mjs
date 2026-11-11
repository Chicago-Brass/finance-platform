import assert from 'node:assert/strict';
import test from 'node:test';
import {postPayment} from './ledger.ts';
import {lockLedgerSource} from '../_shared/period-review.ts';

const LINES='tblV26TC0f6CKDneL', INVOICES='tbldQXuqNEp8G5pfs';
const id=n=>'rec'+String(n).padStart(14,'0');
const line={invoiceLineRecordId:id(1),eventType:'entry_requested',entryDate:'2026-11-01',categories:[]};

test('invoice-line identity rejects ambiguous events and mismatched sources before opening a transaction',async()=>{
 let calls=0;
 const sql={begin(){calls++;throw Error('Unexpected database access');}};
 const invalid=[
  {...line,eventType:'created'},
  {...line,eventType:'sent'},
  {...line,invoiceLineRecordId:'invalid'},
  {...line,paymentRecordId:id(2)},
  {...line,invoiceRecordId:id(2)},
  {...line,depreciationRecordId:id(2)},
  {...line,prepayLogRecordId:id(2)},
  {...line,source:{tableId:INVOICES,recordId:line.invoiceLineRecordId}},
  {...line,source:{tableId:LINES,recordId:id(2)}},
  {paymentRecordId:id(1),eventType:'sent',entryDate:line.entryDate,categories:[],source:{tableId:LINES,recordId:id(1)}},
 ];
 for(const value of invalid)await assert.rejects(()=>postPayment(sql,value),error=>error.name==='PostingError');
 assert.equal(calls,0);
});

test('an explicit or inferred invoice-line source reaches the same transaction path',async()=>{
 const sentinel=new Error('Transaction reached');let calls=0;
 const sql={begin(){calls++;throw sentinel;}};
 for(const value of [line,{...line,source:{tableId:LINES,recordId:line.invoiceLineRecordId}}]){
  await assert.rejects(()=>postPayment(sql,value),error=>error===sentinel);
 }
 assert.equal(calls,2);
});

test('all supported source kinds have distinct stable source-lock keys',async()=>{
 const seen=[];const tx=async(_strings,...values)=>seen.push(values[0]);
 const sourceId=id(5);
 for(const tableId of ['tblR61NG9i0giid28',INVOICES,LINES,'tblC0dbO5UMXzHma9','tbl1LgiUYt7Gc492d','tblAxlsdmJN0X0sQs']){
  await lockLedgerSource(tx,{tableId,recordId:sourceId});
 }
 assert.deepEqual(seen,['FIN payment:','FIN invoice:','FIN invoice line:','FIN depreciation:','FIN prepay:','FIN shipping:'].map(prefix=>prefix+sourceId));
 assert.equal(new Set(seen).size,6);
});


test('shipping events use their own identity and reject ambiguous or disguised sources',async()=>{
 const sentinel=new Error('Transaction reached');const sql={begin(){throw sentinel;}};
 const event={shippingRecordId:id(7),eventType:'created',entryDate:'2026-11-01',categories:[]};
 await assert.rejects(()=>postPayment(sql,event),error=>error===sentinel);
 for(const bad of [{...event,eventType:'sent'},{...event,paymentRecordId:id(1)},{...event,invoiceLineRecordId:id(1)},{...event,source:{tableId:INVOICES,recordId:id(7)}},{paymentRecordId:id(7),eventType:'sent',entryDate:event.entryDate,categories:[],source:{tableId:'tblAxlsdmJN0X0sQs',recordId:id(7)}}])await assert.rejects(()=>postPayment(sql,bad),error=>error.name==='PostingError');
});
