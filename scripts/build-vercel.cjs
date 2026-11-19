const { spawnSync } = require("node:child_process");

const env = { ...process.env };
if (env.VERCEL_ENV === "preview" && env.VERCEL_GIT_COMMIT_REF === "staging") {
  env.NEXT_PUBLIC_SUPABASE_URL = "https://yiuzyntqddjriaflwgcc.supabase.co";
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_5Wkf_wuVmtMHQy7F2g7RXw_ZYo9UqeV";
}

const result = spawnSync("npm", ["run", "build"], { env, stdio: "inherit" });
process.exitCode = result.status ?? 1;
