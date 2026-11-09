// Ported from airtable/expense-entry.js. No native trigger gate or transport runs here.
import { expenseFields as fields } from "../definitions.ts";
export function createCategories(client) {
    const { TABLES, INVOICE_FIELDS, LINE_FIELDS, ACCOUNT_FIELDS } = fields;
    async function handleOperatingExpense(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)")
            return;
        const accounts = await invoiceAccountNumbers(data);
        if (!accounts.includes("006.002"))
            return;
        if (accounts.length !== 1)
            throw new Error("Not yet implemented: Utilities uses the full Invoice Amount; multiple invoice accounts need separate amounts.");
        const units = moneyUnits(data.invoice.value(INVOICE_FIELDS.amount), 4, "Invoice Amount");
        results.push({ category: "Enter an operating expense invoice (ex: Utilities)", tChartRow: 2, postings: expensePosting(data, "006.002", "211.100", units, data.invoice.id) });
    }
    async function handlePrepaidExpense(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)" || !data.invoice.value(INVOICE_FIELDS.prepaid))
            return;
        const units = moneyUnits(data.invoice.value(INVOICE_FIELDS.amount), 4, "Invoice Amount");
        results.push({ category: "Prepaid expense bill (pay a year up front, e.g., insurance)", tChartRow: 4, postings: expensePosting(data, "135.000", "211.100", units, data.invoice.id) });
    }
    async function handleTechAllowance(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Staff")
            return;
        const lines = await matchingInvoiceLines(data, ["005.102"]);
        if (!lines.length)
            return;
        const postings = [];
        for (const { line } of lines) {
            const units = moneyUnits(line.value(LINE_FIELDS.amount), 4, `Line Amount on ${line.id}`);
            postings.push(...expensePosting(data, "005.102", "211.100", units, line.id));
        }
        const employeeBranches = data.invoice.value(INVOICE_FIELDS.employeeBranch) || [];
        for (const posting of postings)
            posting.branch = employeeBranches;
        results.push({ category: "Employee Tech Allowance", tChartRow: 6, postings });
    }
    async function handleW2Payroll(data, results) {
        // Partial implementation - functioning: wages, payroll tax and 401k work; employee benefits remain excluded.
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Staff")
            return;
        const creditAccounts = { "005.002": "241.100", "005.006": "241.200", "005.005": "241.400" };
        const lines = await matchingInvoiceLines(data, Object.keys(creditAccounts));
        if (!lines.length)
            return;
        const postings = [];
        for (const { line, accountNumber } of lines) {
            const units = moneyUnits(line.value(LINE_FIELDS.amount), 4, `Line Amount on ${line.id}`);
            postings.push(...expensePosting(data, accountNumber, creditAccounts[accountNumber], units, line.id));
        }
        // Employee benefits 241.600 stay excluded until their counteraccount is defined.
        results.push({ category: "Payroll - W2 payroll register (per pay date)", tChartRow: 7, postings });
    }
    async function handleOffshorePayroll(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Staff")
            return;
        const lines = await matchingInvoiceLines(data, ["005.101", "005.003", "005.001"]);
        if (!lines.length)
            return;
        const postings = [];
        for (const { line, accountNumber } of lines) {
            const units = moneyUnits(line.value(LINE_FIELDS.amount), 4, `Line Amount on ${line.id}`);
            postings.push(...expensePosting(data, accountNumber, "241.100", units, line.id));
        }
        results.push({ category: "Payroll - offshore / 1099 / owner staff invoice", tChartRow: 8, postings });
    }
    async function handleBonusCommission(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Staff")
            return;
        const lines = await matchingInvoiceLines(data, ["005.201"]);
        if (!lines.length)
            return;
        const postings = [];
        for (const { line } of lines) {
            const units = moneyUnits(line.value(LINE_FIELDS.amount), 4, `Line Amount on ${line.id}`);
            postings.push(...expensePosting(data, "005.201", "241.300", units, line.id));
        }
        results.push({ category: "Month-end accrual - bonus & commission earned", tChartRow: 10, postings });
    }
    async function handleBadDebtReserve(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)")
            return;
        const accounts = await invoiceAccountNumbers(data);
        if (!accounts.includes("007.005"))
            return;
        const units = moneyUnits(data.invoice.value(INVOICE_FIELDS.amount), 4, "Invoice Amount");
        results.push({ category: "Bad-debt reserve (allowance) - month-end", tChartRow: 13, postings: expensePosting(data, "007.005", "121.900", units, data.invoice.id) });
    }
    async function handleIncomeTaxAccrual(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)")
            return;
        const accounts = await invoiceAccountNumbers(data);
        const taxAccounts = accounts.filter(number => number === "242.100" || number === "242.200");
        if (!taxAccounts.length)
            return;
        if (taxAccounts.length !== 1)
            throw new Error("Not yet implemented: Expense row 14 requires exactly one tax account; multiple accounts need separate amounts.");
        const credit = taxAccounts[0], debit = credit === "242.100" ? "011.001" : "011.002";
        const units = moneyUnits(data.invoice.value(INVOICE_FIELDS.amount), 4, "Invoice Amount");
        results.push({ category: "Income tax accrual (quarterly)", tChartRow: 14, postings: expensePosting(data, debit, credit, units, data.invoice.id) });
    }
    async function loadExpenseData(invoiceRecordId) {
        if (!invoiceRecordId)
            throw new Error("Map invoiceRecordId to the trigger's FIN Airtable record ID.");
        const invoice = await client.readRecord(TABLES.invoices, invoiceRecordId, Object.values(INVOICE_FIELDS));
        if (!invoice)
            throw new Error(`Invoice not found: ${invoiceRecordId}`);
        return {
            invoice, invoiceType: invoice.text(INVOICE_FIELDS.type),
            vendorType: invoice.text(INVOICE_FIELDS.vendorType),
            accounts: new Map(), lines: null,
        };
    }
    function accountEntries(result) {
        if (!result.postings.length)
            return [result];
        const groups = new Map();
        for (const posting of result.postings) {
            const key = posting.debitAccount.number;
            if (!groups.has(key))
                groups.set(key, []);
            const group = groups.get(key);
            if (group.length && group[0].creditAccount.number !== posting.creditAccount.number)
                throw new Error(`Account ${key} has multiple credit mappings; separate amounts are required.`);
            group.push(posting);
        }
        return [...groups].map(([entryKey, postings]) => {
            const units = postings.reduce((total, posting) => total + moneyUnits(Number(posting.amount), 4, "Account amount"), 0);
            if (!Number.isSafeInteger(units))
                throw new Error(`Account ${entryKey} total exceeds safe money precision.`);
            const cents = moneyCents(units / 10000, "Account total");
            const sourceRecordIds = [...new Set(postings.map(posting => posting.sourceRecordId))].sort();
            const posting = { ...postings[0], amount: (cents / 100).toFixed(2) };
            if (sourceRecordIds.length > 1) {
                posting.sourceRecordId = posting.invoiceRecordId;
                posting.sourceRecordIds = sourceRecordIds;
            }
            return { ...result, entryKey, postings: [posting] };
        });
    }
    function linkedIds(record, fieldId) { return [...new Set((record.value(fieldId) || []).map(link => link.id))]; }
    async function readRecords(tableId, recordIds, fields) {
        return await client.readRecords(tableId, [...new Set(recordIds)].sort(), fields);
    }
    async function accountNumbers(data, ids) {
        const missing = ids.filter(id => !data.accounts.has(id));
        for (const account of await readRecords(TABLES.accounts, missing, Object.values(ACCOUNT_FIELDS))) {
            data.accounts.set(account.id, account.text(ACCOUNT_FIELDS.number));
        }
        return ids.map(id => data.accounts.get(id));
    }
    async function invoiceAccountNumbers(data) { return await accountNumbers(data, linkedIds(data.invoice, INVOICE_FIELDS.accounts)); }
    async function matchingInvoiceLines(data, numbers) {
        if (!data.lines)
            data.lines = await readRecords(TABLES.lines, linkedIds(data.invoice, INVOICE_FIELDS.lines), Object.values(LINE_FIELDS));
        const allAccountIds = [...new Set(data.lines.flatMap(line => linkedIds(line, LINE_FIELDS.accounts)))];
        await accountNumbers(data, allAccountIds);
        const matches = [];
        for (const line of data.lines) {
            const codes = linkedIds(line, LINE_FIELDS.accounts).map(id => data.accounts.get(id));
            if (!codes.some(code => numbers.includes(code)))
                continue;
            if (codes.length !== 1)
                throw new Error(`Not yet implemented: Invoice Line ${line.id} links multiple accounts; its Line Amount cannot be split without a mapping.`);
            const invoices = linkedIds(line, LINE_FIELDS.invoices);
            if (invoices.length !== 1 || invoices[0] !== data.invoice.id)
                throw new Error(`Invoice Line ${line.id} must belong only to invoice ${data.invoice.id}.`);
            matches.push({ line, accountNumber: codes[0] });
        }
        return matches;
    }
    function moneyCents(value, label) { return moneyUnits(value, 2, label); }
    function moneyUnits(value, precision, label) {
        if (typeof value !== "number" || !Number.isFinite(value))
            throw new Error(`${label} is missing or is not a finite number.`);
        const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
        const units = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + precision}`));
        if (!Number.isSafeInteger(units))
            throw new Error(`${label} exceeds safe money precision.`);
        return units === 0 ? 0 : units;
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
    function expensePosting(data, debit, credit, units, sourceRecordId) {
        if (!units)
            return [];
        const invoice = data.invoice;
        /** @type {any} */
        const context = { invoiceRecordId: invoice.id, sourceRecordId, branch: [] };
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
        return [{ debitAccount: { number: debit }, creditAccount: { number: credit }, amount: (units / 10000).toFixed(4), ...context }];
    }
    const handlers = { "EXP-01": handleOperatingExpense,
        "EXP-03": handlePrepaidExpense,
        "EXP-05": handleTechAllowance,
        "EXP-06": handleW2Payroll,
        "EXP-07": handleOffshorePayroll,
        "EXP-09": handleBonusCommission,
        "EXP-12": handleBadDebtReserve,
        "EXP-13": handleIncomeTaxAccrual };
    return {
        fields: ({ TABLES, INVOICE_FIELDS, LINE_FIELDS }),
        async evaluate(rule, id) {
            const data = await loadExpenseData(id);
            if (data.invoice)
                await client.loadLinkNames([data.invoice], [INVOICE_FIELDS.states]);
            const results = [];
            const handler = handlers[rule];
            if (!handler)
                throw new Error(`No handler for ${rule} in expense-entry.`);
            await handler(data, results);
            return { data, results: results.flatMap(accountEntries) };
        }
    };
}
