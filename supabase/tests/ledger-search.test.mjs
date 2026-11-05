import assert from "node:assert/strict";
import { after, test } from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.REPORT_TEST_DATABASE_URL;
if (!databaseUrl || !["127.0.0.1", "localhost"].includes(new URL(databaseUrl).hostname)) throw new Error("Run check-report-reads.sh against its disposable local database.");
const sql = postgres(databaseUrl, { prepare: false, max: 1, connect_timeout: 5, onnotice: () => {} });
after(() => sql.end());
const search = (db, text, options = {}) => db`
  select * from public.search_ledger('2031-01-01'::date, '2031-12-31'::date, ${text},
    ${options.account ?? null}, ${options.offset ?? null}, ${options.side ?? 'all'}, ${options.skip ?? 0}, ${options.take ?? 101})
`;

test("global ledger search finds late records before paging, preserves literal text and caller RLS", async () => {
  await sql.begin(async tx => {
    const entries = await tx`
      insert into public.journal_entries (entry_date, description, notes)
      select '2031-01-01'::date, 'Ledger search fixture',
        case when n = 120 then 'Global search needle beyond page one'
             when n = 121 then 'Literal 25%_fee' || chr(92) || 'settlement'
             when n = 122 then 'O''Brien, (wire) ; select no'
             else 'Search filler ' || n end
      from generate_series(1,130) n returning id, entry_number, notes
    `;
    for (const entry of entries) {
      await tx`insert into public.journal_lines (entry_id,line_no,account_code,debit,credit) values
        (${entry.id},1,'211.100',1.23,0), (${entry.id},2,'112.100',0,1.23)`;
      await tx`update public.journal_entries set status='posted' where id=${entry.id}`;
    }
    const [draft] = await tx`insert into public.journal_entries (entry_date,description,notes) values ('2031-01-01','Unposted search fixture','Global search needle draft') returning id`;
    await tx`insert into public.journal_lines (entry_id,line_no,account_code,debit,credit) values
      (${draft.id},1,'211.100',1.23,0), (${draft.id},2,'112.100',0,1.23)`;
    const late = entries.find(entry => entry.notes.startsWith('Global search needle'));
    const firstUnfiltered = await tx`select entry_id from public.v_ledger where date='2031-01-01' order by date,entry_number,line_no limit 100`;
    assert.ok(!firstUnfiltered.some(row => row.entry_id === late.id), 'the sought record is beyond the unfiltered first page');
    const found = await search(tx, 'GLOBAL SEARCH NEEDLE');
    assert.equal(found.length, 2); assert.ok(found.every(row => row.entry_id === late.id));
    const original = await tx`select * from public.v_ledger where entry_id=${late.id} order by date,entry_number,line_no`;
    assert.deepEqual([...found], [...original], 'search preserves financial rows and amounts');
    const debit = await search(tx, 'global search needle', { side: 'debit', account: '211.100', offset: '112.100' });
    assert.equal(debit.length, 1); assert.equal(debit[0].debit, '1.23');
    assert.equal((await search(tx, 'global search needle', { side: 'credit', account: '211.100' })).length, 0);
    assert.equal((await search(tx, 'global search needle', { account: '112.200' })).length, 0);
    for (const term of ['%', '_', '\\', "O'Brien", "' or 1=1 --"]) {
      const rows = await search(tx, term);
      assert.equal(rows.length, term === "' or 1=1 --" ? 0 : 2, `literal search for ${term}`);
    }
    assert.ok((await search(tx, String(late.entry_number))).some(row => row.entry_id === late.id), 'entry numbers are searchable');
    assert.equal((await search(tx, '2031-01-01', { take: 501 })).length, 260, 'dates are searchable');
    const all = await tx`select line_id from public.v_ledger where date='2031-01-01' and notes like 'Search filler %' order by date,entry_number,line_no`;
    const paged = [];
    for (let skip = 0; skip < all.length; skip += 100) paged.push(...(await search(tx, 'Search filler', { skip })).slice(0,100));
    assert.deepEqual(paged.map(row => row.line_id), all.map(row => row.line_id), 'matching records paginate without skips or duplicate lookahead rows');

    await tx`insert into public.app_users (email,role) values ('ledger-search@example.com','viewer')`;
    await tx`select set_config('request.jwt.claims', '{"email":"ledger-search@example.com"}', true)`;
    await tx.unsafe('set local role authenticated');
    assert.equal((await search(tx, 'global search needle')).length, 2);
    await tx`select set_config('request.jwt.claims', '{"email":"not-listed@example.com"}', true)`;
    assert.equal((await search(tx, 'global search needle')).length, 0, 'the invoker function cannot bypass the allowlist RLS policies');
    throw new Error('rollback');
  }).catch(error => { if (error.message !== 'rollback') throw error; });
});

test("search rejects invalid request bounds and anonymous execution", async () => {
  for (const [text, options] of [['', {}], ['x'.repeat(201), {}], ['test', { side: 'invalid' }], ['test', { skip: -1 }], ['test', { take: 502 }], ['test', { account: "211.100' OR true" }]]) {
    await assert.rejects(() => search(sql, text, options), error => error.code === '22023');
  }
  await assert.rejects(() => sql`select * from public.search_ledger(null,'2031-12-31','test')`, error => error.code === '22023');
  const [rights] = await sql`select has_function_privilege('anon','public.search_ledger(date,date,text,text,text,text,bigint,integer)','execute') as anon, (select prosecdef from pg_proc where oid='public.search_ledger(date,date,text,text,text,text,bigint,integer)'::regprocedure) as definer`;
  assert.equal(rights.anon, false); assert.equal(rights.definer, false);
});
