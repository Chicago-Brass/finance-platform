// Scheduler-neutral webhook. Airtable or Make owns when to invoke it.
import postgres from "npm:postgres@3.4.9";
import { handleDailyRequest } from "./handler.ts";
import { AirtableClient } from "./airtable.ts";
import { DatabaseLedgerStore, DatabaseRunStore, enabledRuleCodes } from "./store.ts";
import { testLedgerSync } from "./test-mode.ts";
import { runLedgerSync } from "./runner.ts";

const environment = {
  databaseUrl: Deno.env.get("SUPABASE_DB_URL") ?? "",
  webhookSecret: Deno.env.get("LEDGER_WEBHOOK_SECRET") ?? "",
  airtableToken: Deno.env.get("AIRTABLE_PAT") ?? "",
};
let sql: ReturnType<typeof postgres> | undefined;
Deno.serve(request => handleDailyRequest(request, environment, async ({ runKey, state, maxRecords }) => {
  sql ??= postgres(environment.databaseUrl, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10, ssl: { rejectUnauthorized: true } });
  const deadline = Date.now() + 90_000;
  const client = new AirtableClient(environment.airtableToken, deadline, fetch, { dateRange: state.dateRange });
  return runLedgerSync(runKey, state, {
    client,
    runs: new DatabaseRunStore(sql!),
    ledger: new DatabaseLedgerStore(sql!, environment.airtableToken, client.fetch.bind(client), deadline),
    enabledRuleCodes: await enabledRuleCodes(sql!),
    deadline,
  }, maxRecords);
}, options => testLedgerSync(
  new AirtableClient(environment.airtableToken, Date.now() + 90_000, fetch, {readOnly:true, dateRange: options.dateRange}), options,
)));
