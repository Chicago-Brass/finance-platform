import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import fs from 'node:fs';
import postgres from 'postgres';

const url=process.env.LEDGER_TEST_DATABASE_URL;
if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Use the disposable ledger test runner.');
const sql=postgres(url,{prepare:false,max:1,onnotice(){}});
after(()=>sql.end());
const groupedMigration=fs.readFileSync(new URL('../migrations/20261117225315_align_grouped_tchart_catalog.sql',import.meta.url),'utf8');
const grouped=JSON.parse(/\$grouped\$(.*?)\$grouped\$/s.exec(groupedMigration)[1]);
test('the T-Chart view matches all 50 retained grouped rules and their exact account labels',async()=>{
 const rows=await sql`select rule_code,debit_accounts,credit_accounts from public.v_t_chart`;
 const byCode=new Map(rows.map(row=>[row.rule_code,row]));assert.equal(grouped.length,50);
 for(const label of grouped){const actual=byCode.get(label.rule_code);assert(actual,label.rule_code);assert.equal(actual.debit_accounts,label.debit_label,label.rule_code+' debit');assert.equal(actual.credit_accounts,label.credit_label,label.rule_code+' credit');}
 for(const code of ['EXP-12','EXP-22','EXP-24','EXP-25','INV-09'])assert(!byCode.has(code),'Black archive rule '+code+' must stay out of the catalog.');
 const [view]=await sql`select reloptions from pg_catalog.pg_class where oid='public.v_t_chart'::regclass`;assert(view.reloptions.includes('security_invoker=true'));
});

test('refreshing grouped labels preserves account associations, enabled switches, conformance and journal money',async()=>{
 await sql.unsafe(groupedMigration);
 const snapshot=async()=>({
  rules:await sql`select to_jsonb(r)-array['debit_label','credit_label','updated_at'] as metadata from public.ledger_rules r order by rule_code`,
  associations:await sql`select * from public.ledger_rule_lines order by id`,
  selectors:await sql`select * from public.account_selector_members order by selector,account_code`,
  journals:await sql`select * from public.journal_entries order by id`,
  lines:await sql`select * from public.journal_lines order by id`,
  conformance:await sql`select * from public.v_rule_conformance order by entry_id,line_no`,
 });
 const before=await snapshot();
 await sql`update public.ledger_rules set debit_label='Stale display label' where rule_code='INV-12'`;
 await sql.unsafe(groupedMigration);
 assert.deepEqual(await snapshot(),before);
 const [row]=await sql`select debit_accounts from public.v_t_chart where rule_code='INV-12'`;
 assert.equal(row.debit_accounts,grouped.find(rule=>rule.rule_code==='INV-12').debit_label);
});
