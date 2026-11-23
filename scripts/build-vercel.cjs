const { spawnSync } = require("node:child_process");

const env = { ...process.env };
if (env.VERCEL_ENV === "preview" && env.VERCEL_GIT_COMMIT_REF === "develop") {
  env.NEXT_PUBLIC_SUPABASE_URL = "https://vaaykmqshkuunewjrxuy.supabase.co";
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_6KKxj9w3TcY4Ntf7PPgLUw_7TLNxzEe";
}

const result = spawnSync("npm", ["run", "build"], { env, stdio: "inherit" });
process.exitCode = result.status ?? 1;
