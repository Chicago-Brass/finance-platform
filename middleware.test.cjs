const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function setup(pathname = "/income-statement?year=2026") {
  const user = deferred();
  const role = deferred();
  const calls = [];
  const requestCookies = new Map();
  const request = {
    nextUrl: Object.assign(new URL(pathname, "https://finance.example"), {
      clone() { return new URL(this); },
    }),
    cookies: {
      getAll: () => [...requestCookies].map(([name, value]) => ({ name, value })),
      set: (name, value) => requestCookies.set(name, value),
    },
  };
  let cookieAdapter;
  const module = { exports: {} };
  const imports = {
    "@supabase/ssr": {
      createServerClient: (_url, _key, { cookies }) => {
        cookieAdapter = cookies;
        return {
          auth: { getUser: () => { calls.push("user"); return user.promise; } },
          rpc: (name) => { calls.push(name); return role.promise; },
        };
      },
    },
    "next/server": {
      NextResponse: {
        next: ({ request }) => ({ type: "next", request, cookies: new Map() }),
        redirect: (url) => ({ type: "redirect", url }),
        json: (body, { status }) => ({ type: "json", body, status }),
      },
    },
    "@/lib/supabase/config": { supabaseConfig: () => ({ url: "https://example.supabase.co", key: "public-key" }) },
  };
  const source = ts.transpileModule(fs.readFileSync(`${__dirname}/middleware.ts`, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", source)((name) => imports[name], module, module.exports);
  const result = module.exports.middleware(request);
  return { user, role, calls, result, requestCookies, refresh: (cookies) => cookieAdapter.setAll(cookies) };
}

test("protected middleware starts both checks and waits for both in either completion order", async () => {
  for (const first of ["user", "role"]) {
    const run = setup();
    assert.deepEqual(run.calls, ["user", "current_app_role"]);
    let settled = false;
    run.result.then(() => { settled = true; });
    const resolveUser = () => run.user.resolve({ data: { user: { id: "approved-user" } } });
    const resolveRole = () => run.role.resolve({ data: "admin", error: null });
    (first === "user" ? resolveUser : resolveRole)();
    await new Promise(setImmediate);
    assert.equal(settled, false);
    (first === "user" ? resolveRole : resolveUser)();
    assert.equal((await run.result).type, "next");
  }
});

test("protected middleware requires a validated user and a successful nonempty role", async () => {
  for (const [user, role, destination] of [
    [null, { data: "admin", error: null }, "/"],
    [{ id: "user" }, { data: null, error: null }, "/not-authorized"],
    [{ id: "user" }, { data: "admin", error: { message: "failed" } }, "/not-authorized"],
  ]) {
    const run = setup();
    run.user.resolve({ data: { user } });
    run.role.resolve(role);
    const result = await run.result;
    assert.equal(result.type, "redirect");
    assert.equal(result.url.pathname, destination);
    assert.equal(result.url.search, "");
  }
});

test("public paths still validate sessions without requesting an allowlist role", async () => {
  for (const pathname of ["/", "/login", "/auth/callback", "/not-authorized", "/auth/callback/complete"]) {
    for (const user of [null, { id: "user" }]) {
      const run = setup(pathname);
      assert.deepEqual(run.calls, ["user"]);
      run.user.resolve({ data: { user } });
      assert.equal((await run.result).type, "next");
    }
  }
});

test("report API failures return sanitized JSON instead of page redirects", async () => {
  for (const [user, role, status, error] of [
    [null, { data: "admin", error: null }, 401, "Sign in to load reports."],
    [{ id: "user" }, { data: null, error: null }, 403, "You do not have access to reports."],
    [{ id: "user" }, { data: "admin", error: { message: "private database detail" } }, 403, "You do not have access to reports."],
  ]) {
    const run = setup("/api/reports/data?report=income-statement");
    assert.deepEqual(run.calls, ["user", "current_app_role"]);
    run.user.resolve({ data: { user } });
    run.role.resolve(role);
    assert.deepEqual(await run.result, { type: "json", body: { error }, status });
  }
});

test("authorized report API requests continue through middleware", async () => {
  const run = setup("/api/reports/data");
  run.user.resolve({ data: { user: { id: "user" } } });
  run.role.resolve({ data: "admin", error: null });
  assert.equal((await run.result).type, "next");
});

test("session refresh cookies still reach the forwarded request and response", async () => {
  const run = setup();
  run.refresh([{ name: "session", value: "refreshed", options: { httpOnly: true } }]);
  run.user.resolve({ data: { user: { id: "user" } } });
  run.role.resolve({ data: "admin", error: null });
  const result = await run.result;
  assert.equal(run.requestCookies.get("session"), "refreshed");
  assert.equal(result.cookies.get("session"), "refreshed");
});
