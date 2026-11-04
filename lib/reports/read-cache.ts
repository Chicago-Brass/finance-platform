import { createHash } from "node:crypto";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// One Auth check per request, shared by the report layout and every ledger read.
const reportContext = cache(async () => {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Sign in to load reports.");
  const { data: { session } } = await client.auth.getSession();
  if (!session) throw new Error("Sign in to load reports.");
  // Never share cached RLS results across sessions or put a raw token in a cache key.
  const scope = createHash("sha256").update(session.access_token).digest("hex");
  return { client, scope, user };
});

export async function reportUser() {
  return (await reportContext()).user;
}

/** Session-scoped read cache. Slow-changing catalog reads may pass a longer revalidate window. */
export async function cachedLedgerRead<T>(key: string[], read: (client: Awaited<ReturnType<typeof createClient>>) => Promise<T>, revalidate = 30): Promise<T> {
  const { client, scope } = await reportContext();
  return unstable_cache(() => read(client), ["ledger-read-v1", scope, ...key], { revalidate })();
}
