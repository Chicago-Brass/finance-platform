import { inSyncDateRange } from "./scope.ts";
import { AirtableClient } from "./airtable.ts";
import { CATEGORIES, DEFERRED_CATEGORIES, candidateFormula, and, or } from "./queries.ts";
import { POSTING_FIELDS, paymentSentFields, paymentEventsFields } from "./definitions.ts";
import { createCategoryEvaluator, sourceFields } from "./categories/index.ts";
import { writeBack } from "./writeback.ts";
import { BudgetExceeded, retry } from "./retry.ts";
import type { LedgerStore, RunState, RunStore, CategoryDefinition, SyncSource, SyncDateRange } from "./types.ts";
import type { LedgerPaymentEvent } from "../ledger-payment/ledger.ts";

export function initialState(categoryCodes: string[], dryRun: boolean, source?: SyncSource, dateRange?: SyncDateRange): RunState {
  const unknown = categoryCodes.filter(code => !CATEGORIES.some(c => c.code === code));
  if (unknown.length) throw new Error(`Unknown ledger categories: ${unknown.join(", ")}.`);
  return { dryRun, ...(source ? { source } : {}), ...(dateRange ? { dateRange } : {}), categoryIds: CATEGORIES.filter(c => (!source || c.tableId === source.tableId) && (categoryCodes.length ? categoryCodes.includes(c.code) : c.status !== "deferred")).map(c => c.id), categoryIndex: 0, phase: "related", offset: null, relatedIds: [], relatedIndex: 0, recordIds: [], recordIndex: 0,
    stats: { candidates: 0, processed: 0, matched: 0, posted: 0, existing: 0, zero: 0, errors: 0 }, errors: [], done: false };
}

interface Dependencies {
  client: AirtableClient;
  runs: RunStore;
  ledger: LedgerStore;
  deadline: number;
  enabledRuleCodes?: ReadonlySet<string>;
  evaluate?: (category: CategoryDefinition, source: any) => Promise<LedgerPaymentEvent | null>;
  log?: (message: string, details: unknown) => void;
}

// Discovery snapshots IDs before posting changes the filter. Each source is checkpointed after writeback.
export async function runLedgerSync(runKey: string, requested: RunState, deps: Dependencies, maxRecords = 25) {
  const { client, runs, ledger, deadline, log = console.log } = deps;
  const job = await runs.claim(runKey, requested);
  if (!job) return { busy: true, runKey };
  const state = job.state, preview: { category: string; recordId: string; journalCount: number; entryDate: string; entries: LedgerPaymentEvent["categories"] }[] = [];
  const disabledCategories = deps.enabledRuleCodes
    ? [...new Set(CATEGORIES.filter(category => state.categoryIds.includes(category.id) && !deps.enabledRuleCodes!.has(category.code)).map(category => category.code))]
    : [];
  const evaluate = deps.evaluate ?? createCategoryEvaluator(client);
  let processed = 0, paused = false;
  let batchCategory = "", batchEnd = 0;
  try {
    if (!state.done) await client.initialize();
    while (!state.done && Date.now() + 20_000 < deadline && processed < maxRecords) {
      const category = CATEGORIES.find(c => c.id === state.categoryIds[state.categoryIndex]);
      if (!category) { state.done = true; break; }
      if (deps.enabledRuleCodes && !deps.enabledRuleCodes.has(category.code)) {
        advanceCategory(state); client.clearRecordCache(); await runs.save(job); continue;
      }
      if (category.status === "deferred") {
        recordError(state, category, "", "Not yet implemented: category filters and mapping are deferred.");
        advanceCategory(state); await runs.save(job); continue;
      }
      if (state.phase === "related") {
        // A named source goes straight to its own query; the handler checks its linked records.
        const related = state.source ? undefined : category.related;
        if (related) {
          const page = await client.queryRecords(related.tableId, related.filter(client), [related.linksFieldId], state.offset);
          let ids = [...new Set<string>(page.records.flatMap(record => (record.value(related.linksFieldId) || []).map((link: { id: string }) => link.id)))];
          if (related.through && ids.length) {
            const parents = await client.readRecords(related.through.tableId, ids, [related.through.linksFieldId]);
            ids = [...new Set<string>(parents.flatMap(record => (record.value(related.through!.linksFieldId) || []).map((link: { id: string }) => link.id)))];
          }
          state.relatedIds.push(...ids); state.offset = page.offset;
          client.clearRecordCache();
        }
        if (!state.offset) { state.relatedIds = [...new Set(state.relatedIds)]; state.phase = "discover"; }
        await runs.save(job); continue;
      }
      if (state.phase === "discover") {
        const linked = state.relatedIds.slice(state.relatedIndex, state.relatedIndex + 40);
        if (category.related && !state.source && !linked.length) { state.phase = "process"; await runs.save(job); continue; }
        const formula = and(candidateFormula(category, client), state.source ? `RECORD_ID()=${JSON.stringify(state.source.recordId)}` : "");
        const page = await client.queryIds(category.tableId, category.related && !state.source ? and(formula, or(...linked.map(id => `RECORD_ID()=${JSON.stringify(id)}`))) : formula, state.offset);
        state.recordIds.push(...page.ids); state.offset = page.offset; state.stats.candidates += page.ids.length;
        if (category.related && !state.source && !page.offset) state.relatedIndex += linked.length;
        if (!page.offset && (state.source || !category.related || state.relatedIndex >= state.relatedIds.length)) { state.recordIds = [...new Set(state.recordIds)]; state.phase = "process"; }
        await runs.save(job); continue;
      }
      if (category.status === "blocked" && state.phase === "process") {
        if (state.recordIds.length) recordError(state,category,"",`Not yet implemented: account mapping is pending (${state.recordIds.length} candidates).`);
        advanceCategory(state); client.clearRecordCache(); await runs.save(job); continue;
      }
      if (state.recordIndex >= state.recordIds.length) {
        advanceCategory(state); client.clearRecordCache(); await runs.save(job); continue;
      }
      const recordId = state.recordIds[state.recordIndex];
      try {
        if (batchCategory !== category.id || state.recordIndex >= batchEnd) {
          client.clearRecordCache();
          const ids = state.recordIds.slice(state.recordIndex, state.recordIndex + Math.min(maxRecords - processed, 25));
          await client.readRecords(category.tableId, ids, sourceFields(category), false);
          await ledger.prepareSources(category.tableId, ids);
          batchCategory = category.id; batchEnd = state.recordIndex + ids.length;
        }
        const source = await client.readRecord(category.tableId, recordId, sourceFields(category));
        if (!source) throw new Error("Candidate source record no longer exists.");
        const control = POSTING_FIELDS[category.tableId as keyof typeof POSTING_FIELDS];
        // Snapshot eligibility can change while another category is being processed.
        const cancelled = category.tableId === paymentSentFields.TABLES.invoices ? source.value(POSTING_FIELDS.tbldQXuqNEp8G5pfs.cancelled) : category.eventType === "sent" && source.value(paymentEventsFields.PAYMENT_FIELDS.cancelled);
        const unsent = category.tableId === paymentSentFields.TABLES.payments && category.eventType === "sent" && !source.value(paymentSentFields.PAYMENT_FIELDS.sent);
        if (cancelled || unsent || (control && (source.value(control.reverse) || source.value(control.reverseDate)))) {
          log("Skipped cancelled/reversed source", { category: category.code, recordId });
        } else if (await ledger.hasReversals(category.tableId, recordId)) {
          throw new Error("Source has historical reversals; restoration is not implemented.");
        } else {
          const existing = await ledger.findCategory(category.tableId, recordId, category.code);
          if (existing.length) {
            state.stats.existing += existing.length;
            if (!state.dryRun) await writeBack(ledger, category.tableId, recordId);
            log("Existing category", { category: category.code, recordId, journals: existing.length });
          } else {
            // shortcut: one source's linked graph must fit an invocation; persist graph pages if real records exceed the budget.
            if (category.status === "blocked") throw new Error("Not yet implemented: the T-Chart account mapping is pending.");
            if (!state.dryRun && !control) throw new Error("Ledger Postings fields are not configured for this source table; preview only until writeback is defined.");
            const event = await evaluate(category, source);
            if (!event || !inSyncDateRange(event.entryDate, state.dateRange)) state.stats.zero++;
            else {
              if (!state.dryRun) client.requireWritebackBudget();
              state.stats.matched++;
              if (state.dryRun) {
                preview.push({ category: category.code, recordId, journalCount: event.categories.filter(c => c.postings.some(p => Number(p.amount))).length, entryDate: event.entryDate, entries: event.categories });
              } else {
                const posted = await retry(() => ledger.post(event), { deadline });
                if (posted.status) {
                  log("Ledger review required",{category:category.code,recordId,status:posted.status,requestId:posted.requestId});
                  state.recordIndex++; state.stats.processed++; processed++;
                  continue;
                }
                state.stats.posted += posted.postedCount; state.stats.existing += posted.duplicateCount;
              }
              log(state.dryRun ? "Preview match" : "Posted category", { category: category.code, recordId, journals: event.categories.length });
            }
          }
        }
      } catch (error) {
        if (error instanceof BudgetExceeded) throw error;
        const message = error instanceof Error ? error.message : "Category processing failed.";
        recordError(state, category, recordId, message); log("Category needs review", { category: category.code, recordId, message });
      }
      state.recordIndex++; state.stats.processed++; processed++;
      if (state.recordIndex >= state.recordIds.length) advanceCategory(state);
      await runs.save(job);
    }
    if (!state.done && state.categoryIndex >= state.categoryIds.length) state.done = true;
    await runs.save(job);
  } catch (error) {
    if (error instanceof BudgetExceeded) paused = true;
    else throw error;
  } finally { await runs.release(job); }
  return { runKey, dryRun: state.dryRun, done: state.done, paused: paused || !state.done, category: state.categoryIds[state.categoryIndex] ?? null,
    stats: state.stats, preview, errors: state.errors, deferredCategories: DEFERRED_CATEGORIES, blockedCategories: CATEGORIES.filter(c => c.status === "blocked").map(c => c.code), disabledCategories, airtableRequests: client.requests, resume: state.done ? null : { runKey } };
}
function advanceCategory(state: RunState) {
  state.categoryIndex++; state.phase = "related"; state.offset = null; state.relatedIds = []; state.relatedIndex = 0; state.recordIds = []; state.recordIndex = 0;
}
function recordError(state: RunState, category: CategoryDefinition, recordId: string, message: string) {
  state.stats.errors++;
  if (state.errors.length < 20) state.errors.push({ category: category.code, recordId, message });
}
