// Ported from airtable/depreciation-created.js. No native trigger gate or transport runs here.
import { depreciationFields as fields } from "../definitions.ts";
export function createCategories(client) {
    const { TABLE, FIELDS } = fields;
    async function handleMonthlyDepreciation(data, results) {
        const cents = moneyCents(data.record.value(FIELDS.amount));
        const assets = data.record.value(FIELDS.assets) || [];
        results.push({
            category: "Monthly depreciation of equipment, vehicles, fixtures", tChartRow: 11,
            notes: assets.length ? "Associated asset: " + assets.map(asset => `${asset.name} (${asset.id})`).join("; ") : undefined,
            postings: cents ? [{ debitAccount: { number: "009.101" }, creditAccount: { number: "161.000" }, amount: (cents / 100).toFixed(2), sourceRecordId: data.record.id }] : [],
        });
    }
    async function loadDepreciationData(depreciationRecordId) {
        if (!depreciationRecordId)
            throw new Error("Map depreciationRecordId to the trigger's FIN Airtable record ID.");
        const record = await client.readRecord(TABLE, depreciationRecordId, Object.values(FIELDS));
        if (!record)
            throw new Error(`Depreciation record not found: ${depreciationRecordId}`);
        return { record };
    }
    function moneyCents(value) {
        if (typeof value !== "number" || !Number.isFinite(value))
            throw new Error(`Amount Depreciated is missing or is not a finite number.`);
        const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
        const cents = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + 2}`));
        if (!Number.isSafeInteger(cents))
            throw new Error(`Amount Depreciated exceeds safe cent precision.`);
        return cents === 0 ? 0 : cents;
    }
    const handlers = { "EXP-10": handleMonthlyDepreciation };
    return {
        fields: ({ TABLES: { source: TABLE }, SOURCE_FIELDS: FIELDS }),
        async evaluate(rule, id) {
            const data = await loadDepreciationData(id);
            await client.loadLinkNames([data.record], [FIELDS.assets]);
            const results = [];
            const handler = handlers[rule];
            if (!handler)
                throw new Error(`No handler for ${rule} in depreciation-created.`);
            await handler(data, results);
            return { data, results: results };
        }
    };
}
