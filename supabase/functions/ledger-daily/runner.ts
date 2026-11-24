import { inSyncDateRange, sourceDateFilter } from "./scope.ts";
import { AirtableClient } from "./airtable.ts";
import { CATEGORIES, DEFERRED_CATEGORIES, candidateFormula, ownerDiscoveryGroup, and, or } from "./queries.ts";
import { POSTING_FIELDS, paymentSentFields, paymentEventsFields, MANUAL_TABLE, MANUAL_FIELDS, INVOICE_MANUAL_FIELD, invoiceWorkerFields } from "./definitions.ts";
import { createCategoryEvaluator, prefetchInvoiceContext, sourceFields } from "./categories/index.ts";
import { LedgerWritebackError } from "../_shared/ledger-links.ts";
import { writeBack } from "./writeback.ts";
import { BudgetExceeded, retry } from "./retry.ts";
import type { LedgerStore, RunState, RunStore, CategoryDefinition, SyncSource, SyncDateRange, RunJob, RuleAttempt } from "./types.ts";
import type { LedgerPaymentEvent } from "../ledger-payment/ledger.ts";

export function initialState(categoryCodes: string[], dryRun: boolean, source?: SyncSource, dateRange?: SyncDateRange, createdFrom?: string): RunState {
  const unknown = categoryCodes.filter(code => !CATEGORIES.some(c => c.code === code));
  if (unknown.length) throw new RangeError(`Unknown ledger categories: ${unknown.join(", ")}.`);
  return { dryRun, ...(createdFrom ? { createdFrom } : {}), ...(source ? { source } : {}), ...(dateRange ? { dateRange } : {}), categoryIds: CATEGORIES.filter(c => (!source || c.tableId === source.tableId) && (categoryCodes.length ? categoryCodes.includes(c.code) : c.status !== "deferred")).map(c => c.id), categoryIndex: 0, phase: "related", offset: null, relatedIds: [], relatedIndex: 0, recordIds: [], recordIndex: 0,
    stats: { candidates: 0, processed: 0, matched: 0, posted: 0, existing: 0, zero: 0, errors: 0 }, errors: [], done: false };
}

interface Dependencies {
  client: AirtableClient;
  runs: RunStore;
  ledger: LedgerStore;
  deadline: number;
  enabledRuleCodes?: ReadonlySet<string>;
  evaluate?: (category: CategoryDefinition, source: any, repost?: boolean) => Promise<LedgerPaymentEvent | null>;
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
  const started = performance.now();
  const timing = { discoveryMs: 0, evaluationMs: 0, postingMs: 0 };
  async function measure<T>(stage: keyof typeof timing, action: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try { return await action(); }
    finally { timing[stage] += performance.now() - start; }
  }
  const scheduled = runKey.startsWith("scheduled:") && !!state.dateRange;
  const checkedDiscovery = new Set<string>(), emptyDiscovery = new Set<string>();
  let skippedDiscovery = 0;
  let processed = 0, paused = false;
  let batchCategory = "", batchEnd = 0;
  try {
    if (!state.done) await measure("discoveryMs", () => client.initialize());
    while (!state.done && Date.now() + 20_000 < deadline && processed < maxRecords) {
      const category = CATEGORIES.find(c => c.id === state.categoryIds[state.categoryIndex]);
      if (!category) { state.done = true; break; }
      if (deps.enabledRuleCodes && !deps.enabledRuleCodes.has(category.code)) {
        advanceCategory(state); client.clearRecordCache(state.source); await runs.save(job); continue;
      }
      if (category.status === "deferred") {
        recordError(state, category, "", "Not yet implemented: category filters and mapping are deferred.");
        advanceCategory(state); await runs.save(job); continue;
      }
      // Daily runs can query owners directly when their own table carries the accounting date.
      const ownerFirst = !!state.createdFrom || (scheduled && !!sourceDateFilter(category, client));
      const related = !state.source && (!ownerFirst || state.relatedIds.length > 0 || (state.phase === "related" && state.offset !== null)) ? category.related : undefined;
      if (state.phase === "related") {
        // For a daily run, use the exact owner predicates to skip empty rules in a single read.
        // Existing pagination and related snapshots retain their original discovery path.
        if (ownerFirst && !state.source && !related && !checkedDiscovery.has(category.id)) {
          const group = ownerDiscoveryGroup(client, state, category.tableId, checkedDiscovery, deps.enabledRuleCodes);
          if (group.length > 1) {
            try {
              const page = await measure("discoveryMs", () =>
                client.queryIds(category.tableId, or(...group.map(rule => rule.formula)), null, 1));
              if (!page.ids.length && !page.offset) for (const rule of group) emptyDiscovery.add(rule.id);
            } catch (error) {
              if (!(error instanceof Error) || !/^Airtable GET failed \(4(?:00|13|14|22)\):/.test(error.message)) throw error;
              log("Ledger grouped discovery rejected", { runKey, tableId: category.tableId, rules: group.map(rule => rule.id) });
            }
            for (const rule of group) checkedDiscovery.add(rule.id);
          } else {
            checkedDiscovery.add(category.id);
          }
        }
        if (emptyDiscovery.has(category.id)) {
          skippedDiscovery++; advanceCategory(state); continue;
        }
        if (related) {
          const relatedFilter = and(related.filter(client), related.tableId === paymentSentFields.TABLES.invoices ? `LEN(${client.field(related.tableId, INVOICE_MANUAL_FIELD)}&"")=0` : "");
          const page = await measure("discoveryMs", () => client.queryRecords(related.tableId, relatedFilter, [related.linksFieldId], state.offset));
          let ids = [...new Set<string>(page.records.flatMap(record => (record.value(related.linksFieldId) || []).map((link: { id: string }) => link.id)))];
          if (related.through && ids.length) {
            const parents = await client.readRecords(related.through.tableId, ids, [related.through.linksFieldId]);
            ids = [...new Set<string>(parents.flatMap(record => (record.value(related.through!.linksFieldId) || []).map((link: { id: string }) => link.id)))];
          }
          state.relatedIds.push(...ids); state.offset = page.offset;
          client.clearRecordCache(state.source);
        }
        if (!state.offset) { state.relatedIds = [...new Set(state.relatedIds)]; state.phase = "discover"; }
        await runs.save(job); continue;
      }
      if (state.phase === "discover") {
        const linked = state.relatedIds.slice(state.relatedIndex, state.relatedIndex + 40);
        if (related && !linked.length) { state.phase = "process"; await runs.save(job); continue; }
        const formula = candidateFormula(category, client, state.createdFrom, state.source?.recordId, !!state.repostId);
        const receiptDate = category.code === "INV-16" || category.code === "PAY-03"
          ? invoiceWorkerFields.PAYMENT_FIELDS.date : undefined;
        const shipDate = category.tableId === invoiceWorkerFields.TABLES.shipping ? invoiceWorkerFields.SHIPPING_FIELDS.date : undefined;
        const page = await measure("discoveryMs", () => client.queryIds(category.tableId,
          related ? and(formula, or(...linked.map(id => `RECORD_ID()=${JSON.stringify(id)}`))) : formula,
          state.offset, undefined, shipDate, receiptDate));
        if (page.dates) Object.assign(state.receiptDates ??= {}, page.dates);
        state.recordIds.push(...page.ids); state.offset = page.offset; state.stats.candidates += page.ids.length;
        if (related && !page.offset) state.relatedIndex += linked.length;
        if (!page.offset && (!related || state.relatedIndex >= state.relatedIds.length)) {
          state.recordIds = [...new Set(state.recordIds)];
          const dates = state.receiptDates;
          if (dates) state.recordIds.sort((a,b) => (dates[a] ?? "").localeCompare(dates[b] ?? "") || (a < b ? -1 : a > b ? 1 : 0));
          delete state.receiptDates;
          state.phase = "process";
        }
        await runs.save(job); continue;
      }
      if (category.status === "blocked" && state.phase === "process") {
        if (state.recordIds.length) recordError(state,category,"",`Not yet implemented: account mapping is pending (${state.recordIds.length} candidates).`);
        advanceCategory(state); client.clearRecordCache(state.source); await runs.save(job); continue;
      }
      if (state.recordIndex >= state.recordIds.length) {
        advanceCategory(state); client.clearRecordCache(state.source); await runs.save(job); continue;
      }
      const recordId = state.recordIds[state.recordIndex];
      let stage = "read";
      try {
        if (batchCategory !== category.id || state.recordIndex >= batchEnd) {
          client.clearRecordCache(state.source);
          const ids = state.recordIds.slice(state.recordIndex, state.recordIndex + Math.min(maxRecords - processed, 25));
          await measure("evaluationMs", async () => {
            const sources = await client.readRecords(category.tableId, ids, sourceFields(category), false);
            if (sources.length > 1) {
              await prefetchInvoiceContext(client, category, sources, !state.dryRun);
            }
            await ledger.prepareSources(category.tableId, ids);
          });
          batchCategory = category.id; batchEnd = state.recordIndex + ids.length;
        }
        const source = await measure("evaluationMs", () => client.readRecord(category.tableId, recordId, sourceFields(category)));
        if (!source) throw new Error("Candidate source record no longer exists.");
        const control = POSTING_FIELDS[category.tableId as keyof typeof POSTING_FIELDS];
        // Snapshot eligibility can change while another category is being processed.
        const cancelled = category.tableId === paymentSentFields.TABLES.invoices ? source.value(POSTING_FIELDS.tbldQXuqNEp8G5pfs.cancelled) : category.eventType === "sent" && source.value(paymentEventsFields.PAYMENT_FIELDS.cancelled);
        const unsent = category.tableId === paymentSentFields.TABLES.payments && category.eventType === "sent" && !source.value(paymentSentFields.PAYMENT_FIELDS.sent);
        if (cancelled || unsent || (category.tableId === MANUAL_TABLE && !state.repostId && !client.ignorePostingMarkers && source.value(MANUAL_FIELDS.posted)) || (!state.repostId && control && (source.value(control.reverse) || source.value(control.reverseDate)))) {
          log("Skipped cancelled/reversed source", { category: category.code, recordId });
        } else if (!state.repostId && await ledger.hasReversals(category.tableId, recordId)) {
          throw new Error("Source has historical reversals; restoration is not implemented.");
        } else {
          const existing = state.repostId ? [] : await ledger.findCategory(category.tableId, recordId, category.code);
          // Both receipt legs post together, so a credit-only receipt has no AR category to replay.
          const allCreditReceipt = !state.repostId && category.code === "INV-16" && !existing.length
            && (await ledger.findCategory(category.tableId, recordId, "PAY-03")).some(reference => reference.key === "");
          if (existing.length || allCreditReceipt) {
            state.stats.existing += existing.length;
            if (allCreditReceipt) state.stats.zero++;
            stage = "writeback";
            if (!state.dryRun && !client.ignorePostingMarkers) await measure("postingMs", () => writeBack(ledger, category.tableId, recordId));
            recordAttempt(job, category, recordId, "succeeded");
            log("Existing category", { category: category.code, recordId, journals: existing.length });
          } else {
            // shortcut: one source's linked graph must fit an invocation; persist graph pages if real records exceed the budget.
            if (category.status === "blocked") throw new Error("Not yet implemented: the T-Chart account mapping is pending.");
            if (!state.dryRun && !control) throw new Error("Ledger References fields are not configured for this source table; preview only until writeback is defined.");
            stage = "evaluate";
            const event = await measure("evaluationMs", () => evaluate(category, source, !!state.repostId));
            if (!event || ((!state.repostId || state.dateRange) && !inSyncDateRange(event.entryDate, state.dateRange))) state.stats.zero++;
            else {
              if (!state.dryRun && !client.ignorePostingMarkers) client.requireWritebackBudget();
              state.stats.matched++;
              if (state.dryRun) {
                preview.push({ category: category.code, recordId, journalCount: event.categories.filter(c => c.postings.some(p => Number(p.amount))).length, entryDate: event.entryDate, entries: event.categories });
              } else {
                stage = "post-and-verify";
                if (state.repostId) event.repostId = state.repostId;
                const posted = await measure("postingMs", () => retry(() => ledger.post(event), { deadline }));
                if (posted.status) {
                  recordAttempt(job, category, recordId, posted.status === "pending_review" ? "pending" : "failed", posted.status === "pending_review" ? null : "Posting request was rejected.");
                  log("Ledger review required",{category:category.code,recordId,status:posted.status,requestId:posted.requestId});
                  state.recordIndex++; state.stats.processed++; processed++;
                  continue;
                }
                state.stats.posted += posted.postedCount; state.stats.existing += posted.duplicateCount;
                recordAttempt(job, category, recordId, "succeeded");
              }
              log(state.dryRun ? "Preview match" : "Posted category", { category: category.code, recordId, journals: event.categories.length });
            }
          }
        }
      } catch (error) {
        if (error instanceof BudgetExceeded) throw error;
        if (state.repostId && error instanceof LedgerWritebackError) {
          state.stats.matched--;
          log("Ledger repost writeback needs retry", { runKey, category: category.code, recordId, outcome: error.outcome });
          paused = true;
          break;
        }
        const message = error instanceof Error ? error.message : "Category processing failed.";
        recordAttempt(job, category, recordId, "failed", safeAttemptError(error));
        recordError(state, category, recordId, message);
        log("Ledger source failed", { runKey, category: category.code, tableId: category.tableId, recordId, stage,
          errorType: error instanceof Error ? error.name : "Unknown", message });
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
  } finally {
    await runs.release(job);
    log("Ledger batch finished", { runKey, done: state.done, dryRun: state.dryRun, paused,
      category: state.categoryIds[state.categoryIndex] ?? null, phase: state.phase, stats: state.stats,
      skippedDiscovery, airtableRequests: client.requests, timing: { ...timing, elapsedMs: performance.now() - started } });
  }
  return { runKey, dryRun: state.dryRun, done: state.done, paused: paused || !state.done, category: state.categoryIds[state.categoryIndex] ?? null,
    stats: state.stats, preview, errors: state.errors, deferredCategories: DEFERRED_CATEGORIES, blockedCategories: CATEGORIES.filter(c => c.status === "blocked").map(c => c.code), disabledCategories, airtableRequests: client.requests, skippedDiscovery, timing: { ...timing, elapsedMs: performance.now() - started }, resume: state.done ? null : { runKey } };
}
function advanceCategory(state: RunState) {
  state.categoryIndex++; state.phase = "related"; state.offset = null; state.relatedIds = []; state.relatedIndex = 0; state.recordIds = []; state.recordIndex = 0; delete state.receiptDates;
}
function recordError(state: RunState, category: CategoryDefinition, recordId: string, message: string) {
  state.stats.errors++;
  if (state.errors.length < 20) state.errors.push({ category: category.code, recordId, message });
}
function recordAttempt(job: RunJob, category: CategoryDefinition, recordId: string, outcome: RuleAttempt["outcome"], error: string | null = null) {
  if (!job.state.dryRun) (job.attempts ??= []).push({ ruleCode: category.code, sourceTable: category.tableId, sourceRecordId: recordId, outcome, error, occurredAt: new Date().toISOString() });
}
function safeAttemptError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  // Only owned validation messages go into the UI; transport/SQL errors can contain private details.
  if (/^(Not yet implemented:|Journal Line |Manual journal |Invoice must |Source has historical reversals|Candidate source record|Ledger References fields)/.test(message)
    && !/https?:|Bearer |pat[A-Za-z0-9]+\.|@/.test(message)) return message.slice(0, 400);
  return "Posting or Airtable writeback failed. Review this source and the worker logs.";
}
