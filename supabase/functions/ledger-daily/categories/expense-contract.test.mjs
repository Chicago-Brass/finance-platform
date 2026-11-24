import test from 'node:test';
import assert from 'node:assert/strict';
import {expenseWorkerFields as F,paymentWorkerFields as PF} from '../definitions.ts';
import {createCategories} from './expenses.js';
import {OPERATING_EXPENSE_ACCOUNTS,OPERATING_EXPENSE_ACCOUNT_MAPPING} from '../rules/expense-accounts.ts';
import {createCategoryEvaluator,sourceFields} from './index.ts';
import {CATEGORIES} from '../queries.ts';
import {initialState,runLedgerSync} from '../runner.ts';
import {postedKey} from '../../_shared/ledger-links.ts';

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
  [I.type]:{name:'AP'},[I.vendorType]:{name:vendor},[I.amount]:-1000,[I.paymentProportion]:1,[I.date]:'2026-05-01',
  [I.accounts]:links(accountId(account)),[I.lines]:[],[I.payments]:links(PAYMENT),[I.branch]:{name:'Chicago'},
  [I.employeeBranch]:['Milwaukee'],[I.prepaid]:false,[I.status]:{name:'Fully Paid'},
  [I.vendors]:links('vendor-a','vendor-b'),[I.clients]:links('client'),[I.staff]:links('staff'),
  [I.transactions]:links('transaction'),[I.purchaseOrders]:links('po'),[I.states]:[{id:'state',name:'Illinois'}],
 },'Synthetic Invoice');
 const payment=put(T.payments,PAYMENT,{
  [P.sent]:true,[P.method]:{name:"Credit Card"},[P.recordType]:{name:'Regular Payment'},[P.amount]:amount,[P.date]:'2026-06-03',[P.invoices]:links(INVOICE),[P.accounts]:links(accountId(bank)),
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
test('AP Refund invoices recognize the credit once on the invoice source',async()=>{
 const f=fixture({vendor:'AP - Refund'});
 assert.deepEqual(postings(await f.evaluate('EXP-32',INVOICE)).map(pair),[['211.100','004.010',1000]]);
 assert.deepEqual(postings(await f.evaluate('EXP-15',INVOICE)),[]);
 f.invoice.fields[I.amount]=1000;
 assert.deepEqual(postings(await f.evaluate('EXP-32',INVOICE)),[]);
});
test('sales tax payment posts only the matching allocation when Sent',async()=>{
 const f=fixture({vendor:'AP - Expenses (Sales Tax)',account:'212.200',amount:100});
 f.invoice.fields[I.amount]=60;
 f.invoice.fields[I.paymentProportion]=0.6;
 const other=f.put(T.invoices,'other',{[I.type]:{name:'AP'},[I.vendorType]:{name:'AP - Product'},[I.paymentProportion]:0.4});
 f.payment.fields[P.invoices].push(...links(other.id));
 assert.deepEqual(postings(await f.evaluate('EXP-34',PAYMENT)).map(pair),[['211.100','112.100',60]]);
 f.payment.fields[P.sent]=false;
 assert.deepEqual(postings(await f.evaluate('EXP-34',PAYMENT)),[]);
});
test('sales tax invoices debit the single linked state payable account',async()=>{
 for(const account of ['212.100','212.200','212.300']){
  const f=fixture({vendor:'AP - Expenses (Sales Tax)',account});
  f.invoice.fields[I.amount]=60;
  assert.deepEqual(postings(await f.evaluate('EXP-33',INVOICE)).map(pair),[[account,'211.100',60]]);
  assert.deepEqual(postings(await f.evaluate('EXP-01',INVOICE)),[]);
 }
 const f=fixture({vendor:'AP - Expenses (Sales Tax)',account:'007.006'});
 await assert.rejects(f.evaluate('EXP-33',INVOICE),/must link an Illinois/);
 await assert.rejects(f.evaluate('EXP-34',PAYMENT),/must link an Illinois/);
 f.invoice.fields[I.accounts]=links(f.accountId('212.100'),f.accountId('212.200'));
 await assert.rejects(f.evaluate('EXP-33',INVOICE),/must identify one account/);
});
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
test('operating invoice and settlement use the same reviewed operating-account allowlist',async()=>{
 assert.equal(OPERATING_EXPENSE_ACCOUNTS.length,38);
 assert.equal(new Set(OPERATING_EXPENSE_ACCOUNTS).size,38);
 for(const account of OPERATING_EXPENSE_ACCOUNTS){
  const f=fixture({account,amount:-125.25});
  assert.deepEqual(postings(await f.evaluate('EXP-01',INVOICE)).map(pair),[[OPERATING_EXPENSE_ACCOUNT_MAPPING[account]??account,'211.100',-1000]],account);
  assert.deepEqual(postings(await f.evaluate('EXP-14',PAYMENT)).map(pair),[['211.100','112.100',-125.25]],account);
 }
 const q={field:(_t,f)=>`{${f}}`,eq:(_t,f,v)=>`{${f}}=${JSON.stringify(v)}`,includes:(_t,f,v)=>`FIND(${JSON.stringify(v)},{${f}})>0`};
 for(const code of ['EXP-01','EXP-14']){
  const rule=CATEGORIES.find(c=>c.code===code),formula=(rule.related?.filter??rule.filter)(q);
  assert.equal(rule.status,'implemented');
  for(const account of OPERATING_EXPENSE_ACCOUNTS)assert(formula.includes(JSON.stringify(account)),account);
  assert(!formula.includes('Operating Expense Account Triggers'),'The checkbox is not a runtime dependency.');
 }
});

test('dedicated and unapproved accounts cannot post through either operating rule',async()=>{
 for(const account of ['004.010','005.001','005.002','005.003','005.005','005.006','005.101','005.102','005.103','005.201','007.002','007.005','009.101','923100','923300','999999']){
  const f=fixture({account});
  assert.equal(postings(await f.evaluate('EXP-01',INVOICE)).length,0,account);
  assert.equal(postings(await f.evaluate('EXP-14',PAYMENT)).length,0,account);
 }
});

const paymentCases=[
 ['EXP-14','006.002','AP - Expenses (Non-Sales Tax)','112.100','211.100','112.100'],
 ['EXP-16','004.010','AP - Product','112.200','211.100','112.200'],
 ['EXP-02','008.001','AP - Expenses (Non-Sales Tax)','231.101','008.001','231.101'],
 ['EXP-17','007.011','AP - Assets','0747','211.100','0747'],
 ['EXP-27','007.002','AP - Expenses (Non-Sales Tax)','112.100','211.100','112.100'],
];
for(const[code,account,vendor,bank,debit,credit]of paymentCases)test('Expense payment allocates its full signed amount when every invoice matches: '+code,async()=>{
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
 const f=fixture({account:'008.001',bank:'231.101'});f.invoice.fields[I.status]={name:'Partially Paid'};
 assert.equal(postings(await f.evaluate('EXP-02',PAYMENT)).length,0);
 f.invoice.fields[I.noVendorBill]=true;
 assert.equal(postings(await f.evaluate('EXP-02',PAYMENT)).length,1);
 f.payment.fields[P.accounts]=links(f.accountId('112.100'));
 assert.equal(postings(await f.evaluate('EXP-02',PAYMENT)).length,0);
});

test('ordinary AP settlement cannot open new legacy clearing postings',async()=>{
 const f=fixture({bank:'231.100'});
 const evaluate=createCategoryEvaluator(f.client);
 await assert.rejects(()=>evaluate(CATEGORIES.find(c=>c.code==='EXP-14'),f.payment),/Clearing.*retired/);
});

test('product bank and credit-card payments post through separate categories',async()=>{
 const q={field:(_t,f)=>`{${f}}`,eq:(_t,f,v)=>`{${f}}=${JSON.stringify(v)}`,includes:(_t,f,v)=>`FIND(${JSON.stringify(v)},{${f}})>0`};
 const expense=CATEGORIES.find(c=>c.code==='EXP-16'),card=CATEGORIES.find(c=>c.code==='PAY-08');
 assert.equal(card.status,'implemented');
 assert(expense.filter(q).includes("NOT(OR("));
 assert(expense.filter(q).includes(q.includes(T.payments,P.accounts,'231.102')));
 assert(card.filter(q).includes(q.includes(T.payments,P.accounts,'231.101')));
 for(const bank of ['112.100','0747','112.200','231.101','231.102']){
  const f=fixture({vendor:'AP - Product',bank,amount:125.25}),evaluate=createCategoryEvaluator(f.client);
  const regular=await evaluate(expense,f.payment),creditCard=await evaluate(card,f.payment);
  assert.equal(!!regular,!bank.startsWith('231.'),bank);
  assert.equal(!!creditCard,bank.startsWith('231.'),bank);
  const packet=regular??creditCard,p=packet.categories[0].postings[0];
  assert.deepEqual([p.debitAccount.number,p.creditAccount.number,p.amount],['211.100',bank,'125.25']);
  assert.equal(packet.paymentRecordId,PAYMENT);
 }
});

test('one Payment Amount is emitted once when several matching invoices are linked',async()=>{
 const f=fixture({amount:125});f.invoice.fields[I.paymentProportion]=0.5;const second='rec'+'J'.repeat(14);
 f.put(T.invoices,second,{...f.invoice.fields,[I.amount]:-250},'Second Synthetic Invoice');
 f.payment.fields[P.invoices].push(...links(second));
 const result=await f.evaluate('EXP-14',PAYMENT),actual=postings(result);
 assert.deepEqual(actual.map(pair),[['211.100','112.100',125]]);
 assert.deepEqual([...actual[0].invoiceRecordIds].sort(),[INVOICE,second].sort());
});

test('unrelated owner-first payments do not require a bank before category qualification',async()=>{
 for(const code of ['EXP-16','EXP-02','EXP-18','EXP-19','EXP-20','EXP-21','EXP-26']){
  const f=fixture({vendor:code==='EXP-26'?'AP - Expenses (Non-Sales Tax)':'AP - Staff'});
  f.payment.fields[P.accounts]=[];
  f.line('unrelated-line','999.999',10);
  assert.equal(postings(await f.evaluate(code,PAYMENT)).length,0,code);
 }
 const f=fixture({vendor:'AP - Product'});f.payment.fields[P.accounts]=[];
 await assert.rejects(f.evaluate('EXP-16',PAYMENT),/Payment account must identify one account/);
});

test('offshore payroll keeps the invoice branch and maps a Corporate employee fallback to Overhead',async()=>{
 const f=fixture({vendor:'AP - Staff'});
 const line=f.line('offshore-payroll-line','005.101',25);
 f.invoice.fields[I.employeeBranch]=['Corporate'];
 for(const [invoiceBranch,employeeBranch,expected] of [
  [{name:'Chicago'},['Corporate'],['Chicago']],
  [null,['Corporate'],['Overhead']],
  [null,['Milwaukee'],['Milwaukee']],
  [null,[],[]],
 ]){
  f.invoice.fields[I.branch]=invoiceBranch;
  f.invoice.fields[I.employeeBranch]=employeeBranch;
  assert.deepEqual(postings(await f.evaluate('EXP-07',line.id))[0].branch,expected);
  assert.deepEqual(postings(await f.evaluate('EXP-20',PAYMENT))[0].branch,expected);
 }
});

test('aggregate Expense payments preserve unknown branch attribution',async()=>{
 const f=fixture({amount:125}),second='rec'+'J'.repeat(14);
 f.invoice.fields[I.paymentProportion]=0.5;
 const invoice=f.put(T.invoices,second,{...f.invoice.fields,[I.branch]:null});
 f.payment.fields[P.invoices].push(...links(second));
 const branches=async()=>postings(await f.evaluate('EXP-14',PAYMENT))[0].branch;
 assert.deepEqual(await branches(),[]);
 invoice.fields[I.transactionBranch]=['Chicago','Chicago'];assert.deepEqual(await branches(),['Chicago']);
 invoice.fields[I.branch]={name:'Chicago'};assert.deepEqual(await branches(),['Chicago']);
 invoice.fields[I.branch]={name:'Milwaukee'};assert.deepEqual((await branches()).sort(),['Chicago','Milwaukee']);
 f.payment.fields[P.invoices]=links(INVOICE);f.invoice.fields[I.paymentProportion]=1;f.invoice.fields[I.branch]=null;
 f.invoice.fields[I.transactionBranch]=['Chicago','Milwaukee'];
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

test('W2 offsets employee insurance expense and settles actual net payroll',async()=>{
 const f=fixture({vendor:'AP - Staff',amount:2949.76});
 const withheld=f.line('insurance-withheld','005.004',-384.86);
 assert.deepEqual(postings(await f.evaluate('EXP-06',withheld.id)).map(pair),[['211.100','005.004',384.86]]);
 f.line('wages','005.002',3125);
 f.line('payroll-tax','005.006',209.62);
 const employer=f.line('employer-premium','005.004',100);
 assert.deepEqual(postings(await f.evaluate('EXP-06',withheld.id)).map(pair),[['211.100','005.004',384.86]]);
 assert.equal(postings(await f.evaluate('EXP-06',employer.id)).length,0);
 const settlement=await f.evaluate('EXP-19',PAYMENT);
 assert.deepEqual(postings(settlement).map(pair),[['211.100','112.100',2949.76]]);
 assert.deepEqual(postings(settlement)[0].sourceRecordIds,['insurance-withheld','payroll-tax','wages']);
 f.payment.fields[P.amount]=2950;
 await assert.rejects(()=>f.evaluate('EXP-19',PAYMENT),/does not match the sent payment amount/);
});

test('a matching invoice line cannot silently split its amount across multiple accounts',async()=>{
 const f=fixture({vendor:'AP - Staff'}),line=f.line('ambiguous','005.102',25);
 line.fields[L.accounts].push(...links(f.accountId('005.002')));
 await assert.rejects(()=>f.evaluate('EXP-05',line.id),/multiple|one account|single account|split/i);
 line.fields[L.accounts]=links(f.accountId('005.102'));
 line.fields[L.invoices].push(...links('other-invoice'));
 await assert.rejects(()=>f.evaluate('EXP-05',line.id),/one invoice|single invoice|one matching invoice/i);
});

test('cancelled parents and cancelled or non-Regular payments cannot post Expense entries',async()=>{
 const f=fixture({vendor:'AP - Staff'}),line=f.line('salary','005.002',10);
 f.invoice.fields[I.cancelled]=true;
 assert.equal(postings(await f.evaluate('EXP-06',line.id)).length,0);
 f.invoice.fields[I.cancelled]=false;f.payment.fields[P.cancelled]=true;
 assert.equal(postings(await f.evaluate('EXP-19',PAYMENT)).length,0);
 f.payment.fields[P.cancelled]=false;f.payment.fields[P.recordType]={name:'Return Payment'};
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
 assert.deepEqual(postings(result)[0].branch,['Overhead']);assert.equal(result.data.entryDate,'2026-05-10');assert(result.results.some(r=>String(r.notes).includes('Synthetic Asset')));
});


test('no-vendor-bill card purchases skip both invoice and AP-settlement counterparts',async()=>{
 for(const [account,invoiceRule,paymentRule]of [['006.002','EXP-01','EXP-14'],['007.002','EXP-11','EXP-27']]){
  const f=fixture({account,bank:'231.101'});f.invoice.fields[I.noVendorBill]=true;
  assert.equal((await f.evaluate(invoiceRule,INVOICE)).results.length,0);
  assert.equal((await f.evaluate(paymentRule,PAYMENT)).results.length,0);
  assert.equal((await f.evaluate('EXP-02',PAYMENT)).results.length,1);
  f.invoice.fields[I.noVendorBill]=false;
  assert.equal((await f.evaluate(invoiceRule,INVOICE)).results.length,1);
  assert.equal((await f.evaluate(paymentRule,PAYMENT)).results.length,1);
  assert.equal((await f.evaluate('EXP-02',PAYMENT)).results.length,0);
 }
});

test('dynamic expense accounts use the approved FIN to ledger identities',async()=>{
 for(const [source,ledger] of Object.entries(OPERATING_EXPENSE_ACCOUNT_MAPPING)){
  const card=fixture({account:source,bank:'231.101',amount:12.34});
  card.invoice.fields[I.noVendorBill]=true;
  assert.deepEqual(postings(await card.evaluate('EXP-02',PAYMENT)).map(pair),[[ledger,'231.101',12.34]]);
  const prepaid=fixture({account:source,vendor:'AP - Assets'}),U=F.PREPAY_FIELDS;
  prepaid.invoice.fields[I.prepaid]=true;
  prepaid.put(T.prepay,PREPAY,{[U.invoices]:links(INVOICE),[U.amount]:12.34,[U.date]:'2026-06-03'});
  assert.deepEqual(postings(await prepaid.evaluate('EXP-04',PREPAY)).map(pair),[[ledger,'135.000',12.34]]);
 }
});


test('product invoice restores its signed gross amount before final cent rounding',async()=>{
 for(const [net,discount,total] of [[97,-3,100],[10.0049,-0.0002,10.01],[-97,3,-100],[97,null,97],[3,3,0]]){
  const f=fixture({vendor:'AP - Product'});f.invoice.fields[I.amount]=net;f.invoice.fields[I.discountTotal]=discount;
  const ps=postings(await f.evaluate('EXP-15',INVOICE));
  assert.deepEqual(ps.map(pair),total? [['004.010','211.100',total]]:[]);
 }
 const f=fixture({vendor:'AP - Product'});f.invoice.fields[I.amount]=null;
 await assert.rejects(()=>f.evaluate('EXP-15',INVOICE),/Invoice Amount/);
 f.invoice.fields[I.amount]=97;f.invoice.fields[I.discountTotal]='invalid';
 await assert.rejects(()=>f.evaluate('EXP-15',INVOICE),/Discount Lines Total/);
});
test('a sales-tax bill records gross tax, net cash, and one separate discount',async()=>{
 for(const [net,discount,gross] of [[1421.8476,10.78,1432.63],[4928.3764,37.25,4965.63]]){
  const f=fixture({vendor:'AP - Expenses (Sales Tax)',account:'212.200',amount:net});
  f.client.dateRange={from:'2026-05-01',to:'2026-06-30'};
  f.invoice.fields[I.amount]=net;f.invoice.fields[I.discountTotal]=-discount;
  f.invoice.fields[PF.INVOICE_FIELDS.status]={name:'Fully Paid'};
  const line=f.line('tax-discount','004.011',-discount);line.fields[PF.LINE_FIELDS.type]={name:'Discount'};
  const invoice=postings(await f.evaluate('EXP-33',INVOICE))[0];
  const payment=postings(await f.evaluate('EXP-34',PAYMENT))[0];
  const adjustment=(await createCategoryEvaluator(f.client)(CATEGORIES.find(c=>c.code==='PAY-10'),line)).categories[0].postings[0];
  assert.deepEqual(pair(invoice),['212.200','211.100',gross]);
  assert.deepEqual(pair(payment),['211.100','112.100',Math.round(net*100)/100]);
  assert.deepEqual(pair(adjustment),['211.100','004.011',discount]);
  assert.equal(Math.round(Number(invoice.amount)*100),Math.round(Number(payment.amount)*100)+Math.round(Number(adjustment.amount)*100));
 }
});

test('gross product AP is cleared by the separate bank payment and line-owned discount',async()=>{
 const f=fixture({vendor:'AP - Product',amount:97});f.client.dateRange={from:'2026-05-01',to:'2026-06-30'};
 f.invoice.fields[I.amount]=97;f.invoice.fields[I.discountTotal]=-3;f.invoice.fields[PF.INVOICE_FIELDS.status]={name:'Fully Paid'};
 const line=f.line('discount-line','004.011',-3);line.fields[PF.LINE_FIELDS.type]={name:'Discount'};
 const invoice=postings(await f.evaluate('EXP-15',INVOICE))[0];
 const payment=postings(await f.evaluate('EXP-16',PAYMENT))[0];
 const evaluate=createCategoryEvaluator(f.client),discount=await evaluate(CATEGORIES.find(c=>c.code==='PAY-10'),line);
 assert.deepEqual(pair(invoice),['004.010','211.100',100]);assert.deepEqual(pair(payment),['211.100','112.100',97]);
 const adjustment=discount.categories[0].postings[0];assert.deepEqual(pair(adjustment),['211.100','004.011',3]);
 assert.equal(Number(invoice.amount)-Number(payment.amount)-Number(adjustment.amount),0);
 assert.equal(discount.invoiceLineRecordId,line.id);assert.equal(discount.entryDate,'2026-06-03');
});

test('product bill splits verified freight without changing gross payable', async () => {
 const f = fixture({vendor:'AP - Product'});
 const fields = f.invoice.fields;
 fields[I.amount] = 97;
 fields[I.discountTotal] = -3;
 fields[I.poTotal] = 100;
 fields[I.poFreight] = 8;
 const po = f.put(T.purchaseOrders, 'po', {[F.PURCHASE_ORDER_FIELDS.invoices]:links(INVOICE)});
 const pairs = async () => postings(await f.evaluate('EXP-15', INVOICE)).map(pair);
 assert.deepEqual(await pairs(), [['004.010','211.100',92],['922.000','211.100',8]]);
 po.fields[F.PURCHASE_ORDER_FIELDS.invoices] = links(INVOICE, 'other');
 assert.deepEqual(await pairs(), [['004.010','211.100',100]]);
 fields[I.lineFreight] = 12;
 assert.deepEqual(await pairs(), [['004.010','211.100',88],['922.000','211.100',12]]);
 fields[I.amount] = -97;
 fields[I.discountTotal] = 3;
 fields[I.lineFreight] = -12;
 assert.deepEqual(await pairs(), [['004.010','211.100',-88],['922.000','211.100',-12]]);
 fields[I.lineFreight] = -101;
 await assert.rejects(pairs, /fit within its gross amount/);
});

test('Paychex bills use invoice lines and payments settle only their eligible share', async () => {
 const f = fixture({account:'112.100', amount:623.23});
 f.invoice.fields[I.vendors] = links('recwfao4PfalXpwuK');
 f.invoice.fields[I.amount] = 623.23;
 assert.deepEqual(postings(await f.evaluate('EXP-35', INVOICE)), []);
 assert.deepEqual(postings(await f.evaluate('EXP-36', PAYMENT)), []);
 f.line('workers', '525300', 431.10);
 f.line('tax', '005.006', 192.13);
 assert.deepEqual(postings(await f.evaluate('EXP-35', INVOICE)).map(pair),
  [['525.300','211.100',431.10], ['005.006','211.100',192.13]]);
 f.invoice.fields[I.accounts] = links(f.accountId('525300'));
 assert.deepEqual(postings(await f.evaluate('EXP-01', INVOICE)), []);
 assert.deepEqual(postings(await f.evaluate('EXP-14', PAYMENT)), []);
 assert.deepEqual(postings(await f.evaluate('EXP-36', PAYMENT)).map(pair), [['211.100','112.100',623.23]]);
 const other = 'rec' + 'Y'.repeat(14);
 f.put(T.invoices, other, { ...f.invoice.fields, [I.vendors]: links('different-vendor'),
  [I.accounts]: links(f.accountId('006.002')), [I.lines]: [], [I.paymentProportion]: 0.5 });
 f.invoice.fields[I.paymentProportion] = 0.5;
 f.payment.fields[P.invoices] = links(INVOICE, other);
 f.payment.fields[P.amount] = 1246.46;
 assert.deepEqual(postings(await f.evaluate('EXP-36', PAYMENT)).map(pair), [['211.100','112.100',623.23]]);
 assert.deepEqual(postings(await f.evaluate('EXP-14', PAYMENT)).map(pair), [['211.100','112.100',623.23]]);
 f.payment.fields[P.sent] = false;
 assert.deepEqual(postings(await f.evaluate('EXP-36', PAYMENT)), []);
});

for(const[code,account,vendor,bank,debit,credit]of paymentCases)test('Expense payment allocates only qualifying invoice shares: '+code,async()=>{
 const f=fixture({account,vendor,bank,amount:100});f.invoice.fields[I.prepaid]=true;f.invoice.fields[I.paymentProportion]=0.4;
 if(code==='EXP-02')f.invoice.fields[I.noVendorBill]=true;
 const other='rec'+'Z'.repeat(14);f.put(T.invoices,other,{...f.invoice.fields,[I.vendorType]:{name:'Unrelated'},[I.paymentProportion]:0.6});f.payment.fields[P.invoices].push(...links(other));
 const result=await f.evaluate(code,PAYMENT),actual=postings(result);assert.deepEqual(actual.map(pair),[[debit,credit,40]]);assert.deepEqual(actual[0].invoiceRecordIds,[INVOICE]);
 f.payment.fields[P.amount]=-100;assert.deepEqual(postings(await f.evaluate(code,PAYMENT)).map(pair),[[debit,credit,-40]]);
});
test('operating and bank-fee payment categories conserve one payment across matching filters',async()=>{
 const f=fixture({amount:100}),fee='rec'+'F'.repeat(14);f.invoice.fields[I.paymentProportion]=0.4;
 f.put(T.invoices,fee,{...f.invoice.fields,[I.accounts]:links(f.accountId('007.002')),[I.paymentProportion]:0.6});f.payment.fields[P.invoices].push(...links(fee));
 assert.deepEqual(postings(await f.evaluate('EXP-14',PAYMENT)).map(pair),[['211.100','112.100',40]]);assert.deepEqual(postings(await f.evaluate('EXP-27',PAYMENT)).map(pair),[['211.100','112.100',60]]);
});


test('scheduled sync completes three categories for one invoice without reposting its finished line', async () => {
 const f = fixture({vendor:'AP - Staff'});
 f.invoice.fields[I.date] = '2026-11-18';
 const rules = new Map([['EXP-05','005.102'],['EXP-06','005.002'],['EXP-09','005.201']]);
 const lines = new Map([...rules].map(([rule,account], i) =>
  [rule,f.line('rec'+String(i).repeat(14),account,(i+1)*10)]));
 const marker = (rule, line) => rule+'/'+line.id;
 const posted = new Set([marker('EXP-05',lines.get('EXP-05'))]);
 const events = [];
 Object.assign(f.client,{
  requests:0,async initialize(){},clearRecordCache(){},requireWritebackBudget(){},
  field(_table, field){return '{'+field+'}';},
  eq(table, field, value){return this.field(table,field)+'='+JSON.stringify(value);},
  includes(table, field, value){return 'FIND('+JSON.stringify(value)+','+this.field(table,field)+')>0';},
  async queryIds(table, formula, _offset, maxRecords){
   assert.equal(table,T.lines);
   assert.match(formula,/CREATED_TIME/);
   const ids = [...rules].flatMap(([rule,account]) => {
    const line = lines.get(rule);
    assert(!formula.includes(JSON.stringify(account)) || formula.includes(JSON.stringify(JSON.stringify(postedKey(rule)))));
    return formula.includes(JSON.stringify(account)) && !posted.has(marker(rule,line)) ? [line.id] : [];
   });
   return {ids:maxRecords?ids.slice(0,maxRecords):ids,offset:null};
  },
 });
 const ledger = {
  async prepareSources(){},async hasReversals(){return false;},
  async findCategory(_table,id,rule){return posted.has(rule+'/'+id)?[{rule,id}]:[];},
  async post(event){
   const key=event.categories[0].ruleCode+'/'+event.source.recordId;
   assert(!posted.has(key));
   posted.add(key);events.push(event);
   return {postedCount:1,duplicateCount:0};
  },
 };
 const run = key => runLedgerSync(key,initialState([],false,undefined,
  {from:'2026-11-17',to:'2026-11-18'},'2026-11-17T06:00:00.000Z'),{
  client:f.client,ledger,enabledRuleCodes:new Set(rules.keys()),deadline:Date.now()+120000,
  runs:{async claim(_key,state){return {state};},async save(){},async release(){}},log(){},
 });
 const first = await run('scheduled-first');
 assert.equal(first.stats.posted,2);
 assert.equal(first.stats.errors,0);
 assert.deepEqual([...posted],[...lines].map(([rule,line])=>marker(rule,line)));
 assert.deepEqual(events.map(event=>[event.categories[0].ruleCode,
  ...pair(event.categories[0].postings[0]), event.categories[0].postings[0].invoiceRecordId]),[
  ['EXP-06','005.002','211.100',20,INVOICE],['EXP-09','005.201','211.100',30,INVOICE],
 ]);
 const next = await run('scheduled-next');
 assert.equal(next.stats.posted,0);
 assert.equal(next.stats.errors,0);
 assert.equal(posted.size,3);
});
