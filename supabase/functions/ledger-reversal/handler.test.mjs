import assert from "node:assert/strict";
import test from "node:test";
import { handleRequest } from "../ledger-payment/handler.ts";
import { PostingError } from "../ledger-payment/errors.ts";

const environment = { databaseUrl: "postgres://example.invalid/test", webhookSecret: "test-secret" };
const event = { source: { tableId: "tblR61NG9i0giid28", recordId: "rec00000000000001" }, journalEntryIds: [], reversalDate: "2026-11-09" };
const request = (secret = "test-secret") => new Request("https://example.test/ledger-reversal", { method: "POST", headers: { "x-ledger-secret": secret }, body: JSON.stringify(event) });

test("dedicated reversal request uses the existing authentication and forwards only its own contract", async () => {
  let calls = 0;
  const result = { source: event.source, journalEntryIds: [], reversalJournalEntryIds: [], reversedCount: 0, duplicateCount: 0, results: [] };
  const service = async received => { calls++; assert.deepEqual(received, event); return result; };
  assert.equal((await handleRequest(request("wrong"), environment, service)).status, 401);
  assert.equal(calls, 0);
  const response = await handleRequest(request(), environment, service);
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), result); assert.equal(calls, 1);
});

test("reversal conflicts and unexpected failures do not report a successful reversal", async t => {
  t.mock.method(console, "error", () => {});
  assert.equal((await handleRequest(request(), environment, async () => { throw new PostingError("Reversal date differs.", "23505"); })).status, 409);
  assert.equal((await handleRequest(request(), environment, async () => { throw new Error(environment.databaseUrl); })).status, 503);
});
