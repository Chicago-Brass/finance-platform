import postgres from "npm:postgres@3.4.9";
import { handleRequest } from "./handler.ts";
import { postAndSync } from "./service.ts";

// ==================== CONFIGURATION ====================
const environment = {
  databaseUrl: Deno.env.get("SUPABASE_DB_URL") ?? "",
  webhookSecret: Deno.env.get("LEDGER_WEBHOOK_SECRET") ?? "",
  airtableToken: Deno.env.get("AIRTABLE_PAT") ?? "",
};

// ==================== DATABASE ====================
const sql = environment.databaseUrl
  ? postgres(environment.databaseUrl, { prepare: false, max: 1, idle_timeout: 20, ssl: { rejectUnauthorized: true } })
  : undefined;

// ==================== HTTP ENTRY ====================
Deno.serve((request: Request) => handleRequest(request, environment, (event) => postAndSync(sql!, event, environment.airtableToken)));
