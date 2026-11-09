// payment-events: category filters and calculations ported from the native FIN sender.
// Transport and logs live outside this module; handlers prepare posting pairs only.
import { paymentEventsFields as fields } from "../definitions.ts";
export function createCategories(client) {
    const { TABLES, ACCOUNT_FIELDS, PAYMENT_FIELDS, INVOICE_FIELDS } = fields;
    // ==================== CORE ====================
    // Each category checks its filters and prepares matching journals.
    async function handleClientPaymentCancelled(data, results) {
        // Partial implementation - functioning: current cancellation entry works; the new cancellation/deletion workflow is deferred.
        const { payment, eventType, invoiceType, vendorType } = data;
        if (eventType !== "cancelled" ||
            !payment.value(PAYMENT_FIELDS.cancelled) ||
            invoiceType !== "AR" ||
            vendorType !== "AR - Product")
            return;
        const cents = moneyCents(payment.value(PAYMENT_FIELDS.amount), "Payment Amount");
        const postings = [];
        const invoiceDetails = [];
        if (cents) {
            const invoices = await client.readRecords(TABLES.invoices, linkedIds(payment, PAYMENT_FIELDS.invoices), Object.values(INVOICE_FIELDS));
            if (!invoices.length)
                throw new Error("An AR cancellation needs linked invoices to identify its deposit or receivable accounts.");
            const bank = await loadPaymentAccount(data);
            const shares = invoiceShares(cents, invoices);
            const paymentDate = payment.value(PAYMENT_FIELDS.date);
            for (const invoice of invoices) {
                const shipOutDate = parseFirstShipOutDate(invoice);
                const account = !paymentDate || !shipOutDate || paymentDate <= shipOutDate ? "221.100" : "121.100";
                const amount = shares.get(invoice.id);
                const clients = linkedIds(invoice, INVOICE_FIELDS.clients);
                invoiceDetails.push({ id: invoice.id, name: invoice.name, shipOutDate, amount: moneyString(amount), account });
                if (!amount)
                    continue;
                postings.push({
                    debitAccount: { number: account }, creditAccount: bank, amount: moneyString(amount),
                    sourceRecordId: payment.id, invoiceRecordId: invoice.id,
                    clientRecordIds: clients, clientRecordId: clients.length === 1 ? clients[0] : undefined,
                    branch: invoice.value(INVOICE_FIELDS.branch)?.name
                });
            }
        }
        const accounts = [...new Set(postings.map(posting => posting.debitAccount.number))];
        for (const entryKey of accounts.length ? accounts : [""]) {
            results.push({
                category: "Client payment voided / bounced", tChartRow: 7, entryKey,
                postings: postings.filter(posting => posting.debitAccount.number === entryKey),
                invoices: invoiceDetails.filter(invoice => invoice.account === entryKey)
            });
        }
    }
    async function handleVendorPaymentCancelled(data, results) {
        // Partial implementation - functioning: current cancellation entry works; the new cancellation/deletion workflow is deferred.
        const { payment, eventType, invoiceType } = data;
        if (eventType !== "cancelled" || !payment.value(PAYMENT_FIELDS.cancelled) || invoiceType !== "AP")
            return;
        const cents = moneyCents(payment.value(PAYMENT_FIELDS.amount), "Payment Amount");
        results.push({
            category: "Vendor payment cancelled / returned", tChartRow: 13,
            postings: cents ? [{ debitAccount: { number: "112.100" }, creditAccount: { number: "211.100" }, amount: moneyString(cents), sourceRecordId: payment.id }] : []
        });
    }
    async function handleBankReconciliationDifference(data, results) {
        const { payment, eventType } = data;
        if (eventType !== "reconciled" ||
            !payment.value(PAYMENT_FIELDS.reconciled) ||
            (payment.value(PAYMENT_FIELDS.discrepancy) || 0) === 0)
            return;
        const amount = moneyCents(payment.value(PAYMENT_FIELDS.discrepancy), "Reconciled Amount Discrepancy");
        const bank = amount ? await loadPaymentAccount(data) : null;
        results.push({
            category: "Bank reconciliation rounding difference", tChartRow: 27,
            postings: amount ? [{
                    debitAccount: { number: "007.002" }, creditAccount: bank,
                    amount: moneyString(amount), sourceRecordId: payment.id
                }] : []
        });
    }
    function linkedIds(record, fieldId) { return [...new Set((record.value(fieldId) || []).map(link => link.id))]; }
    async function loadPaymentData(paymentRecordId) {
        if (!paymentRecordId)
            throw new Error("FIN payment record ID is required.");
        const payment = await client.readRecord(TABLES.payments, paymentRecordId, Object.values(PAYMENT_FIELDS));
        if (!payment)
            throw new Error(`Payment not found: ${paymentRecordId}`);
        const vendorTypes = [...new Set([
                payment.value(PAYMENT_FIELDS.vendorTypesAP),
                payment.value(PAYMENT_FIELDS.vendorTypesAR),
            ].flat().filter(Boolean))];
        if (vendorTypes.length > 1)
            throw new Error(`Payment ${payment.id} has multiple Vendor Types: ${vendorTypes.join(", ")}. Correct the payment links before processing.`);
        return { payment, invoiceType: payment.text(PAYMENT_FIELDS.type), vendorType: payment.text(PAYMENT_FIELDS.vendorType) };
    }
    function moneyCents(value, label) {
        if (typeof value !== "number" || !Number.isFinite(value))
            throw new Error(`${label} is missing or is not a finite number.`);
        const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
        const cents = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + 2}`));
        if (!Number.isSafeInteger(cents))
            throw new Error(`${label} exceeds safe cent precision.`);
        return cents === 0 ? 0 : cents;
    }
    function moneyString(cents) { return (cents / 100).toFixed(2); }
    function invoiceShares(totalCents, invoices) {
        if (invoices.length === 1)
            return new Map([[invoices[0].id, totalCents]]);
        const weights = invoices.map(invoice => ({ id: invoice.id, cents: moneyCents(invoice.value(INVOICE_FIELDS.amountToPay), `Invoice ${invoice.id} Amount To Pay`) }));
        if (new Set(weights.filter(value => value.cents).map(value => Math.sign(value.cents))).size > 1)
            throw new Error("Mixed-sign invoice amounts require an explicit allocation before posting.");
        const ordered = weights.map(value => ({ ...value, cents: Math.abs(value.cents) })).sort((a, b) => a.id.localeCompare(b.id));
        const sum = ordered.reduce((total, weight) => total + weight.cents, 0);
        if (!sum)
            throw new Error("Cannot allocate a payment against zero invoice amounts.");
        const parts = ordered.map(weight => {
            const product = totalCents * weight.cents;
            if (!Number.isSafeInteger(product))
                throw new Error("Allocation exceeds safe cent precision.");
            return { id: weight.id, cents: Math.trunc(product / sum), remainder: product % sum };
        });
        const direction = Math.sign(totalCents);
        let remainder = totalCents - parts.reduce((total, part) => total + part.cents, 0);
        for (const part of [...parts].sort((a, b) => direction * (b.remainder - a.remainder) || a.id.localeCompare(b.id))) {
            if (!remainder)
                break;
            part.cents += direction;
            remainder -= direction;
        }
        return new Map(parts.map(part => [part.id, part.cents]));
    }
    function parseFirstShipOutDate(invoice) {
        const value = invoice.text(INVOICE_FIELDS.firstShipDate);
        if (!value)
            return "";
        // This lookup is limited to one M/D/YYYY date. Compare without a timezone shift.
        const [month, day, year] = value.split("/");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    async function loadPaymentAccount(data) {
        if (data.paymentAccount)
            return data.paymentAccount;
        const links = data.payment.value(PAYMENT_FIELDS.accounts) || [];
        if (links.length !== 1)
            throw new Error("The payment must identify one payment account.");
        const account = await client.readRecord(TABLES.accounts, links[0].id, Object.values(ACCOUNT_FIELDS));
        if (!account)
            throw new Error(`Payment account not found: ${links[0].id}`);
        data.paymentAccount = { recordId: account.id, number: account.text(ACCOUNT_FIELDS.number) };
        return data.paymentAccount;
    }
    const handlers = {
        "PAY-06": handleClientPaymentCancelled,
        "PAY-12": handleVendorPaymentCancelled,
        "PAY-26": handleBankReconciliationDifference
    };
    return {
        fields,
        async evaluate(rule, id, eventType) {
            const data = await (async () => { return { ...await loadPaymentData(id), eventType }; })();
            await client.loadLinkNames(data.invoices || [], [INVOICE_FIELDS.states].filter(Boolean));
            const results = [];
            const handler = handlers[rule];
            if (!handler)
                throw new Error(`No handler for ${rule} in payment-events.`);
            await handler(data, results);
            return { data, results: results };
        },
    };
}
