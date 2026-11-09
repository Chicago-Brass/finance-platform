import type { AccountActivityParts, DrillRange } from "./account-activity";

export type AccountActivityCache = Map<string, AccountActivityParts[keyof AccountActivityParts]>;

/** The owning report keeps this cache only until its data/range changes or it unmounts. */
export async function readAccountActivity<K extends keyof AccountActivityParts>(
  cache: AccountActivityCache, input: DrillRange & { account: string }, section: K, signal: AbortSignal,
): Promise<AccountActivityParts[K]> {
  const { branch, ...range } = input;
  const params = new URLSearchParams({ ...range, ...(branch ? { branch } : {}), section });
  const key = params.toString();
  if (cache.has(key)) return cache.get(key) as AccountActivityParts[K];
  const response = await fetch(`/api/reports/account-activity?${params}`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("Account details could not be loaded.");
  const data: AccountActivityParts[K] = await response.json();
  if (!signal.aborted) cache.set(key, data);
  return data;
}
