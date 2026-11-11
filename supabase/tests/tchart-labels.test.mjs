import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import fs from 'node:fs';
import postgres from 'postgres';

const url=process.env.LEDGER_TEST_DATABASE_URL;
if(!url||!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Use the disposable ledger test runner.');
const sql=postgres(url,{prepare:false,max:1,onnotice(){}});
after(()=>sql.end());
const migration=fs.readFileSync(new URL('../migrations/20261111220555_preserve_raw_tchart_account_labels.sql',import.meta.url),'utf8');
const payload=/jsonb_to_recordset\('(.+)'::jsonb\)/.exec(migration)?.[1];
assert(payload,'Migration must contain the exact workbook label pairs.');
const labels=JSON.parse(payload.replaceAll("''", "'"));

test('the T-Chart view preserves all 64 current raw account labels, including new and alternative accounts',async()=>{
 const rows=await sql`select rule_code,debit_accounts,credit_accounts from public.v_t_chart`;
 const byCode=new Map(rows.map(row=>[row.rule_code,row]));
 assert.equal(labels.length,67);
 const currentMigration=fs.readFileSync(new URL('../migrations/20261111225159_realign_invoice_entry_categories.sql',import.meta.url),'utf8');
 const current=JSON.parse(/from jsonb_to_recordset\('(.+)'::jsonb\)/.exec(currentMigration)[1].replaceAll("''","'"));
 const finalMigration=fs.readFileSync(new URL('../migrations/20261111231329_finalize_expense_invoice_rules.sql',import.meta.url),'utf8');
 const final=JSON.parse(/from jsonb_to_recordset\('(.+)'::jsonb\)/.exec(finalMigration)[1].replaceAll("''","'"));
 for(const oldLabel of labels.filter(r=>!['EXP-08','INV-02','INV-11'].includes(r.rule_code))){
  const label=final.find(r=>r.rule_code===oldLabel.rule_code)??current.find(r=>r.rule_code===oldLabel.rule_code)??oldLabel;
  const actual=byCode.get(label.rule_code);assert(actual);
  assert.equal(actual.debit_accounts,label.debit_label,label.rule_code+' debit');
  assert.equal(actual.credit_accounts,label.credit_label,label.rule_code+' credit');
 }
 for(let n=12;n<=18;n++){
  const rule=byCode.get('INV-'+n);assert(rule.debit_accounts.trim());assert(rule.credit_accounts.trim());
 }
 assert.equal(byCode.get('INV-09').credit_accounts,'COGS (004.010), or the original expense account for expense credits');
 assert(byCode.get('PAY-14').debit_accounts.includes('\n'));
 const [view]=await sql`select reloptions from pg_catalog.pg_class where oid='public.v_t_chart'::regclass`;
 assert(view.reloptions.includes('security_invoker=true'));
 const legacy=await sql`select rule_code from public.ledger_rules where rule_code='INV-01'`;
 assert.equal(legacy.length,0);
});

test('refreshing raw labels preserves account associations, enabled switches, conformance and journal money',async()=>{
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
 await sql.unsafe(migration.slice(migration.indexOf('update public.ledger_rules r')));
 assert.deepEqual(await snapshot(),before);
 const [row]=await sql`select debit_accounts from public.v_t_chart where rule_code='INV-12'`;
 assert.equal(row.debit_accounts,labels.find(rule=>rule.rule_code==='INV-12').debit_label);
});
