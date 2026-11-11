import test from 'node:test';
import assert from 'node:assert/strict';
import {expenseWorkerFields as F} from '../definitions.ts';
import {createCategories} from './expenses.js';
import {createCategoryEvaluator,sourceFields} from './index.ts';
import {CATEGORIES} from '../queries.ts';

const T=F.TABLES,I=F.INVOICE_FIELDS,L=F.LINE_FIELDS,P=F.PAYMENT_FIELDS,A=F.ACCOUNT_FIELDS;
const INVOICE='rec'+'I'.repeat(14),PAYMENT='rec'+'P'.repeat(14),PREPAY='rec'+'U'.repeat(14),DEPRECIATION='rec'+'D'.repeat(14);
const links=(...ids)=>ids.map(id=>({id,name:id}));
class Record{
 constructor(id,fields,name=id){this.id=id;this.fields=fields;this.name=name;}
 value(field){return this.fields[field]??null;}
 text(field){const value=this.value(field);return value==null?'':Array.isArray(value)?value.map(v=>v?.name??v).join(', '):typeof value==='object'?value.name:String(value);}
}
function fixture({vendor='AP - Expenses (Non-Sales Tax)',account='006.002',bank='112.100',amount=-45.67}={}){
 const db=new Map(),reads=[];
 const put=(table,id,fields,name)=>{const record=new Record(id,fields,name);db.set(table+'/'+id,record);return record;};
 const accountId=code=>{const id='account-'+code;put(T.accounts,id,{[A.number]:code});return id;};
 const invoice=put(T.invoices,INVOICE,{
  [I.type]:{name:'AP'},[I.vendorType]:{name:vendor},[I.amount]:-1000,[I.date]:'2026-05-01',
  [I.accounts]:links(accountId(account)),[I.lines]:[],[I.payments]:links(PAYMENT),[I.branch]:{name:'Chicago'},
  [I.employeeBranch]:['Milwaukee'],[I.prepaid]:false,[I.status]:{name:'Fully Paid'},
  [I.vendors]:links('vendor-a','vendor-b'),[I.clients]:links('client'),[I.staff]:links('staff'),
  [I.transactions]:links('transaction'),[I.purchaseOrders]:links('po'),[I.states]:[{id:'state',name:'Illinois'}],
 },'Synthetic Invoice');
 const payment=put(T.payments,PAYMENT,{
  [P.sent]:true,[P.amount]:amount,[P.date]:'2026-06-03',[P.invoices]:links(INVOICE),[P.accounts]:links(accountId(bank)),
  [P.reference]:'Synthetic Payment Ref',
 },'Synthetic Payment');
 const line=(id,code,value)=>{
  const record=put(T.lines,id,{[L.accounts]:links(accountId(code)),[L.invoices]:links(INVOICE),[L.amount]:value});
  invoice.fields[I.lines].push(...links(id));return record;
 };
 const client={
  async readRecord(table,id){reads.push([table,id]);return db.get(table+'/'+id)??null;},
  async readRecords(table,ids){return await Promise.all([...new Set(ids)].map(async id=>{const record=await this.readRecord(table,id);assert(record,'Missing fixture '+table+'/'+id);return record;}));},
  async loadLinkNames(){},
 };
 const evaluate=async(code,id)=>{const rule=CATEGORIES.find(c=>c.code===code);assert(rule,'Missing category '+code);return await createCategories(client).evaluate(code,id,rule.tableId);};
 return{db,reads,put,accountId,invoice,payment,line,client,evaluate};
}
const postings=result=>result.results.flatMap(r=>r.postings);
const pair=posting=>[posting.debitAccount.number,posting.creditAccount.number,Number(posting.amount)];
const invoiceCases=[
 ['EXP-01','006.002','AP - Expenses (Non-Sales Tax)','006.002'],
 ['EXP-03','007.011','AP - Assets','135.000'],
 ['EXP-11','007.002','AP - Expenses (Non-Sales Tax)','007.002'],
 ['EXP-15','004.010','AP - Product','004.010'],
];
for(const[code,account,vendor,debit]of invoiceCases)test('Expense invoice amount and AP mapping: '+code,async()=>{
 const f=fixture({account,vendor});if(code==='EXP-03')f.invoice.fields[I.prepaid]=true;
 f.invoice.fields[I.status]={name:'Fully Unpaid'};
 const result=await f.evaluate(code,INVOICE);
 assert.deepEqual(postings(result).map(pair),[[debit,'211.100',-1000]]);
 assert.equal(result.data.entryDate,'2026-05-01');
 assert.equal(postings(result)[0].invoiceRecordId,INVOICE);
 assert.deepEqual(postings(result)[0].vendorRecordIds,['vendor-a','vendor-b']);
});
const paymentCases=[
 ['EXP-14','006.002','AP - Expenses (Non-Sales Tax)','112.100','211.100','112.100'],
 ['EXP-16','004.010','AP - Product','112.200','211.100','112.200'],
 ['EXP-02','008.001','AP - Expenses (Non-Sales Tax)','231.100','008.001','231.100'],
 ['EXP-17','007.011','AP - Assets','0747','211.100','0747'],
 ['EXP-27','007.002','AP - Expenses (Non-Sales Tax)','112.100','211.100','112.100'],
];
for(const[code,account,vendor,bank,debit,credit]of paymentCases)test('Expense payment uses full signed Payment Amount without allocation: '+code,async()=>{
 const f=fixture({account,vendor,bank,amount:-45.67});f.invoice.fields[I.prepaid]=true;
 if(code==='EXP-02')f.invoice.fields[I.noVendorBill]=true;
 if(code!=='EXP-17')f.invoice.fields[I.status]={name:'Partially Paid'};
 const result=await f.evaluate(code,PAYMENT);
 assert.deepEqual(postings(result).map(pair),[[debit,credit,-45.67]]);
 assert.equal(result.data.entryDate,'2026-06-03');
 assert.equal(postings(result)[0].invoiceRecordId,INVOICE);
 if(code==='EXP-17'){
  f.invoice.fields[I.status]={name:'Partially Paid'};
  assert.equal(postings(await f.evaluate(code,PAYMENT)).length,0);
 }
 f.payment.fields[P.sent]=false;
 assert.equal(postings(await f.evaluate(code,PAYMENT)).length,0);
});

test('card expense checks this payment account without requiring Fully Paid',async()=>{
 const f=fixture({account:'008.001',bank:'231.100'});f.invoice.fields[I.status]={name:'Partially Paid'};
 assert.equal(postings(await f.evaluate('EXP-02',PAYMENT)).length,0);
 f.invoice.fields[I.noVendorBill]=true;
 assert.equal(postings(await f.evaluate('EXP-02',PAYMENT)).length,1);
 f.payment.fields[P.accounts]=links(f.accountId('112.100'));
 assert.equal(postings(await f.evaluate('EXP-02',PAYMENT)).length,0);
});

test('one Payment Amount is emitted once when several matching invoices are linked',async()=>{
 const f=fixture({amount:125});const second='rec'+'J'.repeat(14);
 f.put(T.invoices,second,{...f.invoice.fields,[I.amount]:-250},'Second Synthetic Invoice');
 f.payment.fields[P.invoices].push(...links(second));
 const result=await f.evaluate('EXP-14',PAYMENT),actual=postings(result);
 assert.deepEqual(actual.map(pair),[['211.100','112.100',125]]);
 assert.deepEqual([...actual[0].invoiceRecordIds].sort(),[INVOICE,second].sort());
});

test('aggregate Expense payments preserve unknown branch attribution',async()=>{
 const f=fixture({amount:125}),second='rec'+'J'.repeat(14);
 const invoice=f.put(T.invoices,second,{...f.invoice.fields,[I.branch]:null});
 f.payment.fields[P.invoices].push(...links(second));
 const branches=async()=>postings(await f.evaluate('EXP-14',PAYMENT))[0].branch;
 assert.deepEqual(await branches(),[]);
 invoice.fields[I.branch]={name:'Chicago'};assert.deepEqual(await branches(),['Chicago']);
 invoice.fields[I.branch]={name:'Milwaukee'};assert.deepEqual((await branches()).sort(),['Chicago','Milwaukee']);
 f.payment.fields[P.invoices]=links(INVOICE);f.invoice.fields[I.branch]=null;
 assert.deepEqual(await branches(),[]);
});

test('Prepaid invoices require the live AP Assets type and prepaid checkbox',async()=>{
 const f=fixture({vendor:'AP - Assets',account:'007.011'});
 assert.equal(postings(await f.evaluate('EXP-03',INVOICE)).length,0);
 f.invoice.fields[I.prepaid]=true;assert.equal(postings(await f.evaluate('EXP-03',INVOICE)).length,1);
 f.invoice.fields[I.vendorType]={name:'AP - Expenses (Non-Sales Tax)'};
 assert.equal(postings(await f.evaluate('EXP-03',INVOICE)).length,0);
});

const lineCases=[
 ['EXP-05','005.102','AP - Staff'],
 ...['005.001','005.002','005.003','005.005','005.006'].map(code=>['EXP-06',code,'AP - Staff']),
 ['EXP-07','005.101','AP - Staff'],['EXP-09','005.201','AP - Staff'],
 ['EXP-13','923100','AP - Expenses (Non-Sales Tax)','011.001'],['EXP-13','923300','AP - Expenses (Non-Sales Tax)','011.002'],
];
for(const[rule,account,vendor,debit=account]of lineCases)test('Expense invoice-line source maps its own amount to AP: '+rule+' '+account,async()=>{
 const f=fixture({vendor}),id='line-'+account;f.line(id,account,-12.3456);f.line('sibling',account,500);
 const result=await f.evaluate(rule,id);assert.equal(result.results.length,1);
 const actual=postings(result);assert.equal(actual.length,1);
 assert.equal(actual[0].debitAccount.number,debit);assert.equal(actual[0].creditAccount.number,'211.100');
 assert.equal(Number(actual[0].amount),-12.35);assert.equal(actual[0].sourceRecordId,id);assert.equal(actual[0].invoiceRecordId,INVOICE);
 assert.equal(result.data.entryDate,'2026-05-01');
 if(rule==='EXP-05')assert.deepEqual(actual[0].branch,['Milwaukee']);
});

test('line roots retain source identity, parent invoice refs and parent accounting date in writer payloads',async()=>{
 const f=fixture({vendor:'AP - Staff'}),id='rec'+'L'.repeat(14);const line=f.line(id,'005.102',10);
 const rule=CATEGORIES.find(c=>c.code==='EXP-05');const event=await createCategoryEvaluator(f.client)(rule,line);
 assert.equal(event.source.tableId,T.lines);assert.equal(event.source.recordId,id);assert.equal(event.invoiceLineRecordId,id);
 assert.equal(event.invoiceRecordId,undefined);assert.equal(event.entryDate,'2026-05-01');
 assert.equal(event.categories[0].postings[0].invoiceRecordId,INVOICE);
 const fields=sourceFields(rule);assert(fields.includes(L.amount));assert(fields.includes(L.invoices));assert(!fields.includes(I.amount));
});

test('offshore and W2 filters keep their separate line-account scopes',async()=>{
 const f=fixture({vendor:'AP - Staff'});
 for(const code of ['005.001','005.003','005.201','241.600']){
  const id='line-'+code;f.line(id,code,10);assert.equal(postings(await f.evaluate('EXP-07',id)).length,0);
 }
 const line=f.line('offshore','005.101',10);assert.equal(postings(await f.evaluate('EXP-06',line.id)).length,0);
 f.invoice.fields[I.vendorType]={name:'AP - Expenses (Non-Sales Tax)'};
 for(const code of ['242.100','011.001','011.002']){
  const oldTax=f.line('old-tax-'+code,code,10);
  assert.equal(postings(await f.evaluate('EXP-13',oldTax.id)).length,0);
 }
});

test('a matching invoice line cannot silently split its amount across multiple accounts',async()=>{
 const f=fixture({vendor:'AP - Staff'}),line=f.line('ambiguous','005.102',25);
 line.fields[L.accounts].push(...links(f.accountId('005.002')));
 await assert.rejects(()=>f.evaluate('EXP-05',line.id),/multiple|one account|single account|split/i);
 line.fields[L.accounts]=links(f.accountId('005.102'));
 line.fields[L.invoices].push(...links('other-invoice'));
 await assert.rejects(()=>f.evaluate('EXP-05',line.id),/one invoice|single invoice|one matching invoice/i);
});

test('cancelled parents and cancelled or returned payments cannot post Expense entries',async()=>{
 const f=fixture({vendor:'AP - Staff'}),line=f.line('salary','005.002',10);
 f.invoice.fields[I.cancelled]=true;
 assert.equal(postings(await f.evaluate('EXP-06',line.id)).length,0);
 f.invoice.fields[I.cancelled]=false;f.payment.fields[P.cancelled]=true;
 assert.equal(postings(await f.evaluate('EXP-19',PAYMENT)).length,0);
 f.payment.fields[P.cancelled]=false;f.payment.fields[P.returned]=true;
 assert.equal(postings(await f.evaluate('EXP-19',PAYMENT)).length,0);
});

const linePaymentCases=[
 ['EXP-18',['005.102'],'AP - Staff','211.100'],
 ['EXP-19',['005.001','005.002','005.003','005.005','005.006'],'AP - Staff','211.100'],
 ['EXP-20',['005.101'],'AP - Staff','211.100'],['EXP-21',['005.201'],'AP - Staff','211.100'],
 ['EXP-23',['005.103'],'AP - Staff','241.300'],
 ['EXP-26',['923100','923300'],'AP - Expenses (Non-Sales Tax)','211.100'],
];
for(const[rule,codes,vendor,debit]of linePaymentCases)test('Fully Paid Expense payment groups only matching lines per invoice/account: '+rule,async()=>{
 const f=fixture({vendor,amount:0});
 f.line('first',codes[0],10.005);f.line('second',codes[0],10.005);
 for(const code of codes.slice(1))f.line('line-'+code,code,-3.25);
 f.line('unrelated','241.600',500);
 const result=await f.evaluate(rule,PAYMENT),actual=postings(result);
 assert.equal(result.results.length,codes.length);assert.equal(actual.length,codes.length);
 assert.deepEqual(actual.map(p=>Number(p.amount)).sort((a,b)=>a-b),[20.02,...codes.slice(1).map(()=>-3.25)].sort((a,b)=>a-b));
 assert(actual.every(p=>p.debitAccount.number===debit&&p.creditAccount.number==='112.100'));
 assert.equal(new Set(result.results.map(r=>r.entryKey)).size,codes.length);
 const grouped=actual.find(p=>Number(p.amount)===20.02);assert.deepEqual([...grouped.sourceRecordIds].sort(),['first','second']);
 assert.equal(result.data.entryDate,'2026-06-03');
 f.invoice.fields[I.status]={name:'Partially Paid'};assert.equal(postings(await f.evaluate(rule,PAYMENT)).length,0);
 f.invoice.fields[I.status]={name:'Fully Paid'};f.payment.fields[P.sent]=false;assert.equal(postings(await f.evaluate(rule,PAYMENT)).length,0);
});

test('Expense settlement clears the actual AP cents from individually posted fractional lines',async()=>{
 for(const scenario of [
  {amounts:[10.005,10.005,-1.004],posted:[10.01,10.01,-1.00],totalCents:1902},
  {amounts:[-10.005,-10.005,1.004],posted:[-10.01,-10.01,1.00],totalCents:-1902},
 ]){
  const f=fixture({vendor:'AP - Staff',amount:0}),accrued=[];
  for(const[index,amount]of scenario.amounts.entries()){
   const line=f.line('fractional-'+index,'005.002',amount);
   accrued.push(...postings(await f.evaluate('EXP-06',line.id)));
  }
  assert.deepEqual(accrued.map(posting=>Number(posting.amount)),scenario.posted);
  assert(accrued.every(posting=>posting.debitAccount.number==='005.002'&&posting.creditAccount.number==='211.100'));
  const creditedCents=accrued.reduce((sum,posting)=>sum+Math.round(Number(posting.amount)*100),0);
  assert.equal(creditedCents,scenario.totalCents);
  const settled=postings(await f.evaluate('EXP-19',PAYMENT));
  assert.deepEqual(settled.map(pair),[['211.100','112.100',scenario.totalCents/100]]);
  assert.equal(Math.round(Number(settled[0].amount)*100),creditedCents);
  assert.deepEqual(settled[0].sourceRecordIds,['fractional-0','fractional-1','fractional-2']);
 }
});

test('payment-root Expense payload keeps Payment ownership and Payment Date',async()=>{
 const f=fixture();const rule=CATEGORIES.find(c=>c.code==='EXP-14');
 const event=await createCategoryEvaluator(f.client)(rule,f.payment);
 assert.equal(event.paymentRecordId,PAYMENT);assert.equal(event.source.tableId,T.payments);assert.equal(event.source.recordId,PAYMENT);
 assert.equal(event.entryDate,'2026-06-03');assert.equal(event.invoiceRecordId,undefined);
 assert.equal(event.categories[0].postings[0].invoiceRecordId,INVOICE);
});

test('prepaid use-up reads its recorded amount and the linked invoice expense account',async()=>{
 const f=fixture({vendor:'AP - Assets',account:'008.001'});f.invoice.fields[I.prepaid]=true;
 const log=f.put(T.prepay,PREPAY,{[F.PREPAY_FIELDS.amount]:-15.50,[F.PREPAY_FIELDS.date]:'2026-05-09',[F.PREPAY_FIELDS.invoices]:links(INVOICE),[F.PREPAY_FIELDS.name]:'Synthetic Prepay Log'},'Synthetic Prepay Log');
 const result=await f.evaluate('EXP-04',PREPAY);assert.deepEqual(postings(result).map(pair),[['008.001','135.000',-15.50]]);
 assert.equal(result.data.entryDate,'2026-05-09');assert(result.results.some(r=>String(r.notes).includes('Synthetic Prepay Log')));
 log.fields[F.PREPAY_FIELDS.cancelled]=true;assert.equal(postings(await f.evaluate('EXP-04',PREPAY)).length,0);
});

test('depreciation preserves the signed recorded amount and existing destination accounts',async()=>{
 const f=fixture();f.put(T.depreciation,DEPRECIATION,{[F.DEPRECIATION_FIELDS.amount]:-20.25,[F.DEPRECIATION_FIELDS.date]:'2026-05-10',[F.DEPRECIATION_FIELDS.assets]:[{id:'asset',name:'Synthetic Asset'}]});
 const result=await f.evaluate('EXP-10',DEPRECIATION);assert.deepEqual(postings(result).map(pair),[['009.101','161.000',-20.25]]);
 assert.equal(result.data.entryDate,'2026-05-10');assert(result.results.some(r=>String(r.notes).includes('Synthetic Asset')));
});


test('no-vendor-bill card purchases skip both invoice and AP-settlement counterparts',async()=>{
 for(const [account,invoiceRule,paymentRule]of [['006.002','EXP-01','EXP-14'],['007.002','EXP-11','EXP-27']]){
  const f=fixture({account,bank:'231.100'});f.invoice.fields[I.noVendorBill]=true;
  assert.equal((await f.evaluate(invoiceRule,INVOICE)).results.length,0);
  assert.equal((await f.evaluate(paymentRule,PAYMENT)).results.length,0);
  assert.equal((await f.evaluate('EXP-02',PAYMENT)).results.length,1);
  f.invoice.fields[I.noVendorBill]=false;
  assert.equal((await f.evaluate(invoiceRule,INVOICE)).results.length,1);
  assert.equal((await f.evaluate(paymentRule,PAYMENT)).results.length,1);
  assert.equal((await f.evaluate('EXP-02',PAYMENT)).results.length,0);
 }
});
