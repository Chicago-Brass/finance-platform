// Filter/calculation preview. This path imports no database client and refuses Airtable writes.
import { AirtableClient } from "./airtable.ts";
import { CATEGORIES, candidateFormula, and, or } from "./queries.ts";
import { createCategoryEvaluator, sourceFields } from "./categories/index.ts";
import type { CategoryDefinition } from "./types.ts";
export async function inspectCategories(client: AirtableClient, options: {
    categoryCodes?: string[];
    samples?: number;
    maxPages?: number;
    onCategory?: (result: any) => void;
} = {}) {
    const rows = [];
    const evaluate = createCategoryEvaluator(client);
    const selected = CATEGORIES.filter(c => c.status !== "deferred" && (!options.categoryCodes?.length || options.categoryCodes.includes(c.code)));
    await client.initialize();
    for (const category of selected) {
        const start = performance.now(), requests = client.requests;
        const result: any = { id: category.id, rule: category.code, status: category.status, sourceTable: category.tableId, candidates: 0, complete: true, requests: 0, milliseconds: 0, samples: [], errors: [] };
        try {
            const ids = await discoverCategory(client, category, options.maxPages ?? Infinity);
            result.candidates = ids.ids.length;
            result.complete = ids.complete;
            result.filter = candidateFormula(category, client);
            for (const id of ids.ids.slice(0, options.samples ?? 1)) {
                if (category.status === "blocked") {
                    result.errors.push("Not yet implemented: account mapping is pending.");
                    break;
                }
                try {
                    client.clearRecordCache();
                    const source = await client.readRecord(category.tableId, id, sourceFields(category));
                    if (!source)
                        throw new Error("Source no longer exists.");
                    const event = await evaluate(category, source);
                    result.samples.push({ recordId: id, matched: !!event, journals: event?.categories.length ?? 0, payload: event });
                }
                catch (error) {
                    result.errors.push({ recordId: id, message: error instanceof Error ? error.message : String(error) });
                }
            }
        }
        catch (error) {
            result.complete = false;
            result.errors.push(error instanceof Error ? error.message : String(error));
        }
        result.requests = client.requests - requests;
        result.milliseconds = Math.round(performance.now() - start);
        rows.push(result);
        options.onCategory?.(result);
        client.clearRecordCache();
    }
    return { categories: rows, airtableRequests: client.requests, databaseWrites: 0, airtableWrites: 0 };
}
async function discoverCategory(client: AirtableClient, category: CategoryDefinition, maxPages: number) {
    let complete = true;
    const relatedIds = new Set<string>();
    if (category.related) {
        const r = category.related;
        let offset: string | null = null, pages = 0;
        do {
            const page = await client.queryRecords(r.tableId, r.filter(client), [r.linksFieldId], offset);
            const links = [...new Set<string>(page.records.flatMap(record => (record.value(r.linksFieldId) || []).map((link: {
                    id: string;
                }) => link.id)))];
            if (r.through) {
                const parents = await client.readRecords(r.through.tableId, links, [r.through.linksFieldId]);
                for (const parent of parents)
                    for (const link of parent.value(r.through.linksFieldId) || [])
                        relatedIds.add(link.id);
            }
            else
                for (const id of links)
                    relatedIds.add(id);
            offset = page.offset;
            pages++;
            client.clearRecordCache();
        } while (offset && pages < maxPages);
        if (offset)
            complete = false;
    }
    const ids = new Set<string>(), related = [...relatedIds];
    const groups = category.related ? Array.from({ length: Math.ceil(related.length / 40) }, (_, i) => related.slice(i * 40, (i + 1) * 40)) : [null];
    for (const group of groups) {
        const filter = candidateFormula(category, client);
        const formula = group ? and(filter, or(...group.map(id => `RECORD_ID()=${JSON.stringify(id)}`))) : filter;
        let offset: string | null = null, pages = 0;
        do {
            const page = await client.queryIds(category.tableId, formula, offset);
            page.ids.forEach(id => ids.add(id));
            offset = page.offset;
            pages++;
        } while (offset && pages < maxPages);
        if (offset)
            complete = false;
    }
    return { ids: [...ids], complete };
}
