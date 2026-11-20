const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const ts = require("typescript");

const code = ts.transpileModule(readFileSync(join(__dirname, "../../app/api/maintenance/issues/route.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function route({ enabled = true, signedIn = true, result = { data: { reviewed: true, resolved: true } }, noteResult = { data: "Earlier note\n\n[Nov 12, 12:03PM]\nChecked" } } = {}) {
  const calls = [];
  const query = {
    update(data) { calls.push(["update", data]); return this; },
    eq(field, value) { calls.push([field, value]); return this; },
    select() { return this; },
    async maybeSingle() { return result; },
    async order() { return { data: [
      { id: "expense-issue", category: "expense", notes: "Checked", resolved: false, rule_codes: ["EXP-33"] },
      { id: "invoice-issue", category: "invoice_entry", notes: "", resolved: false, rule_codes: ["INV-03"] },
      { id: "payment-issue", category: "payment", notes: "", resolved: false, rule_codes: ["PAY-02"] },
    ] }; },
  };
  const catalog = { select() { return this; }, in(field, values) { calls.push([field, values]); return this; }, async is() {
    return { data: [
      { category: "expense", display_code: "EXP-33", trigger_name: "AP Sales Tax Invoice", source_label: "Invoices" },
      { category: "invoice_entry", display_code: "INV-03", trigger_name: "Shipment against client deposit", source_label: "Shipping Records" },
      { category: "payment", display_code: "PAY-02", trigger_name: "Vendor payment returned", source_label: "Payments" },
    ] };
  } };
  const dependencies = {
    "@/lib/progress/expense-issues": { expenseMaintenanceEnabled: () => enabled, ISSUE_NOTE_LIMIT: 4000, ISSUE_CATEGORY_LABELS: { expense: "Expenses", invoice_entry: "Invoice Entry", payment: "Payments" } },
    "@/lib/reports/report-session": {
      async reportUser() { if (!signedIn) throw Error("Sign in"); },
      ledgerRead: callback => callback({
        from(table) { calls.push(["table", table]); return table === "ledger_rules" ? catalog : query; },
        async rpc(name, args) { calls.push([name, args]); return noteResult; },
      }),
    },
  };
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)(name => dependencies[name], loaded, loaded.exports);
  return { ...loaded.exports, calls };
}

function write(method, body, origin = "https://example.test") {
  return new Request("https://example.test/api/maintenance/issues", {
    method, headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

test("staging-only review issues include category and trigger labels after sign-in", async () => {
  assert.equal((await route({ enabled: false }).GET()).status, 404);
  assert.equal((await route({ signedIn: false }).GET()).status, 401);
  const response = await route().GET();
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.deepEqual(await response.json(), [
    { id: "expense-issue", category: "expense", notes: "Checked", resolved: false, rules: [{ code: "EXP-33", trigger: "AP Sales Tax Invoice", source: "Invoices" }] },
    { id: "invoice-issue", category: "invoice_entry", notes: "", resolved: false, rules: [{ code: "INV-03", trigger: "Shipment against client deposit", source: "Shipping Records" }] },
    { id: "payment-issue", category: "payment", notes: "", resolved: false, rules: [{ code: "PAY-02", trigger: "Vendor payment returned", source: "Payments" }] },
  ]);
});

test("note saves append only the new note and return current history", async () => {
  const input = { id: "expense-issue", note: " Checked " };
  const api = route();
  assert.equal((await api.POST(write("POST", input, "https://elsewhere.test"))).status, 403);
  assert.equal((await route({ signedIn: false }).POST(write("POST", input))).status, 401);
  assert.equal((await api.POST(write("POST", { ...input, note: "  " }))).status, 400);
  assert.equal((await api.POST(write("POST", { ...input, note: "x".repeat(4001) }))).status, 400);
  assert.deepEqual(api.calls, []);
  assert.deepEqual(await (await api.POST(write("POST", input))).json(), {
    notes: "Earlier note\n\n[Nov 12, 12:03PM]\nChecked",
  });
  assert.deepEqual(api.calls, [["append_expense_issue_note", { issue_id: "expense-issue", note_text: "Checked" }]]);
  assert.equal((await route({ noteResult: { data: null } }).POST(write("POST", input))).status, 404);
});

test("review and resolution update only the requested status and resolution requires review", async () => {
  const input = { id: "expense-issue", resolved: true };
  const api = route();
  assert.equal((await api.PATCH(write("PATCH", { ...input, resolved: "true" }))).status, 400);
  assert.deepEqual(await (await api.PATCH(write("PATCH", input))).json(), { reviewed: true, resolved: true });
  assert.deepEqual(api.calls, [["table", "expense_maintenance_issues"], ["update", { resolved: true }], ["id", "expense-issue"], ["reviewed", true]]);
  assert.equal((await route({ result: { data: null } }).PATCH(write("PATCH", input))).status, 409);
  const review = route({ result: { data: { reviewed: true, resolved: false } } });
  assert.equal((await review.PATCH(write("PATCH", { id: input.id, reviewed: true, resolved: true }))).status, 400);
  assert.deepEqual(await (await review.PATCH(write("PATCH", { id: input.id, reviewed: true }))).json(), { reviewed: true, resolved: false });
  assert.deepEqual(review.calls, [["table", "expense_maintenance_issues"], ["update", { reviewed: true }], ["id", "expense-issue"]]);
});

test("reviewed cards stay in their category while resolved cards appear below all open categories", () => {
  const component = ts.transpileModule(readFileSync(join(__dirname, "../../components/ExpenseIssues.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const fixture = { rules: [], context: "Decision needed\n\nCheck the bank statement.", finding: "Example", recommendation: "Review", examples: [], notes: "" };
  const data = [
    { ...fixture, id: "resolved", title: "Resolved expense", category: "expense", reviewed: true, resolved: true },
    { ...fixture, id: "reviewed", title: "Reviewed expense", category: "expense", reviewed: true, resolved: false },
    { ...fixture, id: "open", title: "Open payment", category: "payment", reviewed: false, resolved: false },
  ];
  const dependencies = {
    "@/lib/progress/expense-issues": { ISSUE_CATEGORY_LABELS: { expense: "Expenses", payment: "Payments" } },
    "./ReportData": { useReportQuery: () => ({ data }) },
    "./MaintenanceTabs": { MaintenanceTabs: () => null },
    "./ReportPageHeader": { ReportPageHeader: () => null },
    "./ReportIcons": {},
    "./ledger-table-utils": {},
  };
  const loaded = { exports: {} };
  new Function("require", "module", "exports", component)(name => dependencies[name] ?? require(name), loaded, loaded.exports);
  const html = require("react-dom/server").renderToStaticMarkup(require("react").createElement(loaded.exports.ExpenseIssues));
  assert.match(html, /is-reviewed.*?Reviewed expense.*?Mark as resolved.*?Issue type.*?Decision needed/);
  assert.match(html, /Open payment.*?Mark as reviewed/);
  assert.match(html, /Resolved issues.*?is-resolved.*?Resolved expense.*?Reopen issue/);
  assert(html.indexOf("Reviewed expense") < html.indexOf("Open payment"));
  assert(html.indexOf("Open payment") < html.indexOf("Resolved issues"));
});
