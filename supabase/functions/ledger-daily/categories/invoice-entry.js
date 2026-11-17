// Invoice Entry categories. The source owns its journal links; the generic writer records final account pairs.
import { invoiceWorkerFields as fields } from "../definitions.ts";
import { OPERATING_EXPENSE_ACCOUNT_MAPPING } from "../rules/expense-accounts.ts";
export function createCategories(client, readDepositBalance) {
    const { TABLES: T, INVOICE_FIELDS: I, PAYMENT_FIELDS: P, SHIPPING_FIELDS: S, MTA_FIELDS: M, ACCOUNT_FIELDS: A } = fields;

    // ==================== CORE ====================

    async function handleDepositInvoice(data, results) {
        if (!isDeposit(data.invoice)) return;
        await addInvoice(results, data, "Deposit Invoice Created", "121.100", "221.100");
    }
    async function handleDepositPayment(data, results) {
        if (!sent(data)) return;
        const invoices = data.invoices.filter(isDeposit);
        await addPayment(results, data, "Deposit Invoice Paid", invoices, "121.100", true, invoicePaymentCents(data, "INV-13"));
    }
    async function handleShipment(data, results) {
        if (!data.record.value(S.shipped) || !data.record.value(S.date)) return;
        const transactionIds = ids(data.record, S.transactions);
        if (transactionIds.length !== 1) throw new Error("Shipping Record must link exactly one Transaction; multiple transaction allocation is not defined.");
        const transaction = await client.readRecord(T.transactions, transactionIds[0], Object.values(fields.TRANSACTION_FIELDS));
        if (!transaction) throw new Error("Shipping Record transaction is missing.");
        const invoices = await client.readRecords(T.invoices, ids(transaction, fields.TRANSACTION_FIELDS.invoices), Object.values(I));
        const deposits = invoices.filter(isDeposit);
        if (!deposits.length) return;
        if (deposits.length !== 1) throw new Error("Transaction must identify exactly one deposit invoice; multiple deposit allocation is not defined.");
        const mtas = await client.readRecords(T.mtas, ids(data.record, S.mtas), Object.values(M));
        if (!mtas.length) throw new Error("Shipped record has no linked MTAs to value.");
        const units = mtas.reduce((sum, mta) => checkedTotal(sum, moneyUnits(mta.value(M.amount), 4, "MTAs.Extended Sell Price")), 0);
        const cents = Math.sign(units) * Math.round(Math.abs(units) / 100);
        if (!cents) return;
        if (!readDepositBalance) throw new Error("Posted deposit balance reader is not configured.");
        const remaining = await readDepositBalance(deposits[0].id);
        if (!Number.isSafeInteger(remaining)) throw new Error("Posted deposit balance exceeds safe money precision.");
        const amount = cents < 0 ? cents : Math.min(cents, Math.max(0, remaining));
        const branches = mtas.map(mta => mta.value(M.branch) || []);
        const context = { ...invoiceContext(data, deposits), sourceRecordIds: mtas.map(mta => mta.id).sort(),
            transactionRecordIds: transactionIds,
            stateRecordIds: [...new Set(mtas.flatMap(mta => ids(mta, M.states)))].sort(),
            branch: branches.some(values => !values.length) ? [] : [...new Set(branches.flat().map(value => value.name))] };
        addResult(results, "Shipment Against Customer Deposit", "221.100", "004.001", amount, context);
        // Retain the uncapped valuation so a changed source conflicts even after a capped posting.
        if (amount) results[results.length - 1].entryKey = JSON.stringify([deposits[0].id, cents]);
    }
    async function handleBalanceInvoice(data, results) {
        if (!isBalance(data.invoice)) return;
        await addInvoice(results, data, "Full or Balance Invoice Created", "121.100", "004.001");
    }
    async function handleBalancePayment(data, results) {
        if (!sent(data)) return;
        const invoices = data.invoices.filter(isBalance);
        await addPayment(results, data, "Full or Balance Invoice Paid", invoices, "121.100", true, invoicePaymentCents(data, "INV-16"));
    }
    async function handleAssetInvoice(data, results) {
        // Partial implementation - functioning: only 143.300 qualifies until the remaining asset accounts are approved.
        const account = await assetAccount(data.invoice);
        if (!account) return;
        await addInvoice(results, data, "Fixed Asset Invoice Created", account, "211.100");
    }
    async function handleAssetPayment(data, results) {
        // Partial implementation - functioning: the same approved asset scope as its invoice counterpart.
        if (!sent(data)) return;
        const invoices = [];
        for (const invoice of data.invoices) if (await assetAccount(invoice)) invoices.push(invoice);
        await addPayment(results, data, "Fixed Asset Invoice Paid", invoices, "211.100");
    }
    async function handleNonProductInvoice(data, results) {
        if (!isNonProduct(data.invoice)) return;
        const account = await singleAccount(data.invoice, I.accounts, "Non-product invoice");
        if (["004.011", "311.200", "004.004"].includes(account)) return;
        await addInvoice(results, data, "Non-product Client Invoice Created", "121.100", account);
    }
    async function handleNonProductPayment(data, results) {
        if (!sent(data)) return;
        const invoices = [];
        for (const invoice of data.invoices) if (isNonProduct(invoice) && !["004.011", "311.200", "004.004"].includes(await singleAccount(invoice, I.accounts, "Non-product invoice"))) invoices.push(invoice);
        await addPayment(results, data, "Non-product Client Invoice Paid", invoices, "121.100", true);
    }
    async function handleVendorReturn(data, results) {
        const invoice = data.invoice;
        if (invoice.text(I.type) !== "AP" || invoice.text(I.vendorTypeAP) !== "AP - Credit" || invoice.value(I.cancelled) || !ids(invoice, I.purchaseOrders).length) return;
        // FIN credit memos are negative; negate the signed source to reduce AP on the chart's debit side.
        addResult(results, "Vendor Credit Memo - Returned Goods", "211.100", "131.400",
            -moneyUnits(invoice.value(I.amount), 2, "Invoice Amount"), invoiceContext(data, [invoice]));
    }
    async function handleVendorPriceCredit() { throw new Error("Not yet implemented: vendor price credit is deferred."); }

    // ==================== UTILS ====================

    function sent(data) { return data.payment.value(P.sent) && !data.payment.value(P.cancelled) && data.payment.text(P.recordType) === "Regular Payment"; }
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
        if (!Number.isSafeInteger(sum)) throw new Error("Amount total exceeds safe money precision.");
        return sum;
    }
    function invoicePaymentCents(data, rule) {
        const groups = [
            { rule: "INV-13", invoices: data.invoices.filter(isDeposit) },
            { rule: "INV-16", invoices: data.invoices.filter(isBalance) },
            { rule: "other", invoices: data.invoices.filter(invoice => !isDeposit(invoice) && !isBalance(invoice)) },
        ].filter(group => group.invoices.length);
        if (!groups.some(group => group.rule === rule)) return 0;
        const totalCents = moneyUnits(data.payment.value(P.amount), 2, "Payment Amount");
        if (!totalCents) return 0;
        for (const group of groups) group.share = group.invoices.sort((a, b) => a.id.localeCompare(b.id)).reduce((sum, invoice) => {
            const value = invoice.value(I.paymentProportion);
            if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Invoices.Payment Proportion For Batch Allocation is missing or invalid.");
            return sum + value;
        }, 0);
        const totalShare = groups.reduce((sum, group) => sum + group.share, 0);
        if (!Number.isFinite(totalShare) || Math.abs(totalShare - 1) > 1e-9) throw new Error("Invoice payment proportions must total 100% for the same invoice batch.");
        const parts = groups.map(group => {
            const raw = totalCents * (group.share / totalShare), cents = Math.trunc(raw);
            if (!Number.isSafeInteger(cents)) throw new Error("Payment allocation exceeds safe cent precision.");
            return { rule: group.rule, cents, remainder: raw - cents };
        });
        let remaining = checkedTotal(totalCents, -parts.reduce((sum, part) => checkedTotal(sum, part.cents), 0));
        if (Math.abs(remaining) > parts.length) throw new Error("Payment allocation exceeds safe cent precision.");
        const direction = Math.sign(remaining);
        // Allocate whole cents across all groups so category rounding cannot duplicate cash.
        for (const part of [...parts].sort((a, b) => direction * (b.remainder - a.remainder) || a.rule.localeCompare(b.rule))) {
            if (!remaining) break;
            part.cents = checkedTotal(part.cents, direction);
            remaining -= direction;
        }
        return parts.find(part => part.rule === rule).cents;
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
        results.push({ category, postings: [{ debitAccount: { number: OPERATING_EXPENSE_ACCOUNT_MAPPING[debit] ?? debit }, creditAccount: { number: OPERATING_EXPENSE_ACCOUNT_MAPPING[credit] ?? credit },
            amount: (cents / 100).toFixed(2), ...context }] });
    }
    async function addInvoice(results, data, category, debit, credit) {
        addResult(results, category, debit, credit, moneyUnits(data.invoice.value(I.amount), 2, "Invoice Amount"), invoiceContext(data, [data.invoice]));
    }
    async function addPayment(results, data, category, invoices, account, incoming = false, amountCents) {
        if (!invoices.length) return;
        const bank = await singleAccount(data.payment, P.accounts, "Payment");
        addResult(results, category, incoming ? bank : account, incoming ? account : bank,
            amountCents ?? moneyUnits(data.payment.value(P.amount), 2, "Payment Amount"), invoiceContext(data, invoices));
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
        if (rule === "INV-09") await handler();
        const data = await loadData(tableId, recordId), results = [];
        await handler(data, results);
        return { data, results };
    } };
}
