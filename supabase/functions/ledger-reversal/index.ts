// Dedicated reversal endpoint. Reuse the ledger webhook's authorization and error handling.
import postgres from "npm:postgres@3.4.9";
import { handleRequest } from "../ledger-payment/handler.ts";
import { type ReversalRequest } from "./reversal.ts";
import { reverseAndSync } from "./service.ts";

// ==================== CONFIGURATION ====================
const environment = {
  databaseUrl: Deno.env.get("SUPABASE_DB_URL") ?? "",
  webhookSecret: Deno.env.get("LEDGER_WEBHOOK_SECRET") ?? "",
  airtableToken: Deno.env.get("AIRTABLE_PAT") ?? "",
};

const sql = environment.databaseUrl
  ? postgres(environment.databaseUrl, { prepare: false, max: 1, idle_timeout: 20, ssl: { rejectUnauthorized: true } })
  : undefined;

// ==================== HTTP ENTRY ====================
Deno.serve((request: Request) => handleRequest(request, environment, (event: ReversalRequest) => reverseAndSync(sql!, event, environment.airtableToken)));
