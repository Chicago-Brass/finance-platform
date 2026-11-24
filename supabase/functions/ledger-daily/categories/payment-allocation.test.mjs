import test from 'node:test';
import assert from 'node:assert/strict';
import {allocateInvoicePaymentCents as allocate} from './payment-allocation.ts';

const invoice=(id,share)=>({id,value:()=>share});
test('the operating share excludes the linked loan principal',()=>{
 const interest=invoice('interest',39.45/759.36),loan=invoice('loan',719.91/759.36),all=[interest,loan];
 assert.equal(allocate(759.36,all,[interest],'share'),3945);
 assert.equal(allocate(759.36,all,[loan],'share'),71991);
 assert.equal(allocate(-759.36,all,[interest],'share'),-3945);
});
test('sums relevant invoices and assigns each rounding cent once across disjoint filters',()=>{
 const all=[invoice('a',0.26),invoice('b',0.26),invoice('c',0.48)];
 for(const amount of [0.01,-0.01,10.01,-10.01,99999.99]){
  const first=allocate(amount,all,all.slice(0,2),'share'),second=allocate(amount,all,all.slice(2),'share');
  assert.equal(first+second,Math.round(amount*100));
  assert.equal(allocate(amount,all,all,'share'),first+second);
  assert.equal(allocate(amount,[...all].reverse(),all.slice(0,2),'share'),first);
 }
});
test('signed credit proportions remain signed and conserve cash',()=>{
 const bill=invoice('bill',1.2),credit=invoice('credit',-0.2),all=[bill,credit];
 assert.equal(allocate(100,all,[bill],'share'),12000);
 assert.equal(allocate(100,all,[credit],'share'),-2000);
});
test('negative invoice credits do not hide opposing cent errors in a mixed batch',()=>{
 const amounts=[62.97,512.32,32.99,106,9.99,-433.94,114.99,1032.06],total=1437.38;
 const all=amounts.map((amount,i)=>invoice(String(i),amount/total)),matching=all.filter((_,i)=>![5,6].includes(i));
 for(const sign of [1,-1]){
  assert.equal(allocate(sign*total,all,matching,'share'),sign*175633);
  assert.equal(allocate(sign*total,all,all.filter((_,i)=>[5,6].includes(i)),'share'),sign*-31895);
 }
});
test('duplicate references do not multiply allocation',()=>{
 const a=invoice('a',0.5),b=invoice('b',0.5);
 assert.equal(allocate(100,[a,a,b],[a,a],'share'),5000);
});
test('invalid inputs fail before producing an amount, while unmatched and zero payments are no-ops',()=>{
 for(const share of [null,undefined,NaN,Infinity,'1'])assert.throws(()=>allocate(10,[invoice('a',share)],[invoice('a',share)],'share'),/Payment Proportion/);
 const a=invoice('a',0.9);assert.throws(()=>allocate(10,[a],[a],'share'),/100%/);
 const valid=invoice('a',1);for(const amount of [null,NaN,Infinity,'10'])assert.throws(()=>allocate(amount,[valid],[valid],'share'),/Payment Amount/);
 assert.throws(()=>allocate(Number.MAX_SAFE_INTEGER,[valid],[valid],'share'),/safe cent/);
 assert.throws(()=>allocate(10,[valid],[invoice('other',1)],'share'),/not linked/);
 assert.equal(allocate(0,[a],[a],'share'),0);
 assert.equal(allocate(10,[a],[],'share'),0);
});
