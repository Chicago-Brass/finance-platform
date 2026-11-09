import assert from "node:assert/strict";
import { after, test } from "node:test";
import postgres from "postgres";

const url = process.env.REPORT_TEST_DATABASE_URL;
if (!url || !["127.0.0.1", "localhost"].includes(new URL(url).hostname)) throw new Error("Use the disposable report-read test runner.");
const sql = postgres(url, { prepare: false, max: 1, onnotice() {} });
after(() => sql.end());
const filter = (db, options = {}) => db`select * from public.filter_ledger(
  '2032-01-01','2032-12-31',${options.query ?? ''},${options.account ?? null},${options.offset ?? null},${options.side ?? 'all'},
  ${options.type ?? null},${options.category ?? null},${options.min ?? null},${options.max ?? null},${options.skip ?? 0},${options.take ?? 101})`;

const count = async (db, options = {}) => Number((await db`select public.count_ledger(
  '2032-01-01','2032-12-31',${options.query ?? ''},${options.account ?? null},${options.offset ?? null},${options.side ?? 'all'},
  ${options.type ?? null},${options.category ?? null},${options.min ?? null},${options.max ?? null}) as total`)[0].total);

test("all ledger filters combine before pagination, preserve cents and remain caller-scoped", async () => {
  await sql.begin(async tx => {
    const entries = await tx`insert into public.journal_entries(entry_date,description,rule_code)
      select '2032-01-01','Filtered ledger fixture ' || n,case when n > 110 then 'PAY-08' else 'PAY-09' end
      from generate_series(1,115) n returning id,entry_number,rule_code`;
    for (const [index, entry] of entries.entries()) {
      const amount = index >= 110 ? '123.45' : '1.00';
      await tx`insert into public.journal_lines(entry_id,line_no,account_code,debit,credit) values
        (${entry.id},1,'211.100',${amount},0),(${entry.id},2,'112.100',0,${amount})`;
      await tx`update public.journal_entries set status='posted' where id=${entry.id}`;
    }
    const options = { type: 'liability', category: 'PAY-08', min: '123.45', max: '123.45' };
    const all = await filter(tx, options);
    assert.equal(all.length,5);
    assert.ok(all.every(row => row.account_number==='211.100' && row.debit==='123.45' && row.rule_code==='PAY-08'));
    assert.ok(!(await filter(tx)).some(row => row.line_id===all[0].line_id), 'matches lie beyond the unfiltered first page');
    const pages = [...await filter(tx,{...options,take:2}),...await filter(tx,{...options,skip:2,take:3})];
    assert.deepEqual(pages.map(row=>row.line_id),all.map(row=>row.line_id));
    assert.equal(await count(tx),230,'count covers all pages');
    for(const scope of [options,{...options,offset:'112.100'},{query:'Filtered ledger',type:'asset'},{query:"' OR true --"},{max:0},{side:'credit',category:'PAY-08'},{min:124,max:123}]) {
      assert.equal(await count(tx,scope),(await filter(tx,{...scope,take:501})).length,'count and rows use identical filters');
    }
    const entry = all[0];
    assert.equal(await count(tx,{...options,query:String(entry.entry_number)}),1);
    assert.equal((await filter(tx,{...options,query:String(entry.entry_number)}))[0].entry_id,entry.entry_id, 'journal entry search combines with filters');
    assert.equal((await filter(tx,{...options,query:"' OR true --"})).length,0);
    assert.equal((await filter(tx,{...options,side:'credit'})).length,0);
    assert.equal((await filter(tx,{...options,account:'211.100',offset:'112.100',side:'debit'})).length,5);
    assert.equal((await filter(tx,{type:'asset',category:'PAY-08',min:123.45,max:123.45})).length,5, 'credit magnitudes use the same inclusive limits');
    assert.equal((await filter(tx,{max:0})).length,0, 'zero maximum is an active filter');
    assert.equal((await filter(tx,{min:124,max:123})).length,0);
    await tx`insert into public.app_users(email,role) values ('ledger-filter@example.com','viewer')`;
    await tx`select set_config('request.jwt.claims','{"email":"ledger-filter@example.com"}',true)`;
    await tx.unsafe('set local role authenticated');
    assert.equal((await filter(tx,options)).length,5);
    assert.equal(await count(tx,options),5);
    await tx`select set_config('request.jwt.claims','{"email":"unapproved@example.com"}',true)`;
    assert.equal((await filter(tx,options)).length,0);
    assert.equal(await count(tx,options),0);
    throw new Error('rollback');
  }).catch(error=>{if(error.message!=='rollback')throw error;});
});

test("negative lines retain their account side in ledger reads, counts and trial balances", async () => {
  await sql.begin(async tx => {
    const [entry] = await tx`insert into public.journal_entries(entry_date,description,rule_code)
      values ('2032-03-01','Signed invoice filter fixture','INV-08') returning id`;
    await tx`insert into public.journal_lines(entry_id,line_no,account_code,debit,credit) values
      (${entry.id},1,'211.100',-25.55,0),(${entry.id},2,'131.400',0,-25.55)`;
    await tx`update public.journal_entries set status='posted' where id=${entry.id}`;
    for (const scope of [{side:'debit'},{side:'credit'},{side:'debit',query:'Signed invoice'},{side:'credit',offset:'211.100'}]) {
      const rows = await filter(tx,scope);
      assert.equal(rows.length,1);
      assert.equal(await count(tx,scope),1);
      assert.equal(rows[0].account_number,scope.side==='debit'?'211.100':'131.400');
    }
    const search = await tx`select * from public.search_ledger('2032-01-01','2032-12-31','Signed invoice',null,null,'debit',0,101)`;
    assert.equal(search.length,1);assert.equal(search[0].debit,'-25.55');
    const conformance = await tx`select line_no,side::text,matches_rule from public.v_rule_conformance where entry_id=${entry.id} order by line_no`;
    assert.deepEqual(conformance.map(row=>row.side),['debit','credit']);
    const balances = await tx`select * from public.get_trial_balance('2032-12-31','2032-01-01')`;
    assert.equal(Number(balances.find(row=>row.account_number==='211.100').total_debit),-25.55);
    throw new Error('rollback');
  }).catch(error=>{if(error.message!=='rollback')throw error;});
});

test("ledger filter bounds reject malformed inputs and do not permit anonymous access", async () => {
  for (const options of [{type:'unknown'},{category:"PAY-08' OR true"},{min:-1},{max:'NaN'},{min:'Infinity'},{max:'1.001'},{min:'999999999999999999'},{take:502},{skip:-1}]) {
    await assert.rejects(()=>filter(sql,options),error=>error.code==='22023');
  }
  const [rights] = await sql`select has_function_privilege('anon','public.filter_ledger(date,date,text,text,text,text,text,text,numeric,numeric,bigint,integer)','execute') as anon,
    (select prosecdef from pg_proc where oid='public.filter_ledger(date,date,text,text,text,text,text,text,numeric,numeric,bigint,integer)'::regprocedure) as definer`;
  assert.equal(rights.anon,false);assert.equal(rights.definer,false);
});

test("record counts validate filters and deny anonymous execution",async()=>{
  for(const scope of [{type:'unknown'},{min:-1},{max:'1.001'},{query:'x'.repeat(201)}])await assert.rejects(()=>count(sql,scope),error=>error.code==='22023');
  const [rights]=await sql`select has_function_privilege('anon','public.count_ledger(date,date,text,text,text,text,text,text,numeric,numeric)','execute') as anon,
    (select prosecdef from pg_proc where oid='public.count_ledger(date,date,text,text,text,text,text,text,numeric,numeric)'::regprocedure) as definer`;
  assert.equal(rights.anon,false);assert.equal(rights.definer,false);
});
