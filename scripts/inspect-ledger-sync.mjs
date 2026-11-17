// Read-only live filter benchmark. No database connection and GET-only Airtable credentials.
import fs from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {AirtableClient} from '../supabase/functions/ledger-daily/airtable.ts';
import {inspectCategories} from '../supabase/functions/ledger-daily/inspect.ts';
const args=process.argv.slice(2);
const value=(name,fallback)=>args.find(arg=>arg.startsWith(name+'='))?.slice(name.length+1)??fallback;
const envPath=value('--env-file',process.env.LEDGER_ENV_FILE);
const env=envPath?{...parseEnv(await fs.readFile(envPath,'utf8')),...process.env}:process.env;
const token=env.AIRTABLE_API??env.AIRTABLE_PAT;
if(!token)throw new Error('Set AIRTABLE_API or AIRTABLE_PAT using the environment or --env-file.');
const output=value('--output','/tmp/ledger-sync-inspection.json');
const maxPages=Number(value('--max-pages','2')),samples=Number(value('--samples','1'));
if(!(maxPages>0)||!Number.isInteger(samples)||samples<0||samples>5)throw new Error('Use positive --max-pages and --samples from 0 to 5.');
const fetchReadOnly=(url,options)=>{if((options?.method??'GET')!=='GET')throw new Error('Inspection permits GET requests only.');return fetch(url,options);};
const client=new AirtableClient(token,Date.now()+30*60_000,fetchReadOnly,{readOnly:true,maxRequests:3000});
const start=performance.now();
const result=await inspectCategories(client,{maxPages,samples,categoryCodes:value('--categories','').split(',').filter(Boolean),onCategory:row=>{
 console.log(`${row.id} | ${row.candidates}${row.complete?'':'+'} candidates | ${row.requests} requests | ${(row.milliseconds/1000).toFixed(2)}s | ${row.errors.length} issues`);
}});
result.seconds=Number(((performance.now()-start)/1000).toFixed(2));result.options={maxPages,samples};
await fs.writeFile(output,JSON.stringify(result,null,2),{mode:0o600});
console.log(JSON.stringify({seconds:result.seconds,requests:result.airtableRequests,categories:result.categories.length,output,writes:0}));
