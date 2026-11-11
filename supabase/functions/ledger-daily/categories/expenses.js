// Current Expense chart. Each handler owns its filters; the shared writer records supplied account pairs.
import { expenseWorkerFields as fields } from "../definitions.ts";

export function createCategories(client) {
    const { TABLES: T, INVOICE_FIELDS: I, LINE_FIELDS: L, PAYMENT_FIELDS: P,
        PREPAY_FIELDS: U, DEPRECIATION_FIELDS: D, ACCOUNT_FIELDS: A } = fields;
    const W2_ACCOUNTS = ["005.001", "005.002", "005.003", "005.005", "005.006"];
    const TAX_ACCOUNTS = { "923100": "011.001", "923300": "011.002" };

    // ==================== CORE ====================

    async function handleOperatingInvoice(data, results) {
        // Partial implementation - functioning: Utilities works; additional operating accounts await approval.
        const invoice = data.invoice;
        if (!invoiceMatches(invoice, "AP - Expenses (Non-Sales Tax)") || invoice.value(I.noVendorBill)) return;
        const account = await invoiceAccount(invoice);
        if (account !== "006.002") return;
        await addInvoice(results, data, "Enter an operating expense invoice (ex: Utilities)", account, "211.100");
    }

    async function handleOperatingPayment(data, results) {
        if (!sent(data)) return;
        const invoices = [];
        for (const invoice of data.invoices) {
            if (invoiceMatches(invoice, "AP - Expenses (Non-Sales Tax)") && !invoice.value(I.noVendorBill) && await invoiceAccount(invoice) === "006.002") invoices.push(invoice);
        }
        await addPayment(results, data, "When operating expenses are paid", invoices, "211.100");
    }

    async function handleProductInvoice(data, results) {
        if (!invoiceMatches(data.invoice, "AP - Product")) return;
        await addInvoice(results, data, "Every time a product invoice is created", "004.010", "211.100");
    }

    async function handleProductPayment(data, results) {
        if (!sent(data)) return;
        const invoices = data.invoices.filter(invoice => invoiceMatches(invoice, "AP - Product"));
        await addPayment(results, data, "Every time a product invoice is paid", invoices, "211.100");
    }

    async function handleCardPurchase(data, results) {
        if (!sent(data) || await paymentAccount(data.payment) !== "231.100") return;
        const invoices = [], accounts = [];
        for (const invoice of data.invoices) {
            if (!invoiceMatches(invoice, "AP - Expenses (Non-Sales Tax)") || !invoice.value(I.noVendorBill)) continue;
            const account = await invoiceAccount(invoice);
            if (account) { invoices.push(invoice); accounts.push(account); }
        }
        if (!invoices.length) return;
        const debit = singleAccount(accounts, "Card purchase expense");
        await addPayment(results, data, "Company credit-card purchase with NO vendor bill", invoices, debit, "231.100");
    }

    async function handlePrepaidInvoice(data, results) {
        if (!invoiceMatches(data.invoice, "AP - Assets") || !data.invoice.value(I.prepaid) || !await invoiceAccount(data.invoice)) return;
        await addInvoice(results, data, "Prepaid expense bill - Invoice, not paid", "135.000", "211.100");
    }

    async function handlePrepaidPayment(data, results) {
        if (!sent(data)) return;
        const invoices = [];
        for (const invoice of data.invoices) {
            if (invoiceMatches(invoice, "AP - Assets") && invoice.value(I.prepaid) && invoice.text(I.status) === "Fully Paid" && await invoiceAccount(invoice)) invoices.push(invoice);
        }
        await addPayment(results, data, "Prepaid Expense BILL (actually paid)", invoices, "211.100");
    }

    async function handlePrepaidUse(data, results) {
        if (data.record.value(U.cancelled)) return;
        const invoices = [], accounts = [];
        for (const invoice of data.invoices) {
            if (!invoiceMatches(invoice, "AP - Assets") || !invoice.value(I.prepaid)) continue;
            const account = await invoiceAccount(invoice);
            if (account) { invoices.push(invoice); accounts.push(account); }
        }
        if (!invoices.length) return;
        const debit = singleAccount(accounts, "Prepaid use-up expense");
        await addResult(results, data, "Prepaid expense - monthly use-up", debit, "135.000",
            moneyUnits(data.record.value(U.amount), 2, "Amount Deducted"), invoices, { notes: data.record.text(U.name) || undefined });
    }

    async function handleTechAllowance(data, results) {
        if (!invoiceMatches(data.invoice, "AP - Staff") || await lineAccount(data.record) !== "005.102") return;
        await addLine(results, data, "Employee Tech Allowance - Not Paid", "005.102", I.employeeBranch);
    }

    async function handleTechAllowancePayment(data, results) {
        if (!sent(data)) return;
        await addLinePayments(results, data, "Employee Tech Allowance - Paid", "AP - Staff", ["005.102"], "211.100", I.employeeBranch);
    }

    async function handleW2Payroll(data, results) {
        if (!invoiceMatches(data.invoice, "AP - Staff")) return;
        const account = await lineAccount(data.record);
        if (!W2_ACCOUNTS.includes(account)) return;
        await addLine(results, data, "Payroll - W2 payroll register, Owner", account);
    }

    async function handleW2Payment(data, results) {
        if (!sent(data)) return;
        await addLinePayments(results, data, "Payroll - W2 payroll register (Paid)", "AP - Staff", W2_ACCOUNTS, "211.100");
    }

    async function handleOffshorePayroll(data, results) {
        if (!invoiceMatches(data.invoice, "AP - Staff") || await lineAccount(data.record) !== "005.101") return;
        await addLine(results, data, "Payroll - offshore - unpaid", "005.101");
    }

    async function handleOffshorePayment(data, results) {
        if (!sent(data)) return;
        await addLinePayments(results, data, "Payroll - offshore - paid", "AP - Staff", ["005.101"], "211.100");
    }

    async function handleBonusInvoice(data, results) {
        if (!invoiceMatches(data.invoice, "AP - Staff") || await lineAccount(data.record) !== "005.201") return;
        await addLine(results, data, "Payroll - Bonuses (Unpaid)", "005.201");
    }

    async function handleBonusPayment(data, results) {
        if (!sent(data)) return;
        await addLinePayments(results, data, "Payroll - Bonuses (Paid)", "AP - Staff", ["005.201"], "211.100");
    }

    async function handleThirteenthPayment(data, results) {
        if (!sent(data)) return;
        await addLinePayments(results, data, "Payroll - offshore - Month-end accrual Bonus (Paid)", "AP - Staff", ["005.103"], "241.300");
    }

    async function handleDepreciation(data, results) {
        await client.loadLinkNames([data.record], [D.assets]);
        const assets = data.record.value(D.assets) || [];
        await addResult(results, data, "Monthly depreciation of equipment, vehicles, fixtures", "009.101", "161.000",
            moneyUnits(data.record.value(D.amount), 2, "Amount Depreciated"), [], {
                notes: assets.length ? "Associated asset: " + assets.map(asset => `${asset.name} (${asset.id})`).join("; ") : undefined,
            });
    }

    async function handleBankFeeInvoice(data, results) {
        if (!invoiceMatches(data.invoice, "AP - Expenses (Non-Sales Tax)") || data.invoice.value(I.noVendorBill) || await invoiceAccount(data.invoice) !== "007.002") return;
        await addInvoice(results, data, "Bank fees and charges (Unpaid)", "007.002", "211.100");
    }

    async function handleBankFeePayment(data, results) {
        if (!sent(data)) return;
        const invoices = [];
        for (const invoice of data.invoices) {
            if (invoiceMatches(invoice, "AP - Expenses (Non-Sales Tax)") && !invoice.value(I.noVendorBill) && await invoiceAccount(invoice) === "007.002") invoices.push(invoice);
        }
        await addPayment(results, data, "Bank fees and charges (Paid)", invoices, "211.100");
    }

    async function handleTaxInvoice(data, results) {
        if (!invoiceMatches(data.invoice, "AP - Expenses (Non-Sales Tax)")) return;
        const account = await lineAccount(data.record);
        if (!TAX_ACCOUNTS[account]) return;
        await addLine(results, data, "Income tax accrual (quarterly)", TAX_ACCOUNTS[account]);
    }

    async function handleTaxPayment(data, results) {
        if (!sent(data)) return;
        await addLinePayments(results, data, "Income tax accrual (Paid)", "AP - Expenses (Non-Sales Tax)", Object.keys(TAX_ACCOUNTS), "211.100");
    }

    async function handleThirteenthAccrual() {
        // Not implemented: the red 13th-month accrual is deferred.
        throw new Error("Not yet implemented: 13th-month bonus accrual is deferred.");
    }
    async function handleBadDebtReserve() {
        // Not implemented: the red bad-debt reserve is deferred.
        throw new Error("Not yet implemented: bad-debt reserve is deferred.");
    }
    async function handleBadDebtWriteOff() {
        // Not implemented: the red bad-debt write-off is deferred.
        throw new Error("Not yet implemented: bad-debt write-off is deferred.");
    }
    async function handleBadDebtRecovery() {
        // Not implemented: the red bad-debt recovery is deferred.
        throw new Error("Not yet implemented: bad-debt recovery is deferred.");
    }

    // ==================== UTILS ====================

    const ids = (record, field) => [...new Set((record.value(field) || []).map(link => link.id))];
    const invoiceMatches = (invoice, vendorType) => invoice.text(I.type) === "AP" && invoice.text(I.vendorType) === vendorType && !invoice.value(I.cancelled);
    const sent = data => Boolean(data.payment.value(P.sent)) && !data.payment.value(P.cancelled) && !data.payment.value(P.returned);

    async function accountNumbers(accountIds) {
        const records = await client.readRecords(T.accounts, accountIds, Object.values(A));
        return records.map(record => record.text(A.number));
    }
    async function invoiceAccount(invoice) {
        return (await accountNumbers(ids(invoice, I.accounts)))[0];
    }
    function singleAccount(accounts, label) {
        const unique = [...new Set(accounts)];
        if (unique.length !== 1) throw new Error(`${label} must identify one account; no amount split is defined.`);
        return unique[0];
    }
    async function paymentAccount(payment) {
        return singleAccount(await accountNumbers(ids(payment, P.accounts)), "Payment account");
    }
    async function lineAccount(line) {
        const accounts = await accountNumbers(ids(line, L.accounts));
        if (!accounts.length) return null;
        return singleAccount(accounts, `Invoice Line ${line.id}`);
    }
    function moneyUnits(value, precision, label) {
        if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} is missing or not a finite number.`);
        const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
        const units = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + precision}`));
        if (!Number.isSafeInteger(units)) throw new Error(`${label} exceeds safe money precision.`);
        return units === 0 ? 0 : units;
    }
    function context(data, invoices, branchField = I.branch, sourceLines = []) {
        const invoiceIds = invoices.map(invoice => invoice.id);
        const posting = { sourceRecordId: data.record.id, invoiceRecordIds: invoiceIds, branch: [] };
        if (invoiceIds.length === 1) posting.invoiceRecordId = invoiceIds[0];
        if (sourceLines.length) posting.sourceRecordIds = sourceLines.map(line => line.id).sort();
        for (const [name, field] of [["vendor", I.vendors], ["client", I.clients], ["staff", I.staff], ["transaction", I.transactions], ["po", I.purchaseOrders]]) {
            posting[`${name}RecordIds`] = [...new Set(invoices.flatMap(invoice => ids(invoice, field)))].sort();
        }
        posting.stateRecordIds = [...new Set(invoices.flatMap(invoice => ids(invoice, I.states)))].sort();
        const branches = invoices.map(invoice => {
            const value = invoice.value(branchField);
            return Array.isArray(value) ? value : value?.name ? [value.name] : [];
        });
        posting.branch = branches.some(values => !values.length) ? [] : [...new Set(branches.flat())];
        return posting;
    }
    async function addResult(results, data, category, debit, credit, cents, invoices, options = {}) {
        if (!cents) return;
        results.push({ category, ...(options.entryKey ? { entryKey: options.entryKey } : {}),
            ...(options.notes ? { notes: options.notes } : {}),
            postings: [{ debitAccount: { number: debit }, creditAccount: { number: credit }, amount: (cents / 100).toFixed(2),
                ...context(data, invoices, options.branchField, options.lines) }] });
    }
    async function addInvoice(results, data, name, debit, credit) {
        await addResult(results, data, name, debit, credit, moneyUnits(data.invoice.value(I.amount), 2, "Invoice Amount"), [data.invoice]);
    }
    async function addLine(results, data, name, debit, branchField = I.branch) {
        await addResult(results, data, name, debit, "211.100", moneyUnits(data.record.value(L.amount), 2, "Line Amount"), [data.invoice], { branchField });
    }
    async function addPayment(results, data, name, invoices, debit, credit) {
        if (!invoices.length) return;
        // Payment Amount is one unsplit movement, even when several invoice references are linked.
        await addResult(results, data, name, debit, credit || await paymentAccount(data.payment),
            moneyUnits(data.payment.value(P.amount), 2, "Payment Amount"), invoices);
    }
    async function addLinePayments(results, data, name, vendorType, accounts, debit, branchField = I.branch) {
        // shortcut: these invoices receive one full payment; revisit selection if partial payments are introduced.
        const invoices = data.invoices.filter(invoice => invoiceMatches(invoice, vendorType) && invoice.text(I.status) === "Fully Paid");
        if (!invoices.length) return;
        const credit = await paymentAccount(data.payment);
        for (const invoice of invoices) {
            const lines = await client.readRecords(T.lines, ids(invoice, I.lines), Object.values(L));
            const groups = new Map();
            for (const line of lines) {
                const account = await lineAccount(line);
                if (!accounts.includes(account) || line.value(L.amount) === null) continue;
                const owners = ids(line, L.invoices);
                if (owners.length !== 1 || owners[0] !== invoice.id) throw new Error(`Invoice Line ${line.id} must belong to one matching invoice.`);
                if (!groups.has(account)) groups.set(account, { cents: 0, lines: [] });
                const group = groups.get(account);
                group.cents += moneyUnits(line.value(L.amount), 2, "Line Amount");
                if (!Number.isSafeInteger(group.cents)) throw new Error("Account line total exceeds safe money precision.");
                group.lines.push(line);
            }
            for (const [account, group] of groups) {
                await addResult(results, data, name, debit, credit, group.cents, [invoice], { entryKey: invoice.id + ":" + account, branchField, lines: group.lines });
            }
        }
    }

    async function loadData(tableId, recordId) {
        const sourceFields = tableId === T.invoices ? I : tableId === T.lines ? L : tableId === T.payments ? P : tableId === T.prepay ? U : tableId === T.depreciation ? D : null;
        if (!sourceFields) throw new Error("Unsupported Expense source table.");
        const record = await client.readRecord(tableId, recordId, Object.values(sourceFields));
        if (!record) throw new Error(`Expense source record not found: ${recordId}`);
        const data = { record, invoices: [], entryDate: null };
        if (tableId === T.invoices) {
            data.invoice = record; data.entryDate = record.value(I.date);
        } else if (tableId === T.lines) {
            const invoiceIds = ids(record, L.invoices);
            if (invoiceIds.length !== 1) throw new Error(`Invoice Line ${recordId} must belong to one invoice.`);
            data.invoice = await client.readRecord(T.invoices, invoiceIds[0], Object.values(I));
            if (!data.invoice) throw new Error(`Linked invoice not found: ${invoiceIds[0]}`);
            data.entryDate = data.invoice.value(I.date);
        } else if (tableId === T.payments) {
            data.payment = record; data.entryDate = record.value(P.date);
            data.invoices = await client.readRecords(T.invoices, ids(record, P.invoices), Object.values(I));
        } else if (tableId === T.prepay) {
            data.invoices = await client.readRecords(T.invoices, ids(record, U.invoices), Object.values(I));
            data.entryDate = record.value(U.date);
        } else data.entryDate = record.value(D.date);
        return data;
    }

    const handlers = {
        "EXP-01": handleOperatingInvoice, "EXP-02": handleCardPurchase, "EXP-03": handlePrepaidInvoice,
        "EXP-04": handlePrepaidUse, "EXP-05": handleTechAllowance, "EXP-06": handleW2Payroll,
        "EXP-07": handleOffshorePayroll, "EXP-09": handleBonusInvoice,
        "EXP-10": handleDepreciation, "EXP-11": handleBankFeeInvoice, "EXP-12": handleBadDebtReserve,
        "EXP-13": handleTaxInvoice, "EXP-14": handleOperatingPayment, "EXP-15": handleProductInvoice,
        "EXP-16": handleProductPayment, "EXP-17": handlePrepaidPayment, "EXP-18": handleTechAllowancePayment,
        "EXP-19": handleW2Payment, "EXP-20": handleOffshorePayment, "EXP-21": handleBonusPayment,
        "EXP-22": handleThirteenthAccrual, "EXP-23": handleThirteenthPayment, "EXP-24": handleBadDebtWriteOff,
        "EXP-25": handleBadDebtRecovery, "EXP-26": handleTaxPayment, "EXP-27": handleBankFeePayment,
    };
    return { fields, async evaluate(rule, recordId, tableId) {
        const handler = handlers[rule];
        if (!handler) throw new Error(`Unknown Expense category ${rule}.`);
        if (["EXP-12", "EXP-22", "EXP-24", "EXP-25"].includes(rule)) await handler();
        const data = await loadData(tableId, recordId), results = [];
        await handler(data, results);
        return { data, results };
    } };
}
