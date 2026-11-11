import assert from "node:assert/strict";
import test from "node:test";
import { handleRequest } from "./handler.ts";
import { PostingError } from "./errors.ts";

const environment = {
  databaseUrl: "postgres://test-user:test-password@example.invalid/test-database",
  webhookSecret: "test-webhook-secret",
};
const event = {
  paymentRecordId: "recExamplePayment",
  eventType: "sent",
  entryDate: "2026-10-30",
  categories: [{
    ruleCode: "PAY-07",
    transactionType: "Pay a vendor / bill from the bank (ACH, wire, check, Nickel, Wise)",
    postings: [{
      debitAccount: { number: "211.100" },
      creditAccount: { recordId: "recExampleAccount", number: "0747" },
      amount: "100.00",
      invoiceRecordId: "recExampleInvoice",
      branch: ["Chicago"],
    }],
  }],
};
const request = (body = event, secret = environment.webhookSecret) => new Request("https://example.test/ledger-payment", {
  method: "POST",
  headers: { "x-ledger-secret": secret, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const mustNotCall = () => { throw new Error("Unexpected database call."); };

test("only accepts POST and fails closed when configuration is missing", async () => {
  const method = await handleRequest(new Request("https://example.test/ledger-payment", {
    headers: { "x-ledger-secret": environment.webhookSecret },
  }), environment, mustNotCall);
  assert.equal(method.status, 405);
  assert.equal(method.headers.get("Allow"), "POST");
  for (const key of Object.keys(environment)) {
    const result = await handleRequest(request(), { ...environment, [key]: "" }, mustNotCall);
    assert.equal(result.status, 503);
  }
});

test("authenticates before reading JSON or accessing the database", async () => {
  const unauthorized = new Request("https://example.test/ledger-payment", {
    method: "POST", body: "invalid JSON", headers: { "x-ledger-secret": "wrong" },
  });
  assert.equal((await handleRequest(unauthorized, environment, mustNotCall)).status, 401);
  assert.equal(unauthorized.bodyUsed, false);
  assert.equal((await handleRequest(request(event, ""), environment, mustNotCall)).status, 401);
  assert.equal((await handleRequest(new Request("https://example.test/ledger-payment"), environment, mustNotCall)).status, 401);
});

test("rejects invalid JSON and non-object JSON without a database call", async () => {
  const invalid = new Request("https://example.test/ledger-payment", {
    method: "POST", body: "{", headers: { "x-ledger-secret": environment.webhookSecret },
  });
  assert.equal((await handleRequest(invalid, environment, mustNotCall)).status, 400);
  for (const body of [null, [], "string", 42]) {
    assert.equal((await handleRequest(request(body), environment, mustNotCall)).status, 400);
  }
});

test("forwards transaction metadata, final debit/credit pairs and branch unchanged", async () => {
  const posted = {
    paymentRecordId: event.paymentRecordId, eventType: "sent",
    results: [{ ruleCode: "PAY-07", status: "posted", journalEntryId: "example-journal" }],
    journalEntryIds: ["example-journal"], postedCount: 1, duplicateCount: 0,
  };
  for (const eventType of ["sent", "cancelled", "returned", "reconciled"]) {
    const supplied = { ...event, eventType };
    const result = { ...posted, eventType };
    let calls = 0;
    const response = await handleRequest(request(supplied), environment, async (received) => {
      calls += 1;
      assert.deepEqual(received, supplied, "event names do not transform the supplied pairs");
      return result;
    });
    assert.equal(calls, 1);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await response.json(), result);
  }
});

test("forwards depreciation source metadata and identifies it in safe failure logs", async (t) => {
  const supplied = {
    depreciationRecordId: "recDepreciation01", eventType: "created", entryDate: "2026-11-30",
    categories: [{ ruleCode: "EXP-10", transactionType: "Monthly depreciation", notes: "Associated asset: Example equipment", postings: [] }],
  };
  const result = { depreciationRecordId: supplied.depreciationRecordId, eventType: "created", results: [], journalEntryIds: [], postedCount: 0, duplicateCount: 0 };
  const response = await handleRequest(request(supplied), environment, async received => {
    assert.deepEqual(received, supplied); return result;
  });
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), result);
  const logs = [];
  t.mock.method(console, "error", (...args) => logs.push(args));
  assert.equal((await handleRequest(request(supplied), environment, async () => { throw new Error("Private details"); })).status, 503);
  assert.deepEqual(logs, [["Ledger posting failed.", { code: "UNKNOWN", sourceRecordId: supplied.depreciationRecordId }]]);
});

test("returns duplicate and no-op outcomes without another write attempt", async () => {
  const result = { results: [{ status: "duplicate" }, { status: "noop" }], postedCount: 0, duplicateCount: 1 };
  let calls = 0;
  const response = await handleRequest(request(), environment, async () => {
    calls += 1;
    return result;
  });
  assert.equal(calls, 1);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), result);
});

test("invoice-line requests retain their identity and identify safe failure logs", async (t) => {
  const supplied = { invoiceLineRecordId: "rec00000000000041", eventType: "entry_requested", entryDate: "2026-11-01", categories: [] };
  const result = { invoiceLineRecordId: supplied.invoiceLineRecordId, eventType: supplied.eventType, results: [], journalEntryIds: [], postedCount: 0, duplicateCount: 0 };
  const response = await handleRequest(request(supplied), environment, async received => { assert.deepEqual(received, supplied); return result; });
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), result);
  const logs = []; t.mock.method(console, "error", (...args) => logs.push(args));
  assert.equal((await handleRequest(request(supplied), environment, async () => { throw Error("Private details"); })).status, 503);
  assert.deepEqual(logs, [["Ledger posting failed.", { code: "UNKNOWN", sourceRecordId: supplied.invoiceLineRecordId }]]);
});

test("returns readable posting validation/conflict errors without internal details", async () => {
  for (const code of ["22023", "23505", "P0001", "23514", "23503"]) {
    const response = await handleRequest(request(), environment, async () => {
      throw Object.assign(new PostingError("Journal postings do not balance.", code), { details: "unused" });
    });
    assert.equal(response.status, code === "23505" ? 409 : 400);
    const body = await response.text();
    assert.deepEqual(JSON.parse(body), { error: "Journal postings do not balance.", code });
    assert.ok(!body.includes(environment.databaseUrl));
    assert.ok(!body.includes(environment.webhookSecret));
    assert.ok(!body.includes("unused"));
  }
});

test("redacts native SQL messages even when their code is a validation or conflict code", async () => {
  for (const code of ["22023", "23505", "P0001", "23514", "23503"]) {
    const response = await handleRequest(request(), environment, async () => {
      throw Object.assign(new Error(`Failed ${environment.databaseUrl}`), { code });
    });
    assert.equal(response.status, code === "23505" ? 409 : 400);
    const body = await response.text();
    assert.deepEqual(JSON.parse(body), { error: "Journal data was rejected by the database.", code });
    assert.ok(!body.includes(environment.databaseUrl));
    assert.ok(!body.includes("test-password"));
  }
});

test("logs safe failure context while hiding connection details and returning no false success", async (t) => {
  const logs = [];
  t.mock.method(console, "error", (...args) => logs.push(args));
  for (const code of ["ECONNREFUSED", "28P01", "42501", "40001", "40P01", undefined]) {
    const response = await handleRequest(request(), environment, async () => {
      throw Object.assign(new Error(`Failed ${environment.databaseUrl}`), { code });
    });
    assert.equal(response.status, 503);
    const body = await response.text();
    assert.equal(JSON.parse(body).error, "Ledger database is unavailable. Retry the same event.");
    assert.ok(!body.includes(environment.databaseUrl));
    assert.ok(!body.includes("test-password"));
    assert.deepEqual(logs.at(-1), ["Ledger posting failed.", { code: code || "UNKNOWN", sourceRecordId: event.paymentRecordId }]);
  }
  assert.equal(logs.length, 6);
  assert.ok(!JSON.stringify(logs).includes(environment.databaseUrl));
  assert.ok(!JSON.stringify(logs).includes(environment.webhookSecret));
});

test("failure logs identify invoice sources and exclude malformed identifiers and codes", async (t) => {
  const logs = [];
  t.mock.method(console, "error", (...args) => logs.push(args));
  const supplied = { ...event, source: { tableId: "tbldQXuqNEp8G5pfs", recordId: "recExampleInvoice" } };
  await handleRequest(request(supplied), environment, async () => { throw new Error("Private details"); });
  assert.deepEqual(logs[0], ["Ledger posting failed.", { code: "UNKNOWN", sourceRecordId: supplied.source.recordId }]);
  await handleRequest(request({ ...event, paymentRecordId: environment.webhookSecret }), environment, async () => {
    throw Object.assign(new Error(environment.databaseUrl), { code: environment.databaseUrl });
  });
  assert.deepEqual(logs[1], ["Ledger posting failed.", { code: "UNKNOWN", sourceRecordId: undefined }]);
  assert.ok(!JSON.stringify(logs).includes(environment.webhookSecret));
  assert.ok(!JSON.stringify(logs).includes(environment.databaseUrl));
});
