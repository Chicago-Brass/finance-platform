import { SyncBusyError } from "./run-lock.ts";
import type { Sql, TransactionSql } from "npm:postgres@3.4.9";
import { postAndSync } from "../ledger-payment/service.ts";
import type { LedgerPaymentEvent } from "../ledger-payment/ledger.ts";
import type { LedgerReference, LedgerStore, RunJob, RunState, RunStore } from "./types.ts";
import { RetryableError } from "./retry.ts";
import { syncLedgerLinks } from "../_shared/ledger-links.ts";

const transientCodes = new Set(["40001", "40P01", "57014", "57P01", "57P02", "57P03", "CONNECTION_CLOSED", "CONNECTION_ENDED", "CONNECT_TIMEOUT"]);
async function service<T>(sql: Sql, operation: (tx: TransactionSql) => Promise<T>): Promise<T> {
  return sql.begin(async tx => { await tx`set local role service_role`; await tx`set local statement_timeout='10s'`; return operation(tx); }) as Promise<T>;
}

export class DatabaseRunStore implements RunStore {
  private sql: Sql;
  constructor(sql: Sql) { this.sql = sql; }
  async claim(runKey: string, initial: RunState): Promise<RunJob | null> {
    return service(this.sql, async tx => {
      const [lock] = await tx<{acquired:boolean}[]>`select pg_catalog.pg_try_advisory_xact_lock(pg_catalog.hashtextextended('ledger-sync:global',0)) as acquired`;
      if(!lock.acquired) return null;
      const [unfinished] = await tx<{run_key:string}[]>`select run_key from public.ledger_daily_runs where (state->>'done'='false' or locked_until>now()) and run_key<>${runKey} order by created_at limit 1`;
      if(unfinished) throw new SyncBusyError(unfinished.run_key);
      await tx`insert into public.ledger_daily_runs (run_key, state) values (${runKey}, ${tx.json(initial)}) on conflict (run_key) do nothing`;
      const token = crypto.randomUUID();
      const [row] = await tx<{ id: string; state: RunState }[]>`update public.ledger_daily_runs set lease_token=${token}::uuid,
        locked_until=now()+interval '3 minutes', updated_at=now()
        where run_key=${runKey} and (locked_until is null or locked_until<now()) returning id::text, state`;
      if (!row) return null;
      if (row.state.dryRun !== initial.dryRun || JSON.stringify(row.state.categoryIds) !== JSON.stringify(initial.categoryIds)) throw new Error("Run key already belongs to a different category scope or posting mode.");
      return { ...row, leaseToken: token };
    });
  }
  async save(job: RunJob): Promise<void> { await this.persist(job, false); }
  async release(job: RunJob): Promise<void> { await this.persist(job, true); }
  private async persist(job: RunJob, release: boolean): Promise<void> {
    await service(this.sql, async tx => {
      const rows = await tx`update public.ledger_daily_runs set state=${tx.json(job.state)},
        lease_token=case when ${release} then null else lease_token end,
        locked_until=case when ${release} then null else now()+interval '3 minutes' end, updated_at=now()
        where id=${job.id}::uuid and lease_token=${job.leaseToken}::uuid returning id`;
      if (!rows.length) throw new Error("Daily run lease was lost.");
    });
  }
}

export class DatabaseLedgerStore implements LedgerStore {
  private sources = new Map<string, { references: LedgerReference[]; reversed: boolean }>();
  private sql: Sql;
  private token: string;
  private fetcher: typeof fetch;
  private deadline: number;
  constructor(sql: Sql, token: string, fetcher: typeof fetch = fetch, deadline = Date.now() + 90_000) {
    this.sql = sql; this.token = token; this.fetcher = fetcher; this.deadline = deadline;
  }
  async prepareSources(tableId: string, recordIds: string[]): Promise<void> {
    this.sources.clear();
    for (const id of recordIds) this.sources.set(`${tableId}/${id}`, { references: [], reversed: false });
    const rows = await service(this.sql, tx => tx<(LedgerReference & { source_record_id: string; reversed: boolean })[]>`
      select o.rule_code as rule, o.source_entry_key as key, to_char(o.posted_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as datetime, o.id::text, o.source_record_id,
        exists(select 1 from public.journal_entries r where r.reverses_entry_id=o.id and r.status='posted') as reversed
      from public.journal_entries o where o.source_system='airtable' and o.source_table=${tableId}
        and o.source_record_id=any(${recordIds}::text[]) and o.status='posted' and o.reverses_entry_id is null`);
    for (const row of rows) {
      const source = this.sources.get(`${tableId}/${row.source_record_id}`)!;
      source.references.push({ rule: row.rule, key: row.key, datetime: row.datetime, id: row.id });
      source.reversed ||= row.reversed;
    }
  }
  async findCategory(tableId: string, recordId: string, rule: string): Promise<LedgerReference[]> {
    const source = this.sources.get(`${tableId}/${recordId}`);
    if (!source) throw new Error("Source was not included in the bulk ledger check.");
    return source.references.filter(reference => reference.rule === rule);
  }
  async syncLinks(tableId: string, recordId: string): Promise<LedgerReference[]> {
    return (await syncLedgerLinks(this.sql, { tableId, recordId }, this.token, this.fetcher, this.deadline)).postings;
  }
  async hasReversals(tableId: string, recordId: string): Promise<boolean> {
    const source = this.sources.get(`${tableId}/${recordId}`);
    if (!source) throw new Error("Source was not included in the bulk ledger check.");
    return source.reversed;
  }
  async post(event: LedgerPaymentEvent) {
    try { return await postAndSync(this.sql, event, this.token, this.fetcher, { allowAdditionalCategories: true, deadline: this.deadline }); }
    catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (transientCodes.has(code) || code.startsWith("08")) throw new RetryableError("Transient ledger connection/transaction failure.");
      throw error;
    }
  }
}
