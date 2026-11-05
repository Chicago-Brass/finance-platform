type ReportEntry =
  | { status: "ready"; data: unknown; expires: number }
  | { status: "pending"; promise: Promise<unknown> };

export type ReportCache = Map<string, ReportEntry>;

export class ReportRequestError extends Error {
  constructor(public readonly status: number) {
    super(`Report request failed (${status}).`);
    this.name = "ReportRequestError";
  }
}

const CACHE_MS = 5 * 60 * 1000;
const MAX_READY = 32;

export function cachedReport<T>(cache: ReportCache, url: string): T | undefined {
  const entry = cache.get(url);
  if (entry?.status !== "ready") return undefined;
  if (entry.expires <= Date.now()) {
    cache.delete(url);
    return undefined;
  }
  return entry.data as T;
}

export function readReport<T>(cache: ReportCache, url: string, onPending?: (delta: number) => void): Promise<T> {
  const data = cachedReport<T>(cache, url);
  if (data !== undefined) return Promise.resolve(data);
  const existing = cache.get(url);
  if (existing?.status === "pending") return existing.promise as Promise<T>;

  onPending?.(1);
  const entry: ReportEntry = {
    status: "pending",
    promise: fetch(url, { cache: "no-store", credentials: "same-origin", headers: { Accept: "application/json" } })
      .then(response => {
        if (!response.ok) throw new ReportRequestError(response.status);
        return response.json();
      })
      .then(data => {
        // Refresh can replace this request while its network response is still in flight.
        if (cache.get(url) === entry) {
          cache.set(url, { status: "ready", data, expires: Date.now() + CACHE_MS });
          let ready = 0;
          for (const value of cache.values()) if (value.status === "ready") ready++;
          for (const [key, value] of cache) {
            if (ready <= MAX_READY) break;
            if (value.status === "ready") { cache.delete(key); ready--; }
          }
        }
        return data;
      })
      .catch(error => {
        if (cache.get(url) === entry) cache.delete(url);
        throw error;
      })
      .finally(() => onPending?.(-1)),
  };
  cache.set(url, entry);
  return entry.promise as Promise<T>;
}
