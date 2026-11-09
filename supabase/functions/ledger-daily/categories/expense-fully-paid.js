// Ported from airtable/expense-fully-paid.js. No native trigger gate or transport runs here.
import { paidExpenseFields as fields } from "../definitions.ts";
export function createCategories(client) {
    const { TABLES, INVOICE_FIELDS, PAYMENT_FIELDS, ACCOUNT_FIELDS } = fields;
    async function handleCardExpense(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)")
            return;
        const invoiceAccountIds = linkedIds(data.invoice, INVOICE_FIELDS.accounts);
        if (!invoiceAccountIds.length)
            return;
        const payments = await linkedPayments(data);
        const paymentAccountIds = [...new Set(payments.flatMap(payment => linkedIds(payment, PAYMENT_FIELDS.accounts)))];
        const paymentAccounts = await accountNumbers(data, paymentAccountIds);
        if (!paymentAccounts.includes("231.100"))
            return;
        if (invoiceAccountIds.length !== 1)
            throw new Error("Not yet implemented: Card expense uses the full Invoice Amount; multiple invoice accounts need separate amounts.");
        const [debit] = await accountNumbers(data, invoiceAccountIds);
        const cents = moneyCents(data.invoice.value(INVOICE_FIELDS.amount), "Invoice Amount");
        results.push({
            category: "Company credit-card purchase with NO vendor bill", tChartRow: 3, entryKey: debit,
            postings: expensePosting(data, debit, "231.100", cents),
        });
    }
    async function handleBankFees(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)")
            return;
        const accounts = await accountNumbers(data, linkedIds(data.invoice, INVOICE_FIELDS.accounts));
        if (!accounts.includes("007.002"))
            return;
        const payments = await linkedPayments(data);
        if (!payments.length)
            throw new Error("Bank-fee invoice needs a linked payment to identify the bank account.");
        const banks = [];
        for (const payment of payments) {
            const ids = linkedIds(payment, PAYMENT_FIELDS.accounts);
            if (ids.length !== 1)
                throw new Error(`Bank-fee payment ${payment.id} must identify exactly one bank account.`);
            const [number] = await accountNumbers(data, ids);
            if (number !== "112.100" && number !== "0747")
                throw new Error(`Bank-fee payment ${payment.id} must use Fifth Third (112.100) or Nickel (0747).`);
            banks.push(number);
        }
        if (new Set(banks).size !== 1)
            throw new Error("Bank-fee invoice links payments using different banks; the invoice amount cannot be split without a mapping.");
        const credit = banks[0];
        const cents = moneyCents(data.invoice.value(INVOICE_FIELDS.amount), "Invoice Amount");
        results.push({
            category: "Bank fees and charges shown only on the bank statement", tChartRow: 12, entryKey: "007.002",
            postings: expensePosting(data, "007.002", credit, cents),
        });
    }
    async function loadExpenseData(invoiceRecordId) {
        if (!invoiceRecordId)
            throw new Error("Map invoiceRecordId to the trigger's FIN Airtable record ID.");
        const invoice = await client.readRecord(TABLES.invoices, invoiceRecordId, Object.values(INVOICE_FIELDS));
        if (!invoice)
            throw new Error(`Invoice not found: ${invoiceRecordId}`);
        return { invoice, invoiceType: invoice.text(INVOICE_FIELDS.type), vendorType: invoice.text(INVOICE_FIELDS.vendorType), accounts: new Map(), payments: null };
    }
    function linkedIds(record, fieldId) { return [...new Set((record.value(fieldId) || []).map(link => link.id))]; }
    async function readRecords(tableId, recordIds, fields) {
        return await client.readRecords(tableId, [...new Set(recordIds)].sort(), fields);
    }
    async function linkedPayments(data) {
        if (!data.payments)
            data.payments = await readRecords(TABLES.payments, linkedIds(data.invoice, INVOICE_FIELDS.payments), Object.values(PAYMENT_FIELDS));
        return data.payments;
    }
    async function accountNumbers(data, ids) {
        const missing = ids.filter(id => !data.accounts.has(id));
        for (const account of await readRecords(TABLES.accounts, missing, Object.values(ACCOUNT_FIELDS)))
            data.accounts.set(account.id, account.text(ACCOUNT_FIELDS.number));
        return ids.map(id => data.accounts.get(id));
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
    function expensePosting(data, debit, credit, cents) {
        if (!cents)
            return [];
        const invoice = data.invoice;
        /** @type {any} */
        const context = { invoiceRecordId: invoice.id, sourceRecordId: invoice.id, branch: [], paymentRecordIds: linkedIds(invoice, INVOICE_FIELDS.payments) };
        const branch = invoice.value(INVOICE_FIELDS.branch);
        if (branch)
            context.branch = [branch.name];
        for (const [name, field] of [["vendor", INVOICE_FIELDS.vendors], ["client", INVOICE_FIELDS.clients], ["staff", INVOICE_FIELDS.staff], ["transaction", INVOICE_FIELDS.transactions], ["po", INVOICE_FIELDS.purchaseOrders]]) {
            const ids = linkedIds(invoice, field);
            context[`${name}RecordIds`] = ids;
            if (ids.length === 1)
                context[`${name}RecordId`] = ids[0];
        }
        const states = invoice.value(INVOICE_FIELDS.states) || [];
        context.stateRecordIds = states.map(link => link.id);
        context.stateNames = states.map(link => link.name);
        if (states.length === 1 && /^[A-Z]{2}$/.test(states[0].name))
            context.stateCode = states[0].name;
        return [{ debitAccount: { number: debit }, creditAccount: { number: credit }, amount: (cents / 100).toFixed(2), ...context }];
    }
    const handlers = { "EXP-02": handleCardExpense,
        "EXP-11": handleBankFees };
    return {
        fields: ({ TABLES, INVOICE_FIELDS }),
        async evaluate(rule, id) {
            const data = await loadExpenseData(id);
            if (data.invoice.text(INVOICE_FIELDS.status) !== "Fully Paid")
                return { data, results: [] };
            if (data.invoice)
                await client.loadLinkNames([data.invoice], [INVOICE_FIELDS.states]);
            const results = [];
            const handler = handlers[rule];
            if (!handler)
                throw new Error(`No handler for ${rule} in expense-fully-paid.`);
            await handler(data, results);
            return { data, results: results };
        }
    };
}
