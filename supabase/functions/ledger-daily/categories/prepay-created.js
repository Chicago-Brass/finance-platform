// Ported from airtable/prepay-created.js. No native trigger gate or transport runs here.
import { prepayFields as fields } from "../definitions.ts";
export function createCategories(client) {
    const { TABLE, FIELDS, INVOICES, BRANCH } = fields;
    async function handlePrepaidUse(data, results) {
        const cents = moneyCents(data.record.value(FIELDS.amount));
        const note = data.record.text(FIELDS.name);
        results.push({
            category: "Prepaid expense - monthly use-up", tChartRow: 5,
            notes: note || undefined,
            postings: cents ? [{ debitAccount: { number: "007.011" }, creditAccount: { number: "135.000" }, amount: (cents / 100).toFixed(2), sourceRecordId: data.record.id, invoiceRecordIds: data.invoiceIds, ...(data.invoiceIds.length === 1 ? { invoiceRecordId: data.invoiceIds[0] } : {}), branch: data.branches }] : [],
        });
    }
    async function loadPrepayData(prepayLogRecordId) {
        if (!prepayLogRecordId)
            throw new Error("Map prepayLogRecordId to the trigger's FIN Airtable record ID.");
        const record = await client.readRecord(TABLE, prepayLogRecordId, Object.values(FIELDS));
        if (!record)
            throw new Error(`Prepay record not found: ${prepayLogRecordId}`);
        const invoiceIds = [...new Set((record.value(FIELDS.invoices) || []).map(link => link.id))];
        const branches = [];
        for (let start = 0; start < invoiceIds.length; start += 100) {
            const ids = invoiceIds.slice(start, start + 100);
            const query = { records: await client.readRecords(INVOICES, ids, [BRANCH]) };
            const missing = ids.filter(id => !query.records.some(invoice => invoice.id === id));
            if (missing.length)
                throw new Error(`Linked invoice not found: ${missing.join(", ")}`);
            for (const invoice of query.records)
                branches.push(invoice.value(BRANCH)?.name || "");
        }
        return { record, invoiceIds, branches: [...new Set(branches)] };
    }
    function moneyCents(value) {
        if (typeof value !== "number" || !Number.isFinite(value))
            throw new Error(`Amount Deducted is missing or is not a finite number.`);
        const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
        const cents = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + 2}`));
        if (!Number.isSafeInteger(cents))
            throw new Error(`Amount Deducted exceeds safe cent precision.`);
        return cents === 0 ? 0 : cents;
    }
    const handlers = { "EXP-04": handlePrepaidUse };
    return {
        fields: ({ TABLES: { source: TABLE }, SOURCE_FIELDS: FIELDS }),
        async evaluate(rule, id) {
            const data = await loadPrepayData(id);
            const results = [];
            const handler = handlers[rule];
            if (!handler)
                throw new Error(`No handler for ${rule} in prepay-created.`);
            await handler(data, results);
            return { data, results: results };
        }
    };
}
