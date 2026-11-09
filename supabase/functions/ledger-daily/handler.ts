import type { TestOptions } from "./test-mode.ts";
import { SyncBusyError } from "./run-lock.ts";
import { initialState } from "./runner.ts";
import type { RunState } from "./types.ts";
export interface DailyEnvironment {
    databaseUrl: string;
    webhookSecret: string;
    airtableToken: string;
}
export interface DailyOptions {
    runKey: string;
    state: RunState;
    maxRecords: number;
}
export async function handleDailyRequest(request: Request, env: DailyEnvironment, execute: (options: DailyOptions) => Promise<unknown>, preview?: (options: TestOptions) => Promise<unknown>): Promise<Response> {
    if (!env.webhookSecret || !env.airtableToken)
        return json({ error: "Daily ledger worker is not configured." }, 503);
    if (request.headers.get("x-ledger-secret") !== env.webhookSecret)
        return json({ error: "Unauthorized." }, 401);
    if (request.method !== "POST")
        return json({ error: "Use POST." }, 405);
    let input: any;
    try {
        input = await request.json();
    }
    catch {
        return json({ error: "Request must contain JSON." }, 400);
    }
    if (!input || typeof input !== "object" || Array.isArray(input))
        return json({ error: "Request must be an object." }, 400);
    const test = input.test === undefined ? false : input.test;
    const dryRun = input.dryRun === undefined ? true : input.dryRun, codes = input.categoryCodes === undefined ? [] : input.categoryCodes, maxRecords = input.maxRecords === undefined ? 25 : input.maxRecords;
    if (typeof test !== "boolean" || typeof dryRun !== "boolean" || !Array.isArray(codes) || codes.length > 60 || !codes.every(c => typeof c === "string") || !Number.isInteger(maxRecords) || maxRecords < 1 || maxRecords > 50)
        return json({ error: "Use boolean test/dryRun, up to 60 string categoryCodes, and maxRecords from 1 to 50." }, 400);
    const sorted = [...new Set(codes as string[])].sort();
    const runKey = input.runKey ?? crypto.randomUUID();
    if (typeof runKey !== "string" || !/^[A-Za-z0-9:,_-]{1,250}$/.test(runKey))
        return json({ error: "Invalid runKey." }, 400);
    let state: RunState;
    try {
        state = initialState(sorted, test ? true : dryRun);
    }
    catch (error) {
        return json({ error: (error as Error).message }, 400);
    }
    try {
        if (test) {
            if (!preview) return json({error: "Test mode is not configured."}, 503);
            return json(await preview({categoryCodes: sorted, maxRecords, cursor: input.cursor}));
        }
        if (input.cursor !== undefined) return json({error: "A test cursor requires test:true."}, 400);
        if (!env.databaseUrl) return json({error: "Daily ledger worker database is not configured."}, 503);
        const result = await execute({ runKey, state, maxRecords });
        return json({ ...result as object, requestForResume: (result as {
                done?: boolean;
            }).done ? null : { runKey, categoryCodes: sorted, dryRun, maxRecords } }, (result as {
            busy?: boolean;
        }).busy ? 409 : 200);
    }
    catch (error) {
        if (error instanceof RangeError) return json({error:error.message},400);
        if (test) return json({error:"Test preview could not finish. Retry the same test request; nothing was posted."},503);
        if (error instanceof SyncBusyError)
            return json({ status: "running", runKey: error.runKey, message: "A ledger sync is already unfinished. Resume that run instead of starting another." }, 409);
        console.error("Daily ledger worker paused after an error.", { runKey, error: error instanceof Error ? error.message : "Unknown error" });
        return json({ error: "Daily ledger run could not finish. Retry with the same runKey and options.", runKey }, 503);
    }
}
function json(value: unknown, status = 200) { return Response.json(value, { status, headers: { "Cache-Control": "no-store" } }); }
