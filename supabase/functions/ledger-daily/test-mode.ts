import { inSyncDateRange, syncDateRange } from "./scope.ts";
// Read-only webhook preview. Progress stays in the response, never in the database.
import { AirtableClient } from "./airtable.ts";
import { createCategoryEvaluator } from "./categories/index.ts";
import { paymentSentFields } from "./definitions.ts";
import { initialState, runLedgerSync } from "./runner.ts";
import type { LedgerPaymentEvent } from "../ledger-payment/ledger.ts";
import type { CategoryDefinition, LedgerStore, RunState, RunStore, SyncSource, SyncDateRange } from "./types.ts";

export interface TestOptions { categoryCodes: string[]; maxRecords: number; cursor?: unknown; source?: SyncSource; dateRange?: SyncDateRange }
export interface TestRecord {
  table: string;
  tableId: string;
  recordId: string;
  rule: string;
  category: string;
  entryKey: string;
  date: string;
  debitAccount: string;
  creditAccount: string;
  amount: string;
}

export async function testLedgerSync(client: AirtableClient, options: TestOptions, evaluate = createCategoryEvaluator(client)) {
  const state = testState(options.cursor, options.categoryCodes, options.source, options.dateRange);
  const records: TestRecord[] = [];
  // The shared runner can only collect previews with this state; write methods fail closed.
  const noWrites = async (): Promise<never> => { throw new Error("Test mode forbids posting and writeback."); };
  const runs: RunStore = {
    async claim() { return { id: "test", state, leaseToken: "test" }; },
    async save() {},
    async release() {},
  };
  const ledger: LedgerStore = {
    async prepareSources() {},
    async hasReversals() { return false; },
    async findCategory() { return []; },
    syncLinks: noWrites,
    post: noWrites,
  };
  const result = await runLedgerSync("test", state, {
    client, runs, ledger, deadline: client.deadline,
    evaluate: async (category: CategoryDefinition, source: any) => {
      const event = await evaluate(category, source);
      if (event && inSyncDateRange(event.entryDate, options.dateRange)) {
        const proposed = await proposedRecords(client, category.tableId, source.id, event);
        records.push(...proposed);
      }
      return event;
    },
    log() {},
  }, options.maxRecords);
  return {
    test: true, fromDate: (options.dateRange ?? syncDateRange()).from, toDate: (options.dateRange ?? syncDateRange()).to, done: result.done, records, returned: records.length,
    stats: result.stats, errors: result.errors,
    blockedCategories: result.blockedCategories, deferredCategories: result.deferredCategories,
    airtableRequests: client.requests, databaseWrites: 0, airtableWrites: 0,
    requestForResume: result.done ? null : { test: true, categoryCodes: options.categoryCodes, maxRecords: options.maxRecords, ...(options.source ? { source: options.source } : {}), ...(options.dateRange ? { fromDate: options.dateRange.from, toDate: options.dateRange.to } : {}), cursor: state },
  };
}

async function proposedRecords(client: AirtableClient, tableId: string, recordId: string, event: LedgerPaymentEvent): Promise<TestRecord[]> {
  const pairs = event.categories.flatMap(category => category.postings.filter(posting => Number(posting.amount) !== 0).map(posting => ({ category, posting })));
  const references = pairs.flatMap(({ posting }) => [posting.debitAccount, posting.creditAccount]);
  const ids = [...new Set(references.flatMap(ref => ref.recordId ? [ref.recordId] : []))];
  const accounts = await client.readRecords(paymentSentFields.TABLES.accounts, ids, [paymentSentFields.ACCOUNT_FIELDS.number]);
  const numbers = new Map(accounts.map(account => [account.id, account.text(paymentSentFields.ACCOUNT_FIELDS.number)]));
  const number = (ref: { number?: string; recordId?: string }) => {
    const code = (ref.recordId ? numbers.get(ref.recordId) : undefined) ?? ref.number;
    if (!code) throw new Error("A proposed account has no account number.");
    return code === "0747" ? "112.300" : code; // Same FIN Nickel identity mapping as the journal writer.
  };
  return pairs.map(({ category, posting }) => ({
    table: client.table(tableId).name ?? tableId, tableId, recordId,
    rule: category.ruleCode, category: category.transactionType, entryKey: category.entryKey ?? "",
    date: event.entryDate, debitAccount: number(posting.debitAccount), creditAccount: number(posting.creditAccount), amount: posting.amount,
  }));
}

function testState(cursor: unknown, categoryCodes: string[], source?: SyncSource, dateRange?: SyncDateRange): RunState {
  const initial = initialState(categoryCodes, true, source, dateRange);
  if (cursor === undefined) return initial;
  if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) throw new RangeError("Invalid test cursor.");
  const state = cursor as RunState;
  const ids = (value: unknown): value is string[] => Array.isArray(value) && value.length <= 50_000 && value.every(id => typeof id === "string" && /^rec[A-Za-z0-9]{14}$/.test(id));
  const integer = (value: unknown, max: number) => Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= max;
  if (JSON.stringify(state.dateRange ?? null) !== JSON.stringify(initial.dateRange ?? null) || state.dryRun !== true || JSON.stringify(state.source ?? null) !== JSON.stringify(initial.source ?? null) || JSON.stringify(state.categoryIds) !== JSON.stringify(initial.categoryIds)
    || !integer(state.categoryIndex, initial.categoryIds.length) || !["related", "discover", "process"].includes(state.phase)
    || !(state.offset === null || typeof state.offset === "string" && state.offset.length <= 2048)
    || !ids(state.relatedIds) || !ids(state.recordIds)
    || (source && state.recordIds.some(id => id !== source.recordId))
    || !integer(state.relatedIndex, state.relatedIds.length) || !integer(state.recordIndex, state.recordIds.length)
    || typeof state.done !== "boolean" || !state.stats || typeof state.stats !== "object"
    || !Object.keys(initial.stats).every(key => integer(state.stats[key as keyof RunState["stats"]], Number.MAX_SAFE_INTEGER))
    || state.stats.posted !== 0 || state.stats.existing !== 0
    || !Array.isArray(state.errors) || state.errors.length > 20
    || !state.errors.every(error => error && [error.category, error.recordId, error.message].every(value => typeof value === "string" && value.length <= 10_000))) {
    throw new RangeError("Invalid test cursor. Use requestForResume unchanged with the same categoryCodes.");
  }
  return state;
}
