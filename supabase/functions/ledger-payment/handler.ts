// Authenticated Airtable webhook. The posting module maps and writes the journal.

import type { LedgerPaymentEvent, PostingResult } from "./ledger.ts";
import { PostingError } from "./errors.ts";
import { LedgerWritebackError } from "../_shared/ledger-links.ts";

export interface LedgerEnvironment {
  databaseUrl: string;
  webhookSecret: string;
}

interface LedgerRequest {
  source?: { recordId?: string };
  paymentRecordId?: string;
  invoiceRecordId?: string;
  invoiceLineRecordId?: string;
  depreciationRecordId?: string;
  prepayLogRecordId?: string;
  shippingRecordId?: string;
}

export async function handleRequest<TEvent extends LedgerRequest = LedgerPaymentEvent, TResult = PostingResult>(
  request: Request,
  environment: LedgerEnvironment,
  postEvent: (event: TEvent) => Promise<TResult>,
): Promise<Response> {
  // ==================== AUTHORIZATION ====================
  const { databaseUrl, webhookSecret } = environment;
  if (!databaseUrl || !webhookSecret) {
    return json({ error: "Ledger webhook is not configured." }, 503);
  }
  if (request.headers.get("x-ledger-secret") !== webhookSecret) {
    return json({ error: "Unauthorized." }, 401);
  }

  // ==================== REQUEST ====================
  if (request.method !== "POST") {
    return json({ error: "Use POST." }, 405, { Allow: "POST" });
  }
  let event: unknown;
  try {
    event = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return json({ error: "Request body must be a JSON object." }, 400);
  }

  // ==================== POSTING SERVICE ====================
  const ledgerEvent = event as TEvent;
  try {
    return json(await postEvent(ledgerEvent));
  } catch (error) {
    // ==================== ERRORS ====================
    if (error instanceof LedgerWritebackError) return json({ error: error.message, code: "airtable_writeback_failed", outcome: error.outcome }, 503);
    if (error instanceof PostingError) {
      return json({ error: error.message, code: error.code }, error.code === "23505" ? 409 : 400);
    }
    const code = error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : "";
    if (code === "23505" || code === "P0001" || code.startsWith("22") || code.startsWith("23")) {
      // Driver messages can contain database internals; only owned PostingErrors expose their text.
      return json({ error: "Journal data was rejected by the database.", code }, code === "23505" ? 409 : 400);
    }
    const sourceId = ledgerEvent.source?.recordId ?? ledgerEvent.invoiceLineRecordId ?? ledgerEvent.depreciationRecordId ?? ledgerEvent.prepayLogRecordId ?? ledgerEvent.shippingRecordId ?? ledgerEvent.invoiceRecordId ?? ledgerEvent.paymentRecordId;
    console.error("Ledger posting failed.", {
      code: /^[A-Z0-9_]{1,40}$/.test(code) ? code : "UNKNOWN",
      sourceRecordId: typeof sourceId === "string" && /^rec[A-Za-z0-9]{14}$/.test(sourceId) ? sourceId : undefined,
    });
    return json({ error: "Ledger database is unavailable. Retry the same event." }, 503);
  }
}

// ==================== RESPONSE HELPER ====================
function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}
