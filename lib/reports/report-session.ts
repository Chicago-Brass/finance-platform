import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// One Auth check per request, shared by the report layout and every ledger read.
const reportContext = cache(async () => {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Sign in to load reports.");
  return { client, user };
});

export async function reportUser() {
  return (await reportContext()).user;
}

/**
 * Runs a ledger read as the signed-in user, after the request's Auth check. Results are not cached
 * on the server: the browser's router cache makes revisits instant, and a reload or Refresh data
 * always reads the latest postings.
 */
export async function ledgerRead<T>(read: (client: Awaited<ReturnType<typeof createClient>>) => Promise<T>): Promise<T> {
  const { client } = await reportContext();
  return read(client);
}
