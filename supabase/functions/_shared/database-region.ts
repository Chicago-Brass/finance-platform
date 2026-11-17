// Both finance databases are in Oregon; keep the transaction's many round trips local.
const DATABASE_REGION = "us-west-2";

export async function inDatabaseRegion(
  request: Request,
  functionName: "ledger-daily" | "ledger-payment" | "ledger-reversal",
  environment: { projectUrl: string; executionRegion: string; webhookSecret: string },
  handle: (request: Request) => Promise<Response>,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (!environment.projectUrl || !environment.executionRegion || environment.executionRegion === DATABASE_REGION
    || request.method !== "POST" || !environment.webhookSecret
    || request.headers.get("x-ledger-secret") !== environment.webhookSecret) return handle(request);

  // An explicitly routed request must never bounce between regions.
  if (request.headers.get("x-region") === DATABASE_REGION) return unavailable();
  const url = new URL(`/functions/v1/${functionName}`, environment.projectUrl);
  url.searchParams.set("forceFunctionRegion", DATABASE_REGION);
  const headers = new Headers(request.headers);
  headers.set("x-region", DATABASE_REGION);
  headers.delete("host");
  headers.delete("content-length");
  try {
    return await fetcher(url, { method: "POST", headers, body: request.body, duplex: "half", redirect: "error", signal: AbortSignal.timeout(110_000) } as RequestInit);
  } catch {
    // No retry here: a lost response may already have posted. Reuse the caller's run key.
    return unavailable();
  }
}

function unavailable() {
  return Response.json({ error: "Ledger region could not be reached. Retry the same request and runKey." }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
