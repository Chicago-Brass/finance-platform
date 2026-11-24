import type { TestOptions } from "./test-mode.ts";
import { SyncBusyError } from "./run-lock.ts";
import { initialState } from "./runner.ts";
import { syncDateRange } from "./scope.ts";
import { invoiceWorkerFields, LOAN_RECORDS, POSTING_FIELDS } from "./definitions.ts";
import type { RunState, SyncSource, SyncDateRange } from "./types.ts";
export interface DailyEnvironment {
    databaseUrl: string;
    webhookSecret: string;
    airtableToken: string;
    repostEnabled?: boolean;
}
export interface DailyOptions {
    runKey: string;
    state: RunState;
    maxRecords: number;
}
type QueuedRepost = { id: string; ruleCode: string; repostOn: string };

export async function handleDailyRequest(request: Request, env: DailyEnvironment, execute: (options: DailyOptions) => Promise<unknown>, preview?: (options: TestOptions) => Promise<unknown>, resolveRules?: (codes: string[]) => Promise<string[]>, enqueueReposts?: (source: SyncSource) => Promise<QueuedRepost[]>): Promise<Response> {
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
    if (input.rules !== undefined && (input.categoryCodes !== undefined || !Array.isArray(input.rules) || input.rules.length < 1 || input.rules.length > 60 || !input.rules.every((code: unknown) => typeof code === "string" && code.length > 0 && code.length <= 32)))
        return json({error:"Use rules as a nonempty array of up to 60 grouped codes; do not combine it with categoryCodes."},400);
    const requestedRules: string[] | undefined = input.rules === undefined ? undefined : [...new Set<string>(input.rules)].sort();
    let source: SyncSource | undefined;
    if (input.source !== undefined) {
        if (!input.source || typeof input.source !== "object" || Array.isArray(input.source)
            || typeof input.source.tableId !== "string" || !Object.hasOwn(POSTING_FIELDS, input.source.tableId)
            || typeof input.source.recordId !== "string" || !/^rec[A-Za-z0-9]{14}$/.test(input.source.recordId))
            return json({ error: "source requires a supported FIN tableId and Airtable recordId." }, 400);
        source = { tableId: input.source.tableId, recordId: input.source.recordId };
    }
    if (input.enqueueRepost !== undefined) {
        if (input.enqueueRepost !== true || !source || Object.keys(input).some(key => !["enqueueRepost", "source"].includes(key)) ||
            (source.tableId !== invoiceWorkerFields.TABLES.invoices && source.tableId !== LOAN_RECORDS.table)) {
            return json({ error: "Queue Repost requires one FIN Invoice or Loan Record." }, 400);
        }
        if (!env.repostEnabled) return json({ error: "Reposting is disabled in this environment." }, 409);
        if (!enqueueReposts) return json({ error: "The ledger repost queue is not configured." }, 503);
        try {
            const requests = await enqueueReposts(source);
            if (!requests.length) return json({ error: "Reverse a current journal before queuing its replacement." }, 409);
            return json({ repostOn: requests.map(row => row.repostOn).sort()[0], requests }, 202);
        } catch (error) {
            console.error("Ledger repost could not be queued.", { source, error: error instanceof Error ? error.message : "Unknown error" });
            return json({ error: "Could not queue the ledger repost. Try again." }, 503);
        }
    }
    let dateRange: SyncDateRange | undefined;
    if (input.fromDate !== undefined || input.toDate !== undefined) {
        const defaults = syncDateRange(), from = input.fromDate ?? defaults.from, to = input.toDate ?? defaults.to;
        const validDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
            && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
        if (!validDate(from) || !validDate(to) || from > to)
            return json({ error: "Use valid YYYY-MM-DD fromDate/toDate values, with fromDate no later than toDate." }, 400);
        dateRange = { from, to };
    }
    let createdFrom: string | undefined;
    if (input.createdFrom !== undefined) {
        const value = input.createdFrom;
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
            || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,19) !== value.slice(0,19))
            return json({error: "createdFrom must be a valid ISO UTC timestamp."}, 400);
        createdFrom = new Date(value).toISOString();
    }
    let sorted = [...new Set(codes as string[])].sort();
    const runKey = input.runKey ?? crypto.randomUUID();
    if (typeof runKey !== "string" || !/^[A-Za-z0-9:,_-]{1,250}$/.test(runKey))
        return json({ error: "Invalid runKey." }, 400);
    const repostId = input.repostId;
    if (repostId !== undefined && (typeof repostId !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(repostId)
        || !source || test || dryRun || (requestedRules ?? sorted).length !== 1 || input.runKey !== repostId || createdFrom)) {
        return json({ error: "A repost requires one source and one rule, dryRun:false, and the same UUID for repostId and runKey." }, 400);
    }
    if (repostId !== undefined && !env.repostEnabled) return json({error:"Explicit reposts are not enabled in this environment."},409);
    let state: RunState;
    try {
        if (requestedRules) {
            if (!resolveRules || !env.databaseUrl) return json({error:"Grouped rule lookup is not configured."},503);
            sorted = [...new Set(await resolveRules(requestedRules))].sort();
            if (!sorted.length) throw new RangeError("No matching grouped rules.");
        }
        state = initialState(sorted, test ? true : dryRun, source, dateRange, createdFrom);
        if (repostId !== undefined) {
            if (state.categoryIds.length !== 1) throw new RangeError("The rule does not own this source table.");
            state.repostId = repostId.toLowerCase();
        }
    }
    catch (error) {
        if (error instanceof RangeError || !requestedRules) return json({ error: (error as Error).message }, 400);
        return json({error:"Grouped rule lookup could not finish; nothing was posted."},503);
    }
    try {
        if (test) {
            if (!preview) return json({error: "Test mode is not configured."}, 503);
            const result = await preview({categoryCodes: sorted, maxRecords, ...(createdFrom ? { createdFrom } : {}), ...(source ? { source } : {}), ...(dateRange ? { dateRange } : {}), cursor: input.cursor});
            const resume = (result as {requestForResume?: Record<string,unknown> | null}).requestForResume;
            if (requestedRules && resume) {
                const {categoryCodes: _codes, ...continuation} = resume;
                return json({...result as object,requestForResume:{...continuation,rules:requestedRules}});
            }
            return json(result);
        }
        if (input.cursor !== undefined) return json({error: "A test cursor requires test:true."}, 400);
        if (!env.databaseUrl) return json({error: "Daily ledger worker database is not configured."}, 503);
        const result = await execute({ runKey, state, maxRecords });
        return json({ ...result as object, requestForResume: (result as {
                done?: boolean;
            }).done ? null : { runKey, ...(repostId ? { repostId } : {}), ...(requestedRules ? {rules:requestedRules} : {categoryCodes:sorted}), dryRun, maxRecords, ...(createdFrom ? { createdFrom } : {}), ...(source ? { source } : {}), ...(dateRange ? { fromDate: dateRange.from, toDate: dateRange.to } : {}) } }, (result as {
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
