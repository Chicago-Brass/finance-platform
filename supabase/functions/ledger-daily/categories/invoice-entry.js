// Invoice Entry categories. The source owns its journal links; the generic writer records final account pairs.
import { invoiceWorkerFields as fields } from "../definitions.ts";
export function createCategories(client) {
    const { TABLES: T, INVOICE_FIELDS: I, PAYMENT_FIELDS: P, SHIPPING_FIELDS: S, MTA_FIELDS: M, ACCOUNT_FIELDS: A } = fields;

    // ==================== CORE ====================

    async function handleDepositInvoice(data, results) {
        if (!isDeposit(data.invoice)) return;
        await addInvoice(results, data, "Deposit Invoice Created", "121.100", "221.100");
    }
    async function handleDepositPayment(data, results) {
        if (!data.payment.value(P.sent)) return;
        await addPayment(results, data, "Deposit Invoice Paid", data.invoices.filter(isDeposit), "121.100", true);
    }
    async function handleShipment(data, results) {
        // Partial implementation - functioning. shortcut: recognition is uncapped until the deposit-to-shipment link is defined.
        if (!data.record.value(S.shipped) || !data.record.value(S.date)) return;
        const mtas = await client.readRecords(T.mtas, ids(data.record, S.mtas), Object.values(M));
        if (!mtas.length) throw new Error("Shipped record has no linked MTAs to value.");
        const units = mtas.reduce((sum, mta) => checkedTotal(sum, moneyUnits(mta.value(M.amount), 4, "MTAs.Extended Sell Price")), 0);
        const cents = Math.sign(units) * Math.round(Math.abs(units) / 100);
        const branches = mtas.map(mta => mta.value(M.branch) || []);
        const context = { sourceRecordId: data.record.id,
            transactionRecordIds: ids(data.record, S.transactions).sort(),
            stateRecordIds: [...new Set(mtas.flatMap(mta => ids(mta, M.states)))].sort(),
            branch: branches.some(values => !values.length) ? [] : [...new Set(branches.flat().map(value => value.name))] };
        addResult(results, "Shipment Against Customer Deposit", "221.100", "004.001", cents, context);
    }
    async function handleBalanceInvoice(data, results) {
        if (!isBalance(data.invoice)) return;
        await addInvoice(results, data, "Full or Balance Invoice Created", "121.100", "004.001");
    }
    async function handleBalancePayment(data, results) {
        if (!data.payment.value(P.sent)) return;
        await addPayment(results, data, "Full or Balance Invoice Paid", data.invoices.filter(isBalance), "121.100", true);
    }
    async function handleAssetInvoice(data, results) {
        // Partial implementation - functioning: only 143.300 qualifies until the remaining asset accounts are approved.
        const account = await assetAccount(data.invoice);
        if (!account) return;
        await addInvoice(results, data, "Fixed Asset Invoice Created", account, "211.100");
    }
    async function handleAssetPayment(data, results) {
        // Partial implementation - functioning: the same approved asset scope as its invoice counterpart.
        if (!data.payment.value(P.sent)) return;
        const invoices = [];
        for (const invoice of data.invoices) if (await assetAccount(invoice)) invoices.push(invoice);
        await addPayment(results, data, "Fixed Asset Invoice Paid", invoices, "211.100");
    }
    async function handleNonProductInvoice(data, results) {
        if (!isNonProduct(data.invoice)) return;
        const account = await singleAccount(data.invoice, I.accounts, "Non-product invoice");
        await addInvoice(results, data, "Non-product Client Invoice Created", "121.100", account);
    }
    async function handleNonProductPayment(data, results) {
        if (!data.payment.value(P.sent)) return;
        await addPayment(results, data, "Non-product Client Invoice Paid", data.invoices.filter(isNonProduct), "121.100", true);
    }
    async function handleVendorReturn() { throw new Error("Not yet implemented: vendor return credit is deferred."); }
    async function handleVendorPriceCredit() { throw new Error("Not yet implemented: vendor price credit is deferred."); }

    // ==================== UTILS ====================

    function ids(record, field) { return (record.value(field) || []).map(link => link.id); }
    function isAR(invoice) { return invoice.text(I.type) === "AR" && !invoice.value(I.cancelled); }
    function isDeposit(invoice) { return isAR(invoice) && invoice.text(I.vendorTypeAR) === "AR - Product" && invoice.text(I.kind) === "Deposit Invoice"; }
    function isBalance(invoice) { return isAR(invoice) && invoice.text(I.vendorTypeAR) === "AR - Product" && ["Full Invoice", "Balance Invoice"].includes(invoice.text(I.kind)); }
    function isNonProduct(invoice) { return isAR(invoice) && invoice.text(I.vendorTypeAR) === "AR - Non-Product"; }
    async function singleAccount(record, field, label) {
        const links = ids(record, field);
        if (links.length !== 1) throw new Error(`${label} must link exactly one account.`);
        const account = await client.readRecord(T.accounts, links[0], Object.values(A));
        if (!account || !account.text(A.number)) throw new Error(`${label} account number is missing.`);
        return account.text(A.number);
    }
    async function assetAccount(invoice) {
        if (invoice.text(I.type) !== "AP" || invoice.text(I.vendorTypeAP) !== "AP - Assets" || invoice.value(I.prepaid) || invoice.value(I.cancelled)) return null;
        const account = await singleAccount(invoice, I.accounts, "Fixed asset invoice");
        return account === "143.300" ? account : null;
    }
    function moneyUnits(value, precision, label) {
        if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} is missing or is not a finite number.`);
        const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
        const units = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + precision}`));
        if (!Number.isSafeInteger(units)) throw new Error(`${label} exceeds safe money precision.`);
        return units === 0 ? 0 : units;
    }
    function checkedTotal(a, b) {
        const sum = a + b;
        if (!Number.isSafeInteger(sum)) throw new Error("Shipment total exceeds safe money precision.");
        return sum;
    }
    function invoiceContext(data, invoices) {
        const invoiceIds = invoices.map(invoice => invoice.id).sort();
        const context = { sourceRecordId: data.record.id, invoiceRecordIds: invoiceIds, branch: [] };
        if (invoiceIds.length === 1) context.invoiceRecordId = invoiceIds[0];
        for (const [name, field] of [["vendor", I.vendors], ["client", I.clients], ["staff", I.staff], ["transaction", I.transactions], ["po", I.purchaseOrders]]) {
            context[`${name}RecordIds`] = [...new Set(invoices.flatMap(invoice => ids(invoice, field)))].sort();
        }
        context.stateRecordIds = [...new Set(invoices.flatMap(invoice => ids(invoice, I.states)))].sort();
        const branches = invoices.map(invoice => invoice.value(I.branch)?.name);
        context.branch = branches.some(branch => !branch) ? [] : [...new Set(branches)];
        return context;
    }
    function addResult(results, category, debit, credit, cents, context) {
        if (!cents) return;
        results.push({ category, postings: [{ debitAccount: { number: debit }, creditAccount: { number: credit },
            amount: (cents / 100).toFixed(2), ...context }] });
    }
    async function addInvoice(results, data, category, debit, credit) {
        addResult(results, category, debit, credit, moneyUnits(data.invoice.value(I.amount), 2, "Invoice Amount"), invoiceContext(data, [data.invoice]));
    }
    async function addPayment(results, data, category, invoices, account, incoming = false) {
        if (!invoices.length) return;
        const bank = await singleAccount(data.payment, P.accounts, "Payment");
        addResult(results, category, incoming ? bank : account, incoming ? account : bank,
            moneyUnits(data.payment.value(P.amount), 2, "Payment Amount"), invoiceContext(data, invoices));
    }
    async function loadData(tableId, recordId) {
        const sourceFields = tableId === T.invoices ? I : tableId === T.payments ? P : tableId === T.shipping ? S : null;
        if (!sourceFields) throw new Error("Unsupported Invoice Entry source table.");
        const record = await client.readRecord(tableId, recordId, Object.values(sourceFields));
        if (!record) throw new Error(`Invoice Entry source not found: ${recordId}`);
        const data = { record, invoices: [], entryDate: null };
        if (tableId === T.invoices) { data.invoice = record; data.entryDate = record.value(I.date); }
        if (tableId === T.payments) { data.payment = record; data.entryDate = record.value(P.date);
            data.invoices = await client.readRecords(T.invoices, ids(record, P.invoices), Object.values(I)); }
        if (tableId === T.shipping) data.entryDate = record.value(S.date);
        return data;
    }
    const handlers = { "INV-12": handleDepositInvoice, "INV-13": handleDepositPayment, "INV-14": handleShipment,
        "INV-15": handleBalanceInvoice, "INV-16": handleBalancePayment, "INV-07": handleAssetInvoice,
        "INV-17": handleAssetPayment, "INV-10": handleNonProductInvoice, "INV-18": handleNonProductPayment,
        "INV-08": handleVendorReturn, "INV-09": handleVendorPriceCredit };
    return { fields, async evaluate(rule, recordId, tableId = T.invoices) {
        const handler = handlers[rule];
        if (!handler) throw new Error(`Unknown Invoice Entry category ${rule}.`);
        if (["INV-08", "INV-09"].includes(rule)) await handler();
        const data = await loadData(tableId, recordId), results = [];
        await handler(data, results);
        return { data, results };
    } };
}
