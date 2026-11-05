import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Middleware does the live Auth/allowlist check; reads also verify the signed JWT locally.
const reportContext = cache(async () => {
  const client = await createClient();
  const { data, error } = await client.auth.getClaims();
  if (error || !data?.claims?.sub) throw new Error("Sign in to load reports.");
  const user = { id: data.claims.sub, email: data.claims.email as string | undefined };
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
