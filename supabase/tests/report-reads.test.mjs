import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import postgres from "postgres";

const databaseUrl = process.env.REPORT_TEST_DATABASE_URL;
if (!databaseUrl || !["127.0.0.1", "localhost"].includes(new URL(databaseUrl).hostname)) {
  throw new Error("Run check-report-reads.sh against its disposable local database.");
}
const sql = postgres(databaseUrl, { prepare: false, max: 2, connect_timeout: 5, onnotice: () => {} });
const postings = [];

// Synthetic posted journals across two years, plus one draft that every report must ignore.
before(async () => {
  const accounts = (await sql`select code from public.accounts where active and is_postable order by code limit 10`).map(row => row.code);
  assert.ok(accounts.length >= 4, "fixture needs postable accounts");
  let seed = 11;
  const next = () => (seed = (seed * 48271) % 2147483647);
  for (let index = 0; index < 60; index++) {
    const date = new Date(Date.UTC(2025, 0, 3) + index * 86400000 * 11).toISOString().slice(0, 10);
    const debit = accounts[next() % accounts.length];
    let credit = accounts[next() % accounts.length];
    if (credit === debit) credit = accounts[(accounts.indexOf(debit) + 1) % accounts.length];
    const cents = (next() % 900000) + [1, 10, 99][index % 3];
    await post(date, debit, credit, cents, index !== 59);
    if (index !== 59) postings.push({ date, debit, credit, cents });
  }
});
after(() => sql.end());

async function post(date, debit, credit, cents, posted) {
  const amount = (cents / 100).toFixed(2);
  const [entry] = await sql`insert into public.journal_entries (entry_date, description) values (${date}, 'Report read check') returning id`;
  await sql`insert into public.journal_lines (entry_id, line_no, account_code, debit, credit) values (${entry.id}, 1, ${debit}, ${amount}, 0), (${entry.id}, 2, ${credit}, 0, ${amount})`;
  if (posted) await sql`update public.journal_entries set status = 'posted' where id = ${entry.id}`;
}

const batch = (asOf, from, db = sql) => db`select period_index, accounts from public.get_trial_balances(${asOf}::date[], ${from}::date[])`;
const single = async (asOf, from) => (await sql`
  select coalesce(jsonb_agg(to_jsonb(tb) order by tb.account_number), '[]'::jsonb) as accounts from public.get_trial_balance(${asOf}::date, ${from}::date) tb
`)[0].accounts;
const toCents = value => Math.round(Number(value) * 100);

test("each batched trial balance equals a single get_trial_balance call, in request order", async () => {
  const asOf = ["2025-01-31", "2025-12-31", "2026-02-28", "2026-03-31", "2024-12-31", "2025-12-31", "2026-11-04"];
  const from = ["2025-01-01", null, "2026-02-01", "2026-01-01", null, "2025-07-01", null];
  const rows = await batch(asOf, from);
  assert.deepEqual(rows.map(row => row.period_index), [1, 2, 3, 4, 5, 6, 7]);
  for (const [index, row] of rows.entries()) assert.deepEqual(row.accounts, await single(asOf[index], from[index]), `${from[index]}..${asOf[index]}`);
});

test("batched sums match the posted journal lines independently and exclude drafts", async () => {
  const requests = [["2025-06-30", null], ["2025-12-31", "2025-07-01"], ["2026-11-04", null]];
  const rows = await batch(requests.map(item => item[0]), requests.map(item => item[1]));
  for (const [index, [asOf, from]] of requests.entries()) {
    const expected = new Map();
    for (const posting of postings.filter(item => item.date <= asOf && (!from || item.date >= from))) {
      expected.set(posting.debit, { debit: (expected.get(posting.debit)?.debit ?? 0) + posting.cents, credit: expected.get(posting.debit)?.credit ?? 0 });
      expected.set(posting.credit, { debit: expected.get(posting.credit)?.debit ?? 0, credit: (expected.get(posting.credit)?.credit ?? 0) + posting.cents });
    }
    let debits = 0, credits = 0;
    for (const account of rows[index].accounts) {
      const want = expected.get(account.account_number) ?? { debit: 0, credit: 0 };
      assert.equal(toCents(account.total_debit), want.debit, `${account.account_number} debit to ${asOf}`);
      assert.equal(toCents(account.total_credit), want.credit, `${account.account_number} credit to ${asOf}`);
      debits += toCents(account.total_debit);
      credits += toCents(account.total_credit);
    }
    assert.equal(debits, credits, "every period balances");
  }
  const accountCount = Number((await sql`select count(*) from public.accounts`)[0].count);
  assert.ok(rows.every(row => row.accounts.length === accountCount), "every account appears in every period, including zero accounts");
});

test("invalid requests fail clearly and empty requests return nothing", async () => {
  const invalid = async (asOf, from, message) => assert.rejects(() => batch(asOf, from), error => error.code === "22023" && message.test(error.message));
  await invalid(["2026-01-31"], [], /same length/);
  await invalid([null], [null], /as-of date/);
  await invalid(Array(101).fill("2026-01-31"), Array(101).fill(null), /At most 100/);
  assert.equal((await batch([], [])).length, 0);
});

test("only signed-in users may call it, and it runs under the caller's row-level security", async () => {
  // Each check runs in a rolled-back transaction so role switches and test grants never persist.
  const asRole = async (role, setup, check) => {
    await sql.begin(async tx => {
      for (const statement of setup) await tx.unsafe(statement);
      await tx.unsafe(`set local role ${role}`);
      await check(tx);
      throw new Error("rollback");
    }).catch(error => { if (error.message !== "rollback") throw error; });
  };
  await asRole("anon", [], async tx => assert.rejects(() => batch(["2026-01-31"], [null], tx), error => error.code === "42501"));
  const grants = ["grant usage on schema public to authenticated", "grant select on public.accounts, public.journal_entries, public.journal_lines to authenticated"];
  await asRole("authenticated", grants, async tx => {
    const [row] = await batch(["2026-11-04"], [null], tx);
    assert.deepEqual(row.accounts, [], "without an RLS policy the caller sees no rows: the function does not bypass RLS");
  });
  const policies = ["create policy report_test_accounts on public.accounts for select to authenticated using (true)", "create policy report_test_entries on public.journal_entries for select to authenticated using (true)", "create policy report_test_lines on public.journal_lines for select to authenticated using (true)"];
  const expected = await single("2026-11-04", null);
  await asRole("authenticated", [...grants, ...policies], async tx => {
    const [row] = await batch(["2026-11-04"], [null], tx);
    assert.deepEqual(row.accounts, expected);
  });
  const [{ definer }] = await sql`select prosecdef as definer from pg_proc where proname = 'get_trial_balances'`;
  assert.equal(definer, false);
});
