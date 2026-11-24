import { readCustomerBalance } from "../_shared/customer-credit.ts";
// Scheduler-neutral webhook. Airtable or Make owns when to invoke it.
import { createCategoryEvaluator } from "./categories/index.ts";
import { addJournalDisplay } from "./categories/journal-display.ts";
import { readRemainingDeposit } from "../_shared/shipping-deposit.ts";
import postgres from "npm:postgres@3.4.9";
import { handleDailyRequest } from "./handler.ts";
import { AirtableClient } from "./airtable.ts";
import { DatabaseLedgerStore, DatabaseRunStore, enabledRuleCodes, enqueueSourceReposts, resolveDisplayRules } from "./store.ts";
import { testLedgerSync } from "./test-mode.ts";
import { runLedgerSync } from "./runner.ts";
import { inDatabaseRegion } from "../_shared/database-region.ts";

// An isolated history import reads FIN but owns only its Supabase journals.
const readOnlyToken = Deno.env.get("LEDGER_AIRTABLE_READ_PAT");
const ignorePostingMarkers = Boolean(readOnlyToken);
const environment = {
  repostEnabled: !ignorePostingMarkers && Deno.env.get("LEDGER_REPOST_ENABLED") === "true",
  databaseUrl: Deno.env.get("SUPABASE_DB_URL") ?? "",
  webhookSecret: Deno.env.get("LEDGER_WEBHOOK_SECRET") ?? "",
  airtableToken: readOnlyToken || (Deno.env.get("AIRTABLE_PAT") ?? ""),
};
let sql: ReturnType<typeof postgres> | undefined;
function database() {
  return sql ??= postgres(environment.databaseUrl, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10, ssl: { rejectUnauthorized: true } });
}
const region = { projectUrl: Deno.env.get("SUPABASE_URL") ?? "", executionRegion: Deno.env.get("SB_REGION") ?? "", webhookSecret: environment.webhookSecret };
Deno.serve(request => inDatabaseRegion(request, "ledger-daily", region, request => handleDailyRequest(request, environment, async ({ runKey, state, maxRecords }) => {
  sql = database();
  const deadline = Date.now() + 90_000;
  const client = new AirtableClient(environment.airtableToken, deadline, fetch, { dateRange: state.dateRange, ignorePostingMarkers });
  let writebackMs = 0, writebackRequests = 0;
  const writebackFetch: typeof fetch = async (url, options) => {
    const start = performance.now();
    writebackRequests++;
    try { return await client.fetch(url, options); }
    finally { writebackMs += performance.now() - start; }
  };
  const evaluate = createCategoryEvaluator(client, (id, depositCents) => readRemainingDeposit(sql!, id, depositCents), readCustomerBalance(sql!));
  const result = await runLedgerSync(runKey, state, {
    client,
    runs: new DatabaseRunStore(sql!),
    ledger: new DatabaseLedgerStore(sql!, environment.airtableToken, writebackFetch, deadline, !ignorePostingMarkers),
    enabledRuleCodes: await enabledRuleCodes(sql!),
    deadline,
    evaluate: async (category, source, repost) => {
      const event = await evaluate(category, source, repost);
      return event && !state.dryRun ? await addJournalDisplay(client, event) : event;
    },
  }, maxRecords);
  if ("timing" in result) {
    console.log("Ledger writeback timing", { runKey, writebackMs, writebackRequests });
    return { ...result, timing: { ...result.timing, writebackMs, writebackRequests } };
  }
  return result;
}, options => {
  const client = new AirtableClient(environment.airtableToken, Date.now()+90_000, fetch, {readOnly:true,dateRange:options.dateRange,ignorePostingMarkers});
  return testLedgerSync(client, options, createCategoryEvaluator(client, (id, depositCents) => {
    if (!environment.databaseUrl) throw new Error("A database connection is required to preview shipment releases.");
    return readRemainingDeposit(database(), id, depositCents);
  }, readCustomerBalance(database())));
}, codes => resolveDisplayRules(database(),codes), source => enqueueSourceReposts(database(), source))));
