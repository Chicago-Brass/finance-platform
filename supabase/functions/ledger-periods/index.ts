import postgres from "npm:postgres@3.4.9";
import { changePeriod, reviewRequest, completeWriteback } from "./service.ts";
import { PostingError } from "../ledger-payment/errors.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, {
  prepare: false,
  max: 1,
  idle_timeout: 20,
  ssl: { rejectUnauthorized: true },
});
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { ...cors, "Cache-Control": "no-store" },
  });

// ==================== AUTHENTICATION ====================
Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response(null, { headers: cors });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer "))
    return json({ error: "Sign in to manage periods." }, 401);
  try {
    const auth = await fetch(`${url}/auth/v1/user`, {
      headers: { authorization, apikey: anon },
    });
    if (!auth.ok) return json({ error: "Sign in to manage periods." }, 401);
    const user = await auth.json();
    if (!user.email)
      return json({ error: "An approved account is required." }, 403);
    const body = await request.json();
    // Permission is checked again inside the transaction, against the live user record.
    if (body.action === "open" || body.action === "close")
      return json(
        await changePeriod(
          sql,
          user.email,
          body.action,
          body.month,
          body.reason,
          body.deferPending === true,
        ),
      );
    if (body.action === "approve" || body.action === "reject") {
      const result = await reviewRequest(
        sql,
        user.email,
        body.requestId,
        body.action,
        body.reason,
      );
      return json(
        await completeWriteback(
          sql,
          result,
          Deno.env.get("AIRTABLE_PAT") ?? "",
        ),
      );
    }
    return json({ error: "Unknown period action." }, 400);
  } catch (error) {
    if (error instanceof PostingError)
      return json(
        { error: error.message },
        error.code === "42501" ? 403 : error.code === "23505" ? 409 : 400,
      );
    if (error instanceof SyntaxError)
      return json({ error: "Request must contain valid JSON." }, 400);
    console.error("Period action failed.", {
      code:
        error && typeof error === "object" && "code" in error
          ? error.code
          : "UNKNOWN",
    });
    return json(
      { error: "The action could not be completed. Refresh and retry." },
      503,
    );
  }
});
