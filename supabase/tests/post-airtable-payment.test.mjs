import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import postgres from "postgres";
import { postPayment } from "../functions/ledger-payment/ledger.ts";
import { handleRequest } from "../functions/ledger-payment/handler.ts";

const databaseUrl = process.env.LEDGER_TEST_DATABASE_URL;
if (!databaseUrl || !["127.0.0.1", "localhost"].includes(new URL(databaseUrl).hostname)) {
  throw new Error("Run check-payment-posting.sh against its disposable local database.");
}
const sql = postgres(databaseUrl, { prepare: false, max: 4, connect_timeout: 5, onnotice: () => {} });
const posting = (debit = "211.100", credit = "112.100", amount = "100.00", refs = {}) => ({
  debitAccount: { number: debit }, creditAccount: { number: credit }, amount, ...refs,
});
const event = (id, rule = "PAY-07", postings = [posting()], transactionType = "Airtable-selected transaction") => ({
  paymentRecordId: id, eventType: "sent", entryDate: "2026-10-29",
  paymentName: "Test payment", paymentAmount: "100.00", referenceNumber: "TEST-REF",
  categories: [{ ruleCode: rule, transactionType, postings }],
});
const copy = (value) => structuredClone(value);
const entries = (id) => sql`select * from public.journal_entries where source_record_id = ${id} order by entry_number`;
const lines = (id) => sql`
  select l.* from public.journal_lines l join public.journal_entries e on e.id = l.entry_id
  where e.source_record_id = ${id} order by e.entry_number, l.line_no
`;

async function failure(value, code) {
  const sourceId = value.source?.recordId || value.depreciationRecordId || value.invoiceRecordId || value.paymentRecordId;
  const count = (await entries(sourceId)).length;
  await assert.rejects(() => postPayment(sql, value), (error) => {
    if (code) assert.equal(error.code, code, error.message);
    return true;
  });
  assert.equal((await entries(sourceId)).length, count, "failed request leaves no partial journals");
}

test("account-keyed expense entries post separately, retain branch and deduplicate atomically", async () => {
  const invoiceRecordId = "recAccountPayroll";
  const value = { invoiceRecordId, eventType: "entry_requested", entryDate: "2026-11-01", categories: [
    { ruleCode: "EXP-07", entryKey: "005.101", transactionType: "Payroll", postings: [
      posting("005.101", "241.100", "50.00", { sourceRecordId: invoiceRecordId, sourceRecordIds: ["recSalaryA", "recSalaryB"], branch: ["Chicago"] }),
    ] },
    { ruleCode: "EXP-07", entryKey: "005.003", transactionType: "Payroll", postings: [posting("005.003", "241.100", "25.00", { branch: "Chicago" })] },
  ] };
  const outcomes = await Promise.all([postPayment(sql, value), postPayment(sql, copy(value))]);
  assert.equal(outcomes.reduce((n, r) => n + r.postedCount, 0), 2);
  assert.equal(outcomes.reduce((n, r) => n + r.duplicateCount, 0), 2);
  const journals = await entries(invoiceRecordId), stored = await lines(invoiceRecordId);
  assert.deepEqual(journals.map(j => j.source_entry_key).sort(), ["005.003", "005.101"]);
  assert.equal(stored.length, 4); assert.ok(stored.every(line => line.branch === "Chicago" && line.invoice_ref.length === 1 && line.invoice_ref[0] === invoiceRecordId));
  assert.ok(stored.filter(line => line.account_code === "005.101").every(line => JSON.stringify(line.airtable_record_ids) === JSON.stringify(["recSalaryA", "recSalaryB"])));
  const reordered = copy(value); reordered.categories[0].postings[0].sourceRecordIds = ["recSalaryB", "recSalaryA", "recSalaryB"];
  assert.equal((await postPayment(sql, reordered)).duplicateCount, 2);
  for (const journal of journals) {
    const group = stored.filter(line => line.entry_id === journal.id);
    assert.deepEqual([...new Set(group.map(line => line.account_code))].sort(), [journal.source_entry_key, "241.100"].sort());
  }
  for (const mutate of [
    v => { v.categories.pop(); },
    v => { v.categories[0].entryKey = "different-account"; },
    v => { v.categories[0].postings[0].branch = ["Milwaukee"]; },
    v => { v.categories[0].postings[0].sourceRecordIds = ["recDifferentLine"]; },
    v => { delete v.categories[0].entryKey; delete v.categories[1].entryKey; v.categories[0].postings.push(...v.categories.pop().postings); },
  ]) {
    const changed = copy(value); mutate(changed); await failure(changed, "23505");
  }
  const unkeyedId = "recUnkeyedPayroll";
  const unkeyed = { invoiceRecordId: unkeyedId, eventType: "entry_requested", entryDate: value.entryDate, categories: [copy(value.categories[0])] };
  delete unkeyed.categories[0].entryKey;
  await postPayment(sql, unkeyed);
  unkeyed.categories[0].entryKey = "005.101";
  await failure(unkeyed, "23505");
});

test("invalid account keys and branches fail without partial journals; missing branches stay null", async () => {
  for (const [id, key, branch] of [["recMalformedBranch", "005.101", ["Chicago", 42]], ["recInvalidBranch", "005.101", 42], ["recInvalidKey", " padded ", []], ["recObjectKey", {}, []]]) {
    const value = { invoiceRecordId: id, eventType: "entry_requested", entryDate: "2026-11-01", categories: [
      { ruleCode: "EXP-07", entryKey: key, transactionType: "Payroll", postings: [posting("005.101", "241.100", "20.00", { branch })] },
    ] };
    await failure(value, "22023");
  }
  const value = { invoiceRecordId: "recNullableBranch", eventType: "entry_requested", entryDate: "2026-11-01", categories: [
    { ruleCode: "EXP-07", entryKey: "005.101", transactionType: "Payroll", postings: [posting("005.101", "241.100", "20.00", { branch: [] })] },
  ] };
  const duplicate = copy(value); duplicate.categories.push(copy(value.categories[0])); await failure(duplicate, "22023");
  const mixed = copy(value); mixed.categories.push({ ...copy(value.categories[0]), entryKey: "" }); await failure(mixed, "22023");
  const invalidLater = copy(value); invalidLater.categories.push({ ...copy(value.categories[0]), entryKey: "005.003", postings: [posting("nonexistent", "241.100", "1.00")] }); await failure(invalidLater, "22023");
  for (const ids of ["not-an-array", ["recSource", 123], [""], [{}]]) {
    const malformed = copy(value); malformed.categories[0].postings[0].sourceRecordIds = ids; await failure(malformed, "22023");
  }
  await postPayment(sql, value); assert.ok((await lines(value.invoiceRecordId)).every(line => line.branch === null));
});

test("aggregate card payments with several branches keep nullable attribution without changing amounts", async () => {
  for (const [id, branch, expected] of [["recMixedCardBranch", ["Chicago", "Milwaukee"], null], ["recSharedCardBranch", ["Chicago", "Chicago"], "Chicago"]]) {
    const value = event(id, "PAY-17", [posting("231.100", "112.100", "15.25", { branch })]);
    assert.equal((await postPayment(sql, value)).postedCount, 1);
    const stored = await lines(id); assert.ok(stored.every(line => line.branch === expected));
    assert.deepEqual(stored.map(line => [line.debit, line.credit]), [["15.25", "0.00"], ["0.00", "15.25"]]);
    assert.equal((await postPayment(sql, value)).duplicateCount, 1);
  }
});

test("new expense accounts retain FIN identities and are usable by the generic writer", async () => {
  const expected = [["009.002", "recNVjoY2qo8bdQT7", "opex"], ["009.006", "recsUdNvhsEbvL9v3", "opex"], ["005.102", "recTcmhT5y78RAomk", "payroll"]];
  for (const [code, airtableId, subtype] of expected) {
    const [account] = await sql`select * from public.accounts where code=${code}`;
    assert.equal(account.airtable_record_id, airtableId); assert.equal(account.account_type, "expense"); assert.equal(account.normal_balance, "debit"); assert.equal(account.subtype, subtype);
    const value = event(`recNewAccount${code}`, "EXP-05", [posting(code, "211.100", "1.00")]);
    assert.equal((await postPayment(sql, value)).postedCount, 1);
  }
});

test("Fully Paid invoice event remains separate from Create Entry and replays safely", async () => {
  const invoiceRecordId = "recStatusInvoice";
  const value = { invoiceRecordId, eventType: "entry_requested", entryDate: "2026-11-01", categories: [
    { ruleCode: "EXP-03", transactionType: "Prepaid bill", postings: [posting("135.000", "211.100", "50.00")] },
  ] };
  assert.equal((await postPayment(sql, value)).postedCount, 1);
  const paid = { ...copy(value), eventType: "paid", categories: [
    { ruleCode: "EXP-02", transactionType: "Card expense", postings: [posting("009.002", "231.100", "50.00")] },
  ] };
  assert.equal((await postPayment(sql, paid)).postedCount, 1);
  assert.equal((await postPayment(sql, paid)).duplicateCount, 1);
  assert.equal((await postPayment(sql, value)).duplicateCount, 1);
  assert.equal((await entries(invoiceRecordId)).length, 2);
  const wrong = copy(paid); wrong.paymentRecordId = "recUnexpectedPayment";
  await failure(wrong, "22023");
});

test("prepay creation owns its source, preserves note/branch and rejects wrong source types", async () => {
  const id = "recPrepaidUse";
  const value = { prepayLogRecordId: id, eventType: "created", entryDate: "2026-11-01", source: {
    tableId: "tbl1LgiUYt7Gc492d", recordId: id, recordName: "Prepaid insurance use-up",
  }, categories: [{ ruleCode: "EXP-04", transactionType: "Prepaid expense - monthly use-up", notes: "Prepay Log label",
    postings: [posting("007.011", "135.000", "25.00", { sourceRecordId: id, branch: ["Chicago"] })] }] };
  assert.equal((await postPayment(sql, value)).postedCount, 1);
  assert.equal((await postPayment(sql, value)).duplicateCount, 1);
  const [header] = await entries(id), stored = await lines(id);
  assert.equal(header.notes, "Prepay Log label"); assert.equal(header.source_table, value.source.tableId);
  assert.equal(header.audit_link, `https://airtable.com/app0Q1UMEdUeWl538/tbl1LgiUYt7Gc492d/${id}`);
  assert.ok(stored.every(line => line.branch === "Chicago" && line.invoice_ref.length === 0 && line.airtable_record_id === id));
  for (const mutate of [v => { v.invoiceRecordId = "recFakeInvoice"; }, v => { v.depreciationRecordId = "recFakeDep"; }, v => { v.eventType = "paid"; }, v => { v.source.tableId = "tbldQXuqNEp8G5pfs"; }]) {
    const invalid = copy(value); mutate(invalid); await failure(invalid, "22023");
  }
});

test("depreciation creation posts its supplied pair with its own source and audit link", async () => {
  const id = "recDepreciationCreated";
  const value = {
    depreciationRecordId: id, eventType: "created", entryDate: "2037-08-15", referenceNumber: id,
    source: { tableId: "tblC0dbO5UMXzHma9", recordId: id, recordName: "Example monthly depreciation" },
    categories: [{ ruleCode: "EXP-10", transactionType: "Monthly depreciation of equipment, vehicles, fixtures",
      notes: "Associated asset: Example equipment (recExampleAsset)",
      postings: [posting("009.101", "161.000", "125.56", { sourceRecordId: id })] }],
  };
  const results = await Promise.all([postPayment(sql, value), postPayment(sql, copy(value))]);
  assert.equal(results.reduce((n, result) => n + result.postedCount, 0), 1);
  assert.equal(results.reduce((n, result) => n + result.duplicateCount, 0), 1);
  assert.ok(results.every(result => result.depreciationRecordId === id && !("invoiceRecordId" in result) && !("paymentRecordId" in result)));
  const [journal] = await entries(id), stored = await lines(id);
  const audit = `https://airtable.com/app0Q1UMEdUeWl538/tblC0dbO5UMXzHma9/${id}`;
  assert.equal(journal.source_table, value.source.tableId); assert.equal(journal.source_event_type, "created");
  assert.equal(journal.entry_date.toISOString().slice(0, 10), value.entryDate); assert.equal(journal.notes, value.categories[0].notes);
  assert.equal(journal.audit_link, audit); assert.equal(journal.external_ref, id);
  assert.deepEqual(stored.map(line => [line.account_code, line.debit, line.credit]), [["009.101", "125.56", "0.00"], ["161.000", "0.00", "125.56"]]);
  assert.ok(stored.every(line => line.invoice_ref.length === 0 && line.airtable_record_id === id && line.audit_link === audit));
  const withoutSource = copy(value); delete withoutSource.source;
  assert.equal((await postPayment(sql, withoutSource)).duplicateCount, 1);
  for (const mutate of [
    v => { v.categories[0].postings[0].amount = "126.00"; },
    v => { v.entryDate = "2037-08-16"; },
    v => { v.categories[0].notes = "Different asset"; },
  ]) {
    const changed = copy(value); mutate(changed); await failure(changed, "23505");
  }
  for (const mutate of [
    v => { v.paymentRecordId = "recFakePayment"; },
    v => { v.invoiceRecordId = "recFakeInvoice"; },
    v => { v.eventType = "sent"; },
    v => { v.source.recordId = "recWrongSource"; },
    v => { v.source.tableId = "tbldQXuqNEp8G5pfs"; },
    v => { delete v.depreciationRecordId; },
  ]) {
    const invalid = copy(value); mutate(invalid); await failure(invalid, "22023");
  }
  const zero = copy(value); zero.depreciationRecordId = zero.source.recordId = "recZeroDepreciation"; zero.categories[0].postings = [];
  assert.equal((await postPayment(sql, zero)).results[0].status, "noop");
  assert.equal((await entries(zero.depreciationRecordId)).length, 0);
});

test("invoice-created event posts and deduplicates without a payment", async () => {
  const value = {
    invoiceRecordId: "recCreatedInvoice", eventType: "created", entryDate: "2026-10-29",
    source: { tableId: "tbldQXuqNEp8G5pfs", recordId: "recCreatedInvoice", recordName: "INV - created" },
    categories: [{ ruleCode: "INV-04", transactionType: "Vendor invoice for inbound freight / handling on a PO", postings: [posting("131.100", "211.100", "125.56", { invoiceRecordId: "recCreatedInvoice" })] }],
  };
  const result = await postPayment(sql, value);
  assert.equal(result.postedCount, 1); assert.equal(result.invoiceRecordId, value.invoiceRecordId);
  assert.equal("paymentRecordId" in result, false);
  const [journal] = await entries(value.invoiceRecordId);
  assert.equal(journal.source_table, "tbldQXuqNEp8G5pfs"); assert.equal(journal.source_event_type, "created");
  assert.equal(journal.audit_link, `https://airtable.com/app0Q1UMEdUeWl538/tbldQXuqNEp8G5pfs/${value.invoiceRecordId}`);
  assert.equal(journal.description, value.categories[0].transactionType + " - INV - created");
  const stored = await lines(value.invoiceRecordId);
  assert.deepEqual(stored.map(line => line.invoice_ref), [[value.invoiceRecordId], [value.invoiceRecordId]]);
  assert.ok(stored.every(line => line.audit_link === journal.audit_link));
  assert.equal((await postPayment(sql, copy(value))).duplicateCount, 1);
  const changed = copy(value); changed.categories[0].postings[0].amount = "126.00";
  await failure(changed, "23505");
  const malformed = copy(value); malformed.source.recordId = "recWrongInvoice";
  await failure(malformed, "22023");
  const fakePayment = copy(value); fakePayment.paymentRecordId = "recFakePayment";
  await failure(fakePayment, "22023");
  const missingInvoice = copy(value); delete missingInvoice.invoiceRecordId;
  await failure(missingInvoice, "22023");
});

test("all other resolved Invoice Entry pairs use the same generic writer", async () => {
  for (const [rule, debit, credit] of [
    ["INV-06", "212.100", "211.100"], ["INV-07", "143.300", "211.100"],
    ["INV-08", "211.100", "131.400"], ["INV-10", "121.100", "010.001"],
  ]) {
    const invoiceRecordId = `recCreated${rule}`;
    const value = { invoiceRecordId, eventType: "created", entryDate: "2026-10-29", categories: [
      { ruleCode: rule, transactionType: "Invoice-entry supplied pair", postings: [posting(debit, credit, "20.00")] },
    ] };
    const results = await Promise.all([postPayment(sql, value), postPayment(sql, copy(value))]);
    assert.equal(results.reduce((count, result) => count + result.postedCount, 0), 1);
    assert.equal(results.reduce((count, result) => count + result.duplicateCount, 0), 1);
    const stored = await lines(invoiceRecordId);
    assert.deepEqual(stored.map(line => [line.account_code, line.debit, line.credit, line.invoice_ref]), [
      [debit, "20.00", "0.00", [invoiceRecordId]], [credit, "0.00", "20.00", [invoiceRecordId]],
    ]);
  }
});

test("Create Entry posts expense pairs alongside a separate creation event on the same invoice", async () => {
  const invoiceRecordId = "recExpenseInvoice";
  const value = {
    invoiceRecordId, eventType: "entry_requested", entryDate: "2026-10-29",
    source: { tableId: "tbldQXuqNEp8G5pfs", recordId: invoiceRecordId, recordName: "INV - Expense" },
    categories: [
      { ruleCode: "EXP-07", transactionType: "Payroll - offshore / 1099 / owner staff invoice", postings: [
        posting("005.101", "241.100", "100.01", { invoiceRecordId, sourceRecordId: "recSalaryLine" }),
        posting("005.003", "241.100", "20.00", { invoiceRecordId, sourceRecordId: "recContractorLine" }),
      ] },
      { ruleCode: "EXP-09", transactionType: "Month-end accrual - bonus & commission earned", postings: [
        posting("005.201", "241.300", "7.50", { invoiceRecordId, sourceRecordId: "recBonusLine" }),
      ] },
    ],
  };
  const creation = { ...copy(value), eventType: "created", categories: [
    { ruleCode: "INV-04", transactionType: "Separate invoice creation", postings: [posting("131.100", "211.100", "10.00")] },
  ] };
  await postPayment(sql, creation);
  const results = await Promise.all([postPayment(sql, value), postPayment(sql, copy(value))]);
  assert.equal(results.reduce((total, result) => total + result.postedCount, 0), 2);
  assert.equal(results.reduce((total, result) => total + result.duplicateCount, 0), 2);
  const storedEntries = await entries(invoiceRecordId);
  assert.equal(storedEntries.length, 3);
  assert.deepEqual(storedEntries.filter(entry => entry.source_event_type === "entry_requested").map(entry => entry.rule_code).sort(), ["EXP-07", "EXP-09"]);
  const storedLines = await lines(invoiceRecordId);
  assert.ok(storedLines.every(line => line.invoice_ref.length === 1 && line.invoice_ref[0] === invoiceRecordId && line.audit_link.endsWith(`/${invoiceRecordId}`)));
  assert.equal(storedLines.filter(line => line.airtable_record_id === "recSalaryLine").length, 2);
  const changed = copy(value); changed.categories[0].postings[0].amount = "100.02";
  await failure(changed, "23505");
  const wrongSource = copy(value); wrongSource.source.recordId = "recWrongExpenseInvoice";
  await failure(wrongSource, "22023");
  const fakePayment = copy(value); fakePayment.paymentRecordId = "recFakeExpensePayment";
  await failure(fakePayment, "22023");
});

before(async () => {
  const [database] = await sql`select current_database() as name`;
  assert.equal(database.name, "ledger_check");
  const rules = await sql`select rule_code from public.ledger_rules where rule_code in ('INV-04', 'INV-06', 'INV-07', 'INV-08', 'INV-10')`;
  assert.equal(rules.length, 5, "reference seed includes the invoice rules");
  const [functions] = await sql`
    select to_regprocedure('public.post_airtable_payment(jsonb)') as mapper,
      to_regprocedure('public.resolve_airtable_ledger_account(jsonb,text)') as resolver,
      to_regprocedure('public.create_journal_entry(jsonb,jsonb,boolean)') as creator,
      to_regprocedure('public.reverse_journal_entry(uuid,date,text)') as reverser
  `;
  assert.deepEqual({ ...functions }, { mapper: null, resolver: null, creator: null, reverser: null });
  const [column] = await sql`select data_type from information_schema.columns where table_schema='public' and table_name='journal_entries' and column_name='transaction_type'`;
  assert.equal(column.data_type, "text");
});
after(async () => { await sql.end({ timeout: 5 }); });

test("authenticated webhook runs the Edge TypeScript through to real journal tables", async () => {
  const value = event("recHttpPipeline");
  const response = await handleRequest(new Request("https://example.test/ledger-payment", {
    method: "POST", headers: { "Content-Type": "application/json", "x-ledger-secret": "local-test-only" },
    body: JSON.stringify(value),
  }), { databaseUrl, webhookSecret: "local-test-only" }, (packet) => postPayment(sql, packet));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).postedCount, 1);
  assert.equal((await entries(value.paymentRecordId)).length, 1);
});

test("the webhook reports real posting validation and replay conflicts without another write", async () => {
  const environment = { databaseUrl, webhookSecret: "local-test-only" };
  const send = (packet) => handleRequest(new Request("https://example.test/ledger-payment", {
    method: "POST", headers: { "Content-Type": "application/json", "x-ledger-secret": environment.webhookSecret },
    body: JSON.stringify(packet),
  }), environment, (value) => postPayment(sql, value));
  const invalid = event("recHttpInvalid", "PAY-07", [posting("211.100", "112.100", "NaN")]);
  assert.equal((await send(invalid)).status, 400);
  assert.equal((await entries(invalid.paymentRecordId)).length, 0);
  const changed = event("recHttpPipeline", "PAY-07", [posting("211.100", "112.100", "101.00")]);
  assert.equal((await send(changed)).status, 409);
  assert.equal((await entries(changed.paymentRecordId)).length, 1);
});

test("direct Edge code persists the free-text type, selected accounts and audit references", async () => {
  const value = event("recSimple", "PAY-07", [posting("211.100", "112.100", "100.00", {
    invoiceRecordId: "recInvoice", vendorRecordId: "recVendor", clientRecordId: "recClient",
    transactionRecordId: "recOrder", poRecordId: "recPO", staffRecordId: "recStaff",
    sourceRecordId: "recSourceLine", stateCode: "IL", branch: ["Chicago"],
  })], "Vendor's selected settlement");
  const result = await postPayment(sql, value);
  assert.equal(result.postedCount, 1);
  const journals = await entries(value.paymentRecordId);
  assert.equal(journals.length, 1);
  assert.equal(journals[0].id, result.journalEntryIds[0]);
  assert.equal(journals[0].status, "posted");
  assert.equal(journals[0].transaction_type, "Vendor's selected settlement");
  assert.equal(journals[0].source_event_type, "sent");
  assert.equal(journals[0].source_table, "tblR61NG9i0giid28");
  assert.ok(journals[0].posted_at);
  const rows = await lines(value.paymentRecordId);
  assert.equal(rows.length, 2);
  const ap = rows.find((line) => line.account_code === "211.100");
  assert.equal(ap.debit, "100.00");
  assert.equal(ap.credit, "0.00");
  assert.deepEqual(ap.invoice_ref, ["recInvoice"]);
  assert.deepEqual(ap.vendor_ref, ["recVendor"]);
  assert.deepEqual(ap.customer_ref, ["recClient"]);
  assert.deepEqual(ap.order_ref, ["recOrder"]);
  assert.deepEqual(ap.po_ref, ["recPO"]);
  assert.deepEqual(ap.employee_ref, ["recStaff"]);
  assert.equal(ap.airtable_record_id, "recSourceLine");
  assert.equal(ap.state_code, "IL");
  assert.ok(rows.every(row => row.branch === "Chicago"));
  const paymentAudit = `https://airtable.com/app0Q1UMEdUeWl538/tblR61NG9i0giid28/${value.paymentRecordId}`;
  assert.equal(journals[0].audit_link, paymentAudit);
  assert.ok(rows.every(row => row.invoice_ref.length === 1 && row.invoice_ref[0] === "recInvoice" && row.audit_link === paymentAudit), "both legs link to the payment while retaining their invoice references");
  assert.equal(rows.find((line) => line.account_code === "112.100").credit, "100.00");
  await assert.rejects(sql`update public.journal_entries set description = 'changed' where id = ${journals[0].id}`);
});

test("unfamiliar transaction wording and supplied accounts do not require a new PAY mapping", async () => {
  const transactionType = "Future workflow / client's own transaction name";
  const value = event("recGenericAccounts", "PAY-10", [posting("143.200", "112.200", "12.34")], transactionType);
  await postPayment(sql, value);
  assert.equal((await entries(value.paymentRecordId))[0].transaction_type, transactionType);
  const rows = await lines(value.paymentRecordId);
  assert.equal(rows.find((line) => line.account_code === "143.200").debit, "12.34");
  assert.equal(rows.find((line) => line.account_code === "112.200").credit, "12.34");
  assert.ok(!rows.some((line) => line.account_code === "211.100"), "rule metadata cannot choose another account");
});

test("identical retries and payment-name renames reuse the static journal", async () => {
  const value = event("recDuplicate");
  const first = await postPayment(sql, value);
  const retry = await postPayment(sql, value);
  assert.equal(retry.duplicateCount, 1);
  assert.deepEqual(retry.journalEntryIds, first.journalEntryIds);
  const renamed = copy(value); renamed.paymentName = "Renamed payment";
  assert.equal((await postPayment(sql, renamed)).duplicateCount, 1);
  assert.ok(!(await entries(value.paymentRecordId))[0].description.includes("Renamed"));
});

test("an invoice discount is independent of its triggering payment and deduplicates across payment triggers", async () => {
  const payment = event("recDiscountTrigger");
  await postPayment(sql, payment);
  const value = event(payment.paymentRecordId, "PAY-10", [posting("211.100", "004.011", "2.00", {
    sourceRecordId: "recDiscountLine",
  })], "Early-payment discount taken when paying a vendor");
  value.source = { tableId: "tbldQXuqNEp8G5pfs", recordId: "recDiscountInvoice", recordName: "Test invoice" };
  const first = await postPayment(sql, value);
  assert.equal(first.postedCount, 1);
  assert.equal((await postPayment(sql, value)).duplicateCount, 1);
  const retry = copy(value);
  retry.paymentRecordId = "recOtherDiscountTrigger";
  retry.paymentName = "A different triggering payment";
  retry.referenceNumber = "Another bank reference";
  retry.paymentAmount = "500.00";
  retry.source.recordName = "Renamed invoice";
  const duplicate = await postPayment(sql, retry);
  assert.equal(duplicate.duplicateCount, 1);
  assert.equal(duplicate.paymentRecordId, retry.paymentRecordId);
  assert.deepEqual(duplicate.journalEntryIds, first.journalEntryIds);
  assert.equal((await entries(payment.paymentRecordId)).length, 1, "normal cash settlement remains payment-scoped");
  const [journal] = await entries(value.source.recordId);
  assert.equal(journal.source_table, value.source.tableId);
  assert.equal(journal.source_record_id, value.source.recordId);
  const paymentAudit = `https://airtable.com/app0Q1UMEdUeWl538/tblR61NG9i0giid28/${value.paymentRecordId}`;
  assert.equal(journal.audit_link, paymentAudit, "the first triggering payment remains the audit target on invoice-owned replays");
  assert.equal(journal.external_ref, value.source.recordId);
  assert.match(journal.description, /Test invoice - Trigger payment recDiscountTrigger$/);
  const rows = await lines(value.source.recordId);
  assert.equal(rows.length, 2);
  assert.ok(rows.every(row => row.invoice_ref.length === 1 && row.invoice_ref[0] === value.source.recordId && row.airtable_record_id === "recDiscountLine"));
  assert.ok(rows.every(row => row.audit_link === paymentAudit));
  assert.equal(rows.find(row => row.account_code === "211.100").debit, "2.00");
  assert.equal(rows.find(row => row.account_code === "004.011").credit, "2.00");

  for (const field of ["amount", "invoiceRecordId"]) {
    const changed = copy(retry);
    changed.categories[0].postings[0][field] = field === "amount" ? "3.00" : "recWrongInvoice";
    await failure(changed, field === "amount" ? "23505" : undefined);
  }
  const changedDate = copy(retry); changedDate.entryDate = "2026-10-30"; await failure(changedDate, "23505");
  const changedLine = copy(retry); changedLine.categories[0].postings[0].sourceRecordId = "recDifferentDiscountLine"; await failure(changedLine, "23505");
});

test("legacy invoice audit URLs do not block a retry or rewrite posted history", async () => {
  const invoiceId = "recLegacyAuditInvoice";
  const value = event("recLegacyAuditTrigger", "PAY-10", [posting("211.100", "004.011", "2.00", { invoiceRecordId: invoiceId })]);
  value.source = { tableId: "tbldQXuqNEp8G5pfs", recordId: invoiceId };
  const legacyAudit = `https://airtable.com/app0Q1UMEdUeWl538/tbldQXuqNEp8G5pfs/${invoiceId}`;
  await sql.begin(async tx => {
    const [header] = await tx`insert into public.journal_entries
      (entry_date, rule_code, transaction_type, source_event_type, description, audit_link, source_system, source_table, source_record_id, external_ref)
      values (${value.entryDate}::date, 'PAY-10', ${value.categories[0].transactionType}, 'sent', 'Legacy invoice journal', ${legacyAudit},
        'airtable', ${value.source.tableId}, ${invoiceId}, ${invoiceId}) returning id`;
    await tx`insert into public.journal_lines (entry_id, line_no, account_code, debit, credit, invoice_ref, audit_link)
      values (${header.id}, 1, '211.100', 2.00, 0.00, ${[invoiceId]}, ${legacyAudit}),
        (${header.id}, 2, '004.011', 0.00, 2.00, ${[invoiceId]}, ${legacyAudit})`;
    await tx`update public.journal_entries set status='posted' where id=${header.id}`;
  });
  assert.equal((await postPayment(sql, value)).duplicateCount, 1);
  assert.equal((await entries(invoiceId)).length, 1);
  assert.equal((await entries(invoiceId))[0].audit_link, legacyAudit);
  assert.ok((await lines(invoiceId)).every(row => row.audit_link === legacyAudit));
});

test("concurrent different payment triggers cannot post an invoice discount twice", async () => {
  const value = event("recFirstConcurrentDiscount", "PAY-10", [posting("211.100", "004.011", "1.00")]);
  value.source = { tableId: "tbldQXuqNEp8G5pfs", recordId: "recConcurrentDiscountInvoice" };
  const other = copy(value); other.paymentRecordId = "recSecondConcurrentDiscount";
  const results = await Promise.all([postPayment(sql, value), postPayment(sql, other)]);
  assert.equal(results.reduce((count, result) => count + result.postedCount, 0), 1);
  assert.equal(results.reduce((count, result) => count + result.duplicateCount, 0), 1);
  assert.equal((await entries(value.source.recordId)).length, 1);
});

test("vendor credit applications preserve distinct bill and credit-memo invoice references", async () => {
  for (const owner of ["payment", "bill", "credit"]) {
    const billId = `recAppliedBill-${owner}`, creditId = `recAppliedCredit-${owner}`;
    const value = event(`recCreditApplication-${owner}`, "PAY-11", [posting("211.100", "211.100", "12.34", {
      debitInvoiceRecordId: billId, creditInvoiceRecordId: creditId,
    })], "Bill paid using vendor credits (no cash)");
    if (owner !== "payment") value.source = { tableId: "tbldQXuqNEp8G5pfs", recordId: owner === "bill" ? billId : creditId };
    const first = await postPayment(sql, value);
    assert.equal(first.postedCount, 1);
    assert.equal((await postPayment(sql, value)).duplicateCount, 1);
    const rows = await lines(value.source?.recordId || value.paymentRecordId);
    assert.equal(rows.length, 2);
    const debit = rows.find(row => Number(row.debit) > 0), credit = rows.find(row => Number(row.credit) > 0);
    assert.equal(debit.account_code, "211.100");
    assert.equal(credit.account_code, "211.100");
    assert.deepEqual(debit.invoice_ref, [billId]);
    assert.deepEqual(credit.invoice_ref, [creditId]);
    const paymentAudit = `https://airtable.com/app0Q1UMEdUeWl538/tblR61NG9i0giid28/${value.paymentRecordId}`;
    assert.equal((await entries(value.source?.recordId || value.paymentRecordId))[0].audit_link, paymentAudit);
    assert.equal(debit.audit_link, paymentAudit);
    assert.equal(credit.audit_link, paymentAudit);
    const changed = copy(value); changed.categories[0].postings[0].creditInvoiceRecordId = "recChangedCredit";
    await failure(changed, owner === "credit" ? undefined : "23505");
  }
  const unrelated = event("recUnrelatedApplication", "PAY-11", [posting("211.100", "211.100", "1.00", {
    debitInvoiceRecordId: "recOtherBill", creditInvoiceRecordId: "recOtherCredit",
  })]);
  unrelated.source = { tableId: "tbldQXuqNEp8G5pfs", recordId: "recUnrelatedOwner" };
  await assert.rejects(() => postPayment(sql, unrelated), /invoice source must appear on a posting leg/);
  assert.equal((await entries(unrelated.source.recordId)).length, 0);
});

test("one completed invoice posts its discount and vendor credit atomically and replays them together", async () => {
  const billId = "recCompleteInvoiceSettlement", creditId = "recCompleteInvoiceCredit";
  const value = event("recCompleteInvoiceTrigger", "PAY-10", [posting("211.100", "004.011", "2.00", {
    invoiceRecordId: billId,
  })], "Early-payment discount taken when paying a vendor");
  value.source = { tableId: "tbldQXuqNEp8G5pfs", recordId: billId };
  value.categories.push({ ruleCode: "PAY-11", transactionType: "Bill paid using vendor credits (no cash)", postings: [posting("211.100", "211.100", "12.34", {
    debitInvoiceRecordId: billId, creditInvoiceRecordId: creditId,
  })] });
  const invalid = copy(value);
  invalid.categories[1].postings[0].creditAccount.number = "not-an-account";
  await failure(invalid);
  assert.equal((await entries(billId)).length, 0);

  const first = await postPayment(sql, value);
  assert.equal(first.postedCount, 2);
  const retry = copy(value); retry.paymentRecordId = "recAnotherCompleteInvoiceTrigger";
  const duplicate = await postPayment(sql, retry);
  assert.equal(duplicate.duplicateCount, 2);
  assert.deepEqual(duplicate.journalEntryIds, first.journalEntryIds);
  assert.equal((await entries(billId)).length, 2);
  const rows = await lines(billId);
  assert.equal(rows.length, 4);
  assert.equal(rows.find(row => row.invoice_ref.length === 1 && row.invoice_ref[0] === creditId).credit, "12.34");
  const incomplete = copy(value); incomplete.categories.pop();
  await failure(incomplete, "23505");
});

test("source identity is validated and event names do not select posting behavior", async () => {
  for (const source of [null, [], {}, { tableId: "otherTable", recordId: "recInvalidSource" }, { tableId: "tblR61NG9i0giid28", recordId: "recDifferentPayment" }]) {
    const invalid = event("recSourceValidation"); invalid.source = source;
    await failure(invalid);
  }
  const payment = event("recInvoiceCancellationTrigger");
  payment.source = { tableId: "tblR61NG9i0giid28", recordId: payment.paymentRecordId };
  await postPayment(sql, payment);
  const invoice = event(payment.paymentRecordId, "PAY-10", [posting("211.100", "004.011", "1.00")]);
  invoice.source = { tableId: "tbldQXuqNEp8G5pfs", recordId: "recInvoiceCancellationBoundary" };
  await postPayment(sql, invoice);
  for (const eventType of ["cancelled", "returned", "reconciled"]) {
    const supplied = copy(invoice); supplied.eventType = eventType;
    supplied.source.recordId = `recInvoiceMetadata-${eventType}`;
    assert.equal((await postPayment(sql, supplied)).postedCount, 1);
    assert.equal((await entries(supplied.source.recordId))[0].source_event_type, eventType);
  }
  const cancelled = event(payment.paymentRecordId, "PAY-12", [posting("112.100", "211.100", "7.00")]);
  cancelled.eventType = "cancelled";
  assert.equal((await postPayment(sql, cancelled)).postedCount, 1);
  const paymentJournals = await entries(payment.paymentRecordId);
  assert.equal(paymentJournals.length, 2, "the cancellation category is a separate actual entry");
  assert.ok(paymentJournals.every(journal => journal.reverses_entry_id === null));
  assert.equal((await postPayment(sql, payment)).duplicateCount, 1, "the original settlement is unchanged");
  const invoiceJournals = await entries(invoice.source.recordId);
  assert.equal(invoiceJournals.length, 1, "a supplied payment category does not change invoice-source entries");
  assert.equal(invoiceJournals[0].status, "posted");
});

test("changed financial data, transaction type and Sent category sets conflict", async () => {
  const value = event("recChanged", "PAY-07", [posting("211.100", "112.100", "100.00", { invoiceRecordId: "recInvoice" })]);
  await postPayment(sql, value);
  for (const amount of ["101.00", "0.00"]) {
    const changed = copy(value); changed.categories[0].postings[0].amount = amount;
    await failure(changed, "23505");
  }
  for (const [field, changedValue] of [["invoiceRecordId", "recOther"], ["notes", "Changed audit context"]]) {
    const changed = copy(value); changed.categories[0].postings[0][field] = changedValue;
    await failure(changed, "23505");
  }
  const account = copy(value); account.categories[0].postings[0].debitAccount.number = "143.200"; await failure(account, "23505");
  const type = copy(value); type.categories[0].transactionType = "Changed transaction meaning"; await failure(type, "23505");
  const date = copy(value); date.entryDate = "2026-10-28"; await failure(date, "23505");
  const reference = copy(value); reference.referenceNumber = "Changed"; await failure(reference, "23505");
  const switched = copy(value); switched.categories[0].ruleCode = "PAY-08"; await failure(switched, "23505");
  const extra = copy(value); extra.categories.push({ ruleCode: "PAY-03", transactionType: "Extra category", postings: [posting("112.100", "221.300", "1.00")] });
  await failure(extra, "23505");
  const empty = copy(value); empty.categories = []; await failure(empty, "23505");
  const reconciliation = event(value.paymentRecordId, "PAY-26", [posting("007.002", "112.100", "0.25")], "Reconciliation adjustment");
  reconciliation.eventType = "reconciled";
  await postPayment(sql, reconciliation);
  assert.equal((await postPayment(sql, value)).duplicateCount, 1, "reconciliation is a separate event");
});

test("the 21 current category fixtures preserve Airtable's supplied pairs and amounts", async () => {
  const cases = [
    ["PAY-01", [posting("112.100", "221.100", "1.00")]],
    ["PAY-02", [posting("112.100", "121.100", "1.00")]],
    ["PAY-03", [posting("112.100", "221.300", "1.00")]],
    ["PAY-04", [posting("121.100", "010.001", "0.25")]],
    ["PAY-05", [posting("221.100", "112.100", "1.00")]],
    ["PAY-07", [posting("211.100", "112.100", "1.00")]],
    ["PAY-08", [posting("211.100", "231.100", "1.00")]],
    ["PAY-09", [posting("231.100", "112.100", "1.00")]],
    ["PAY-13", [posting("112.100", "211.100", "1.00")]],
    ["PAY-15", [posting("241.100", "112.100", "1.00"), posting("007.002", "112.100", "0.10")]],
    ["PAY-16", [posting("232.100", "112.100", "1.00"), posting("007.003", "112.100", "0.00")]],
    ["PAY-17", [posting("112.100", "231.200", "1.00")]],
    ["PAY-18", [posting("231.200", "112.100", "1.00"), posting("007.003", "112.100", "0.10")]],
    ["PAY-19", [posting("0747", "112.100", "1.00")]],
    ["PAY-20", [posting("316.100", "112.100", "1.00")]],
    ["PAY-21", [posting("112.100", "311.200", "1.00")]],
    ["PAY-22", [posting("242.100", "112.100", "1.00"), posting("242.200", "112.100", "0.10", { stateCode: "IL" })]],
    ["PAY-23", [posting("112.100", "122.100", "1.00"), posting("004.004", "122.100", "0.10")]],
    ["PAY-24", [posting("143.200", "112.100", "1.00")]],
    ["PAY-26", [posting("007.002", "112.100", "0.25")]],
    ["PAY-27", [posting("231.100", "004.011", "1.00")]],
  ];
  for (const [rule, postings] of cases) {
    const value = event(`recRule-${rule}`, rule, postings, `Airtable category ${rule}`);
    if (rule === "PAY-26") value.eventType = "reconciled";
    const result = await postPayment(sql, value);
    assert.equal(result.postedCount, 1, rule);
    const rows = await lines(value.paymentRecordId);
    const expected = postings.filter((pair) => Number(pair.amount) > 0).flatMap((pair) => [
      { account: pair.debitAccount.number === "0747" ? "112.300" : pair.debitAccount.number, debit: Number(pair.amount), credit: 0 },
      { account: pair.creditAccount.number === "0747" ? "112.300" : pair.creditAccount.number, debit: 0, credit: Number(pair.amount) },
    ]);
    assert.deepEqual(rows.map((row) => ({ account: row.account_code, debit: Number(row.debit), credit: Number(row.credit) })), expected, rule);
    assert.equal((await entries(value.paymentRecordId))[0].transaction_type, value.categories[0].transactionType, rule);
    const [balance] = await sql`select sum(l.debit) = sum(l.credit) as balanced from public.journal_lines l join public.journal_entries e on e.id=l.entry_id where e.source_record_id=${value.paymentRecordId}`;
    assert.equal(balance.balanced, true, rule);
  }
});

test("reconciliation direction and suspense accounts come from the supplied pairs", async () => {
  for (const [id, amount, debit, credit] of [
    ["recAdjustmentPositive", "0.25", "112.100", "007.002"],
    ["recAdjustmentNegative", "0.25", "007.002", "112.100"],
    ["recAdjustmentLarge", "6.00", "112.100", "999.999"],
  ]) {
    const value = event(id, "PAY-26", [posting(debit, credit, amount)], "Reconciliation selected in Airtable"); value.eventType = "reconciled";
    await postPayment(sql, value);
    const rows = await lines(id);
    assert.equal(rows.find((row) => row.account_code === debit).debit, amount);
    assert.equal(rows.find((row) => row.account_code === credit).credit, amount);
  }
});

test("one category keeps multiple invoice allocations and ignores posting ordering on retry", async () => {
  const value = event("recSplit", "PAY-07", [posting("211.100", "112.100", "10.00", { invoiceRecordId: "recA" }), posting("211.100", "112.100", "20.00", { invoiceRecordId: "recB" })]);
  await postPayment(sql, value);
  assert.equal((await entries(value.paymentRecordId)).length, 1);
  assert.equal((await lines(value.paymentRecordId)).length, 4);
  value.categories[0].postings = [posting("211.100", "112.100", "20", { invoiceRecordId: "recB" }), posting("211.100", "112.100", "10.0", { invoiceRecordId: "recA" })];
  assert.equal((await postPayment(sql, value)).duplicateCount, 1);
});

test("zero pairs are no-ops while invalid or missing money and type values fail", async () => {
  const zero = event("recZero", "PAY-07", [{ amount: "0.00" }]);
  assert.equal((await postPayment(sql, zero)).results[0].status, "noop");
  assert.equal((await entries(zero.paymentRecordId)).length, 0);
  for (const amount of ["NaN", "Infinity", "-Infinity", "1e2", "1.001", "", "10000000000000000.00", null, 1]) {
    await failure(event("recBadMoney", "PAY-07", [posting("211.100", "112.100", amount)]));
  }
  const missing = posting(); delete missing.amount; await failure(event("recMissingMoney", "PAY-07", [missing]));
  const type = event("recMissingType"); delete type.categories[0].transactionType; await failure(type);
  const blank = event("recBlankType"); blank.categories[0].transactionType = ""; await failure(blank);
  await failure(event("recUnknownRule", "PAY-UNKNOWN", [posting("211.100", "112.100", "1.00")]));
  for (const entryDate of ["infinity", "2026-02-31", "2026-10-29T00:00:00Z"]) {
    const value = event("recBadDate"); value.entryDate = entryDate; await failure(value);
  }
  const large = event("recMaximumMoney", "PAY-07", [posting("211.100", "112.100", "9999999999999999.99")]);
  await postPayment(sql, large);
  assert.equal((await lines(large.paymentRecordId))[0].debit, "9999999999999999.99");
});

test("signed invoice amounts retain the supplied debit and credit sides and replay safely", async () => {
  const value = { invoiceRecordId: "recSignedInvoice", eventType: "entry_requested", entryDate: "2026-10-29",
    categories: [{ ruleCode: "INV-08", transactionType: "Vendor return credit", postings: [posting("211.100", "131.400", "-125.56")] }] };
  assert.equal((await postPayment(sql, value)).postedCount, 1);
  const rows = await lines(value.invoiceRecordId);
  assert.deepEqual(rows.map(row => [row.account_code, row.debit, row.credit]), [["211.100", "-125.56", "0.00"], ["131.400", "0.00", "-125.56"]]);
  assert.equal((await postPayment(sql, value)).duplicateCount, 1);
  const changed = copy(value); changed.categories[0].postings[0].amount = "125.56";
  await failure(changed, "23505");
  const ledger = await sql`select account_number, offsetting_account_number from public.v_ledger where entry_id=${rows[0].entry_id}`;
  assert.deepEqual(ledger.map(row => [row.account_number, row.offsetting_account_number]).sort(), [["131.400", "211.100"], ["211.100", "131.400"]]);
  const [balance] = await sql`select sum(debit)-sum(credit) as net from public.journal_lines where entry_id=${rows[0].entry_id}`;
  assert.equal(Number(balance.net), 0);
});

test("account identity resolution takes precedence and invalid selected accounts do not post", async () => {
  await sql`update public.accounts set airtable_record_id='recMappedBank' where code='112.100'`;
  const value = event("recMappedBank"); value.categories[0].postings[0].creditAccount = { recordId: "recMappedBank", number: "0747" };
  await postPayment(sql, value);
  assert.equal((await lines(value.paymentRecordId)).find((row) => row.account_code === "112.100").credit, "100.00");
  const bad = event("recUnknownBank"); bad.categories[0].postings[0].creditAccount.number = "missing"; await failure(bad);
  await sql`update public.accounts set active=false where code='112.300'`;
  try {
    const inactive = event("recInactiveBank"); inactive.categories[0].postings[0].creditAccount.number = "0747";
    assert.equal((await postPayment(sql, inactive)).postedCount, 1, "Account active is a label; is_postable controls posting");
    assert.equal((await postPayment(sql, inactive)).duplicateCount, 1);
  }
  finally { await sql`update public.accounts set active=true where code='112.300'`; }
  await sql`update public.accounts set is_postable=false where code='112.300'`;
  try { const blocked = event("recNotPostableBank"); blocked.categories[0].postings[0].creditAccount.number = "0747"; await failure(blocked); }
  finally { await sql`update public.accounts set is_postable=true where code='112.300'`; }
});

test("a later invalid category rolls back all of the payment's journals", async () => {
  const value = event("recAtomic");
  value.categories.push({ ruleCode: "PAY-19", transactionType: "Bad second pair", postings: [posting("missing", "112.100", "1.00")] });
  await failure(value);
  assert.equal((await entries(value.paymentRecordId)).length, 0);
});

test("all linked business references persist as arrays and reordered references replay safely", async () => {
  const references = { vendorRecordIds: ["vendorB", "vendorA"], clientRecordIds: ["clientA", "clientB"],
    staffRecordIds: ["staffA", "staffB"], transactionRecordIds: ["orderB", "orderA"], poRecordIds: ["poA", "poB"],
    invoiceRecordIds: ["invoiceA", "invoiceB"], stateRecordIds: ["stateA", "stateB"], branch: ["Chicago", ""] };
  const value = event("recReferenceArrays", "PAY-07", [posting("211.100", "112.100", "12.34", references)]);
  await postPayment(sql, value);
  const stored = await lines(value.paymentRecordId);
  for (const row of stored) {
    assert.deepEqual(row.vendor_ref, ["vendorA", "vendorB"]); assert.deepEqual(row.customer_ref, ["clientA", "clientB"]);
    assert.deepEqual(row.employee_ref, ["staffA", "staffB"]); assert.deepEqual(row.order_ref, ["orderA", "orderB"]);
    assert.deepEqual(row.po_ref, ["poA", "poB"]); assert.deepEqual(row.invoice_ref, ["invoiceA", "invoiceB"]);
    assert.deepEqual(row.state_ref, ["stateA", "stateB"]); assert.equal(row.branch, null, "Unknown branch does not inherit another invoice's branch");
  }
  const retry = copy(value); retry.categories[0].postings[0].vendorRecordIds = ["vendorA", "vendorB", "vendorA"];
  assert.equal((await postPayment(sql, retry)).duplicateCount, 1);
  const changed = copy(value); changed.categories[0].postings[0].stateRecordIds = ["otherState"];
  await failure(changed, "23505");
  const malformed = copy(value); malformed.paymentRecordId = "recInvalidReferenceArray"; malformed.categories[0].postings[0].vendorRecordIds = "vendorA";
  await failure(malformed, "22023");
});

test("cancel and return insert the supplied actual category without finding or reversing an original", async () => {
  for (const [id, eventType] of [["recCancel", "cancelled"], ["recReturn", "returned"]]) {
    const value = event(id, "PAY-12", [posting("112.100", "211.100", "7.25")], "Actual category supplied by Airtable");
    value.eventType = eventType;
    value.entryDate = "2026-10-30";
    const result = await postPayment(sql, value);
    assert.equal(result.postedCount, 1);
    const journals = await entries(id);
    assert.equal(journals.length, 1);
    assert.equal(journals[0].reverses_entry_id, null);
    assert.equal(journals[0].reversal_reason, null);
    assert.equal(journals[0].transaction_type, value.categories[0].transactionType);
    assert.equal(journals[0].source_event_type, eventType);
    const rows = await lines(id);
    assert.equal(rows.find(row => row.account_code === "112.100").debit, "7.25");
    assert.equal(rows.find(row => row.account_code === "211.100").credit, "7.25");
    assert.equal((await postPayment(sql, value)).duplicateCount, 1);
    const otherEvent = copy(value);
    otherEvent.eventType = eventType === "cancelled" ? "returned" : "cancelled";
    await failure(otherEvent, "23505");
    const changedDate = copy(value); changedDate.entryDate = "2026-10-31"; await failure(changedDate, "23505");
    const changedType = copy(value); changedType.categories[0].transactionType = "Changed category type"; await failure(changedType, "23505");
    const changedAmount = copy(value); changedAmount.categories[0].postings[0].amount = "8.00"; await failure(changedAmount, "23505");
    const empty = copy(value); empty.paymentRecordId = `recEmpty-${eventType}`; empty.categories[0].postings = [];
    assert.equal((await postPayment(sql, empty)).results[0].status, "noop");
    assert.equal((await entries(empty.paymentRecordId)).length, 0);
  }
});

test("historically reversed source journals remain protected from reposting", async () => {
  const value = event("recHistoricalReversal");
  await postPayment(sql, value);
  const [original] = await entries(value.paymentRecordId);
  // Disposable fixture history only: the Edge writer never creates these reversal links.
  const [historical] = await sql`insert into public.journal_entries
    (entry_date, rule_code, source_event_type, description, source_system, source_table, source_record_id, reverses_entry_id)
    values ('2026-10-30', 'PAY-07', 'cancelled', 'Historical fixture', 'airtable', 'tblR61NG9i0giid28', ${value.paymentRecordId}, ${original.id}::uuid)
    returning id`;
  await sql`insert into public.journal_lines (entry_id, line_no, account_code, debit, credit)
    select ${historical.id}::uuid, line_no, account_code, credit, debit from public.journal_lines where entry_id=${original.id}::uuid`;
  await sql`update public.journal_entries set status='posted' where id=${historical.id}::uuid`;
  await failure(value, "23505");
  assert.equal((await entries(value.paymentRecordId)).length, 2);
});

test("a closed accounting period retains a pending request without journal inserts", async () => {
  await sql`insert into public.accounting_periods(period_month,status) values ('2099-01-01','closed') on conflict(period_month) do update set status='closed'`;
  const value = event("recClosed"); value.entryDate = "2099-01-20";
  const held=await postPayment(sql,value);
  assert.equal(held.status,"pending_review");
  assert.equal((await entries(value.paymentRecordId)).length, 0);
});

test("concurrent delivery of the same payment creates exactly one journal", async () => {
  const value = event("recConcurrent");
  const results = await Promise.all([postPayment(sql, value), postPayment(sql, value)]);
  assert.equal(results.reduce((count, result) => count + result.postedCount, 0), 1);
  assert.equal(results.reduce((count, result) => count + result.duplicateCount, 0), 1);
  assert.equal((await entries(value.paymentRecordId)).length, 1);
});

test("the Edge flow never installs a stored posting or mapping function", async () => {
  const [row] = await sql`
    select count(*)::int as count from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('post_airtable_payment','resolve_airtable_ledger_account','create_journal_entry','reverse_journal_entry')
  `;
  assert.equal(row.count, 0);
});
