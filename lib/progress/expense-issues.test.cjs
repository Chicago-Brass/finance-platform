const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const ts = require("typescript");

const code = ts.transpileModule(readFileSync(join(__dirname, "../../app/api/maintenance/issues/route.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function route({ enabled = true, signedIn = true, result = { data: { notes: "Checked" } } } = {}) {
  const calls = [];
  const query = {
    update(data) { calls.push(["update", data]); return this; },
    eq(field, value) { calls.push([field, value]); return this; },
    select() { return this; },
    async maybeSingle() { return result; },
    async order() { return { data: [{ id: "expense-issue", notes: "Checked" }] }; },
  };
  const dependencies = {
    "@/lib/progress/expense-issues": { expenseMaintenanceEnabled: () => enabled, ISSUE_NOTE_LIMIT: 4000 },
    "@/lib/reports/report-session": {
      async reportUser() { if (!signedIn) throw Error("Sign in"); },
      ledgerRead: callback => callback({ from(table) { calls.push(["table", table]); return query; } }),
    },
  };
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)(name => dependencies[name], loaded, loaded.exports);
  return { ...loaded.exports, calls };
}

function patch(body, origin = "https://example.test") {
  return new Request("https://example.test/api/maintenance/issues", {
    method: "PATCH", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

test("expense issues stay staging-only and require a signed-in session", async () => {
  assert.equal((await route({ enabled: false }).GET()).status, 404);
  assert.equal((await route({ signedIn: false }).GET()).status, 401);
  const response = await route().GET();
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.deepEqual(await response.json(), [{ id: "expense-issue", notes: "Checked" }]);
});

test("note saves update the selected issue only when its prior note still matches", async () => {
  const input = { id: "expense-issue", notes: "Checked", previous: "" };
  const api = route();
  assert.equal((await api.PATCH(patch(input, "https://elsewhere.test"))).status, 403);
  assert.equal((await api.PATCH(patch({ ...input, notes: "x".repeat(4001) }))).status, 400);
  assert.deepEqual(api.calls, []);
  assert.deepEqual(await (await api.PATCH(patch(input))).json(), { notes: "Checked" });
  assert.deepEqual(api.calls, [["table", "expense_maintenance_issues"], ["update", { notes: "Checked" }], ["id", "expense-issue"], ["notes", ""]]);
  assert.equal((await route({ result: { data: null } }).PATCH(patch(input))).status, 409);
});
