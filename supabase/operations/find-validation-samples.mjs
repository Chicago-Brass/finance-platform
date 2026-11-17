// Read-only live sample discovery. Run with Node --env-file pointing to the gitignored credentials.
import fs from 'node:fs/promises';
import {AirtableClient} from '../functions/ledger-daily/airtable.ts';
import {CATEGORIES,candidateFormula,and,or} from '../functions/ledger-daily/queries.ts';
import {CHART} from '../functions/ledger-daily/rules/chart.ts';
import {createCategoryEvaluator,sourceFields} from '../functions/ledger-daily/categories/index.ts';
import {expenseWorkerFields as F,invoiceWorkerFields as IF,FIN_BASE,POSTING_FIELDS} from '../functions/ledger-daily/definitions.ts';
const output=process.argv[2];
if(!output)throw Error('Supply a private output JSON path; optional following arguments are rule codes.');
const token=process.env.AIRTABLE_PAT||process.env.AIRTABLE_API_RW||process.env.AIRTABLE_API;
if(!token)throw Error('Airtable read credentials are missing.');
const reuse=process.argv.includes('--include-prior-tests');
const requested=process.argv.slice(3).filter(x=>x!=='--include-prior-tests'),implemented=CATEGORIES.filter(c=>c.status==='implemented');
const categories=implemented.filter(c=>!requested.length||requested.includes(c.code));
if(requested.some(code=>!categories.some(c=>c.code===code)))throw Error('Only implemented category codes are allowed.');
const range={from:'2020-01-01',to:new Date().toISOString().slice(0,10)},sortFields=new Map(),samples=[];
const fetcher=async(input,init)=>{
 if((init?.method??'GET')!=='GET')throw Error('Sample discovery cannot write.');
 const url=new URL(input);
 const table=url.pathname.split('/').at(-1),sort=sortFields.get(table);
 if(url.pathname.includes('/'+FIN_BASE+'/')&&sort){url.searchParams.set('sort[0][field]',sort);url.searchParams.set('sort[0][direction]','desc');}
 return fetch(url,init);
};
const client=new AirtableClient(token,Date.now()+20*60_000,fetcher,{readOnly:true,maxRequests:2000,dateRange:range});
await client.initialize();
for(const [table,id]of [[F.TABLES.invoices,F.INVOICE_FIELDS.date],[F.TABLES.payments,F.PAYMENT_FIELDS.date],[F.TABLES.lines,'fld2LfqIWWzXFHzZs'],[F.TABLES.prepay,F.PREPAY_FIELDS.date],[F.TABLES.depreciation,F.DEPRECIATION_FIELDS.date],[IF.TABLES.shipping,IF.SHIPPING_FIELDS.date]])sortFields.set(table,client.getField(table,id).name);
// A clean ledger has no available deposits; shipping needs its deposit invoice posted first.
const evaluate=createCategoryEvaluator(client,async()=>0);
for(const category of categories){
 const chart=CHART[category.code],row={rule:category.code,sheet:chart.sheet,row:chart.row,name:chart.name,tableId:category.tableId,filter:candidateFormula(category,client),relatedFilter:category.related?.filter(client),samples:[],errors:[],checked:0,limited:false};
 const start=client.requests,seen=new Set();
 if(reuse){const controls=POSTING_FIELDS[category.tableId];for(const [field,value]of [[controls.reverse,'0'],[controls.reverseDate,'BLANK()'],[controls.postings,'""']])row.filter=row.filter.replaceAll(client.field(category.tableId,field),value);row.requiresMetadataReset=true;}
 const inspect=async ids=>{
  const fresh=ids.filter(id=>!seen.has(id));fresh.forEach(id=>seen.add(id));
  const records=await client.readRecords(category.tableId,fresh,sourceFields(category),false);
  for(const source of records){
   if(row.samples.length>=5||(category.code==='INV-14'&&row.checked>=5))break;row.checked++;
   try{
    const packet=await evaluate(category,source);
    if(packet&&(packet.entryDate<range.from||packet.entryDate>range.to))continue;
    if(!packet){if(category.code==='INV-14'&&row.errors.length<5)row.errors.push({recordId:source.id,message:'Shipment needs a posted deposit prerequisite or has no eligible value.'});continue;}
    const matches=[];
    for(const other of implemented.filter(c=>c.tableId===category.tableId)){
     try{const event=other.code===category.code?packet:await evaluate(other,source);if(event)matches.push({rule:other.code,entries:event.categories});}
     catch(error){matches.push({rule:other.code,error:error.message});}
    }
    row.samples.push({recordId:source.id,name:source.name,packet,matches});
   }catch(error){if(row.errors.length<10)row.errors.push({recordId:source.id,message:error.message});}
  }
 };
 try{
  let offset=null,pages=0;
  do{
   if(category.related&&category.tableId!==F.TABLES.lines){
    const related=category.related,page=await client.queryRecords(related.tableId,related.filter(client),[related.linksFieldId],offset);
    let ids=[...new Set(page.records.flatMap(r=>(r.value(related.linksFieldId)||[]).map(l=>l.id)))];
    if(related.through&&ids.length){const parents=await client.readRecords(related.through.tableId,ids,[related.through.linksFieldId]);ids=[...new Set(parents.flatMap(r=>(r.value(related.through.linksFieldId)||[]).map(l=>l.id)))];}
    for(let i=0;i<ids.length&&row.samples.length<5&&!(category.code==='INV-14'&&row.checked>=5);i+=40){const found=await client.queryIds(category.tableId,and(row.filter,or(...ids.slice(i,i+40).map(id=>`RECORD_ID()=${JSON.stringify(id)}`))));await inspect(found.ids);}
    offset=page.offset;
   }else{const page=await client.queryIds(category.tableId,row.filter,offset);await inspect(page.ids);offset=page.offset;}
   pages++;
  }while(offset&&pages<3&&row.samples.length<5&&!(category.code==='INV-14'&&row.checked>=5));
  row.limited=!!offset&&row.samples.length<5;
 }catch(error){row.errors.push({message:error.message});}
 row.requests=client.requests-start;samples.push(row);await fs.writeFile(output,JSON.stringify({readOnly:true,range,requests:client.requests,rows:samples},null,2));
 console.log(`${row.rule} | ${row.sheet} ${row.row} | ${row.samples.length}/5 samples | ${row.checked} checked | ${row.requests} requests | ${row.errors.length} errors${row.limited?' | bounded search':''}`);
 client.clearRecordCache();
}
