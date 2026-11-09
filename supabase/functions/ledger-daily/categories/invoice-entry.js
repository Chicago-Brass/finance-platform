// Ported from airtable/invoice-entry.js. No native trigger gate or transport runs here.
import { invoiceEntryFields as fields } from "../definitions.ts";
export function createCategories(client) {
    const { TABLES, INVOICE_FIELDS, ACCOUNT_FIELDS } = fields;
    async function handleReceivedProductInvoice(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Product" || !(data.invoice.value(INVOICE_FIELDS.receivedNotInvoiced) > 0))
            return;
        const cents = moneyCents(data.invoice.value(INVOICE_FIELDS.amount), "Invoice Amount");
        results.push({
            category: "Vendor PRODUCT invoice - goods already received", tChartRow: 2,
            postings: invoicePosting(data, "211.200", "211.100", cents),
        });
    }
    async function handleVendorDepositInvoice(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Product" || data.invoice.text(INVOICE_FIELDS.poStatus) !== "Confirmed" || data.invoice.value(INVOICE_FIELDS.poReceivedDate))
            return;
        const cents = moneyCents(data.invoice.value(INVOICE_FIELDS.amount), "Invoice Amount");
        results.push({
            category: "Vendor DEPOSIT invoice - billed before the goods ship", tChartRow: 4,
            postings: invoicePosting(data, "132.100", "211.100", cents),
        });
    }
    async function handleInboundFreightInvoice(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Product")
            return;
        const cents = moneyCents(data.invoice.value(INVOICE_FIELDS.freight), "Freight");
        results.push({
            category: "Vendor invoice for inbound freight / handling on a PO", tChartRow: 5,
            postings: invoicePosting(data, "131.100", "211.100", cents),
        });
    }
    async function handleSalesTaxInvoice(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Sales Tax)")
            return;
        const cents = moneyCents(data.invoice.value(INVOICE_FIELDS.amount), "Invoice Amount");
        results.push({
            category: "Sales tax remittance invoice (paying the state)", tChartRow: 7,
            postings: invoicePosting(data, "212.100", "211.100", cents),
        });
    }
    async function handleAssetInvoice(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Assets")
            return;
        const cents = moneyCents(data.invoice.value(INVOICE_FIELDS.amount), "Invoice Amount");
        results.push({
            category: "Fixed asset purchase invoice (vehicle, fixtures, software)", tChartRow: 8,
            postings: invoicePosting(data, "143.300", "211.100", cents),
        });
    }
    async function handleVendorReturnCredit(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Credit" || !getLinkedRecords(data.invoice, INVOICE_FIELDS.purchaseOrders).length)
            return;
        const cents = moneyCents(data.invoice.value(INVOICE_FIELDS.amount), "Invoice Amount");
        results.push({
            category: "Vendor CREDIT MEMO - returned goods (RGA return for credit)", tChartRow: 9,
            postings: invoicePosting(data, "211.100", "131.400", cents),
        });
    }
    async function handleVendorPriceCredit(data, results) {
        // Partial implementation - functioning: the approved COGS 004.010 mapping works; original-expense-account credits remain outside this mapping.
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Credit" || getLinkedRecords(data.invoice, INVOICE_FIELDS.purchaseOrders).length)
            return;
        const cents = moneyCents(data.invoice.value(INVOICE_FIELDS.amount), "Invoice Amount");
        results.push({
            category: "Vendor CREDIT MEMO - price credit, no goods returned", tChartRow: 10,
            postings: invoicePosting(data, "211.100", "004.010", cents),
        });
    }
    async function handleCustomerNonProductInvoice(data, results) {
        if (data.invoiceType !== "AR" || data.vendorType !== "AR - Non-Product")
            return;
        const accounts = await readAccounts(getLinkedRecords(data.invoice, INVOICE_FIELDS.accounts));
        if (!accounts.some(account => account.text(ACCOUNT_FIELDS.number) === "010.001"))
            return;
        const cents = moneyCents(data.invoice.value(INVOICE_FIELDS.amount), "Invoice Amount");
        results.push({
            category: "Customer invoice for a NON-product charge", tChartRow: 11,
            postings: invoicePosting(data, "121.100", "010.001", cents),
        });
    }
    async function loadInvoiceData(invoiceRecordId) {
        if (!invoiceRecordId)
            throw new Error("Map invoiceRecordId to the trigger's FIN Airtable record ID.");
        const invoice = await client.readRecord(TABLES.invoices, invoiceRecordId, Object.values(INVOICE_FIELDS));
        if (!invoice)
            throw new Error(`Invoice not found: ${invoiceRecordId}`);
        const invoiceType = invoice.text(INVOICE_FIELDS.type);
        const vendorType = invoice.text(invoiceType === "AR" ? INVOICE_FIELDS.vendorTypeAR : INVOICE_FIELDS.vendorTypeAP);
        return { invoice, invoiceType, vendorType };
    }
    async function readAccounts(links) {
        return await client.readRecords(TABLES.accounts, links.map(link => link.id), Object.values(ACCOUNT_FIELDS));
    }
    function getLinkedRecords(record, fieldId) { return record.value(fieldId) || []; }
    function moneyCents(value, label) {
        if (typeof value !== "number" || !Number.isFinite(value))
            throw new Error(`${label} is missing or is not a finite number.`);
        const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
        const cents = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + 2}`));
        if (!Number.isSafeInteger(cents))
            throw new Error(`${label} exceeds safe cent precision.`);
        return cents === 0 ? 0 : cents;
    }
    function invoiceDate(value) {
        if (!value)
            throw new Error("Invoice Date is required for posting.");
        if (value.length === 10)
            return value;
        const date = new Date(value);
        if (!Number.isFinite(date.getTime()))
            throw new Error("Invoice Date is invalid.");
        const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).map(part => [part.type, part.value]));
        return `${parts.year}-${parts.month}-${parts.day}`;
    }
    function invoicePosting(data, debit, credit, cents) {
        if (!cents)
            return [];
        const invoice = data.invoice;
        /** @type {any} */
        const context = { invoiceRecordId: invoice.id, sourceRecordId: invoice.id, branch: [] };
        const branch = invoice.value(INVOICE_FIELDS.branch);
        if (branch)
            context.branch = [branch.name];
        for (const [name, field] of [["vendor", INVOICE_FIELDS.vendors], ["client", INVOICE_FIELDS.clients], ["staff", INVOICE_FIELDS.staff], ["transaction", INVOICE_FIELDS.transactions], ["po", INVOICE_FIELDS.purchaseOrders]]) {
            const ids = getLinkedRecords(invoice, field).map(link => link.id);
            context[`${name}RecordIds`] = ids;
            if (ids.length === 1)
                context[`${name}RecordId`] = ids[0];
        }
        const states = getLinkedRecords(invoice, INVOICE_FIELDS.states);
        context.stateRecordIds = states.map(link => link.id);
        context.stateNames = states.map(link => link.name);
        if (states.length === 1 && /^[A-Z]{2}$/.test(states[0].name))
            context.stateCode = states[0].name;
        return [{ debitAccount: { number: debit }, creditAccount: { number: credit }, amount: (cents / 100).toFixed(2), ...context }];
    }
    const handlers = { "INV-01": handleReceivedProductInvoice,
        "INV-03": handleVendorDepositInvoice,
        "INV-04": handleInboundFreightInvoice,
        "INV-06": handleSalesTaxInvoice,
        "INV-07": handleAssetInvoice,
        "INV-08": handleVendorReturnCredit,
        "INV-09": handleVendorPriceCredit,
        "INV-10": handleCustomerNonProductInvoice };
    return {
        fields: ({ TABLES, INVOICE_FIELDS }),
        async evaluate(rule, id) {
            const data = await loadInvoiceData(id);
            if (data.invoice)
                await client.loadLinkNames([data.invoice], [INVOICE_FIELDS.states]);
            const results = [];
            const handler = handlers[rule];
            if (!handler)
                throw new Error(`No handler for ${rule} in invoice-entry.`);
            await handler(data, results);
            return { data, results: results };
        }
    };
}
