// payment-sent: category filters and calculations ported from the native FIN sender.
// Transport and logs live outside this module; handlers prepare posting pairs only.
import { paymentSentFields as fields } from "../definitions.ts";
export function createCategories(client) {
    const { TABLES, PAYMENT_FIELDS, LINE_FIELDS, INVOICE_FIELDS, CREDIT_FIELDS, ACCOUNT_FIELDS, CREDIT_CARD_ACCOUNT, BANK_ACCOUNT_NUMBERS, BANK_PAYMENT_METHODS } = fields;
    // ==================== CORE ====================
    // Each category checks its filters and prepares matching journals.
    async function handleVendorPaymentReturned(data, results) {
        // Partial implementation - functioning: current return entry works; the new cancellation/deletion workflow is deferred.
        if (data.invoiceType !== "AP" || !data.payment.value(PAYMENT_FIELDS.returned))
            return;
        const cents = moneyCents(data.payment.value(PAYMENT_FIELDS.amount), "Payment Amount");
        results.push({
            category: "Vendor payment cancelled / returned", tChartRow: 13,
            postings: cents ? [{ debitAccount: { number: "112.100" }, creditAccount: { number: "211.100" }, amount: moneyString(cents), sourceRecordId: data.payment.id }] : []
        });
    }
    async function handleCustomerDeposit(data, results) {
        if (data.invoiceType !== "AR" || data.vendorType !== "AR - Product")
            return;
        const paymentDate = data.payment.value(PAYMENT_FIELDS.date);
        const matches = data.invoices.filter(invoice => {
            const shipOutDate = parseFirstShipOutDate(invoice);
            if (shipOutDate && !paymentDate)
                throw new Error(`Payment Date is missing for shipment comparison with invoice ${invoice.id}.`);
            return !shipOutDate || paymentDate <= shipOutDate;
        });
        if (!matches.length)
            return;
        results.push({
            postings: postingPairs(paymentAccountSource(data), { number: "221.100" }, invoiceComponents(data, matches)),
            category: "CUSTOMER DEPOSIT RECEIVED (before the order is processed)", tChartRow: 2
        });
    }
    async function handleCustomerPaymentAfterShipment(data, results) {
        if (data.invoiceType !== "AR" || data.vendorType !== "AR - Product")
            return;
        const paymentDate = data.payment.value(PAYMENT_FIELDS.date);
        const matches = data.invoices.filter(invoice => {
            const shipOutDate = parseFirstShipOutDate(invoice);
            if (shipOutDate && !paymentDate)
                throw new Error(`Payment Date is missing for shipment comparison with invoice ${invoice.id}.`);
            return shipOutDate && paymentDate > shipOutDate;
        });
        if (!matches.length)
            return;
        results.push({
            postings: postingPairs(paymentAccountSource(data), { number: "121.100" }, invoiceComponents(data, matches)),
            category: "Customer payment AFTER the order shipped (credit-terms clients)", tChartRow: 3
        });
    }
    async function handleClientOverpayment(data, results) {
        // Partial implementation - functioning: credit-payment mapping works; overlap with the original receipt remains under review.
        if (data.invoiceType !== "AR" || data.vendorType !== "AR - Refund/Credit")
            return;
        const matches = data.invoices.filter(invoice => invoice.text(INVOICE_FIELDS.application) === "Credit to Another Order");
        if (!matches.length)
            return;
        results.push({
            postings: postingPairs(paymentAccountSource(data), { number: "221.300" }, invoiceComponents(data, matches)),
            category: "Client OVERPAYS or pays with no invoice to apply it to", tChartRow: 4
        });
    }
    async function handleSmallPaymentDifference(data, results) {
        if (data.invoiceType !== "AR" || data.vendorType !== "AR - Product")
            return;
        const overpaid = data.payment.value(PAYMENT_FIELDS.overpaid) || 0;
        if (overpaid > 0 && overpaid <= 1) {
            results.push({
                postings: postingPairs({ number: "007.002" }, { number: "121.100" }, amountComponents(data, data.invoices, moneyCents(overpaid, "Overpaid Amount"))),
                category: "Small short-pay / rounding difference written off", tChartRow: 5
            });
        }
        for (const invoice of data.invoices) {
            const remaining = invoice.value(INVOICE_FIELDS.remaining);
            if (!(remaining > 0 && remaining <= 5))
                continue;
            const expected = moneyUnits(invoice.value(INVOICE_FIELDS.amountToPay), 4, "Invoice Amount To Pay") - moneyUnits(invoice.value(INVOICE_FIELDS.totalPaid), 4, "Total Paid Amount");
            if (Math.abs(moneyUnits(remaining, 4, "Invoice Remaining Balance") - expected) > 1)
                throw new Error(`Invoice ${invoice.id} Remaining Balance does not reconcile to Amount To Pay minus Total Paid Amount.`);
            results.push({
                invoice, ruleCode: "PAY-04", category: "Small short-pay / rounding difference written off", tChartRow: 5,
                postings: postingPairs({ number: "007.002" }, { number: "121.100" }, [postingComponent(data, invoice, moneyCents(remaining, "Invoice Remaining Balance"))])
            });
        }
    }
    async function handleClientCashRefund(data, results) {
        if (data.invoiceType !== "AR" || data.vendorType !== "AR - Refund/Credit")
            return;
        const matches = data.invoices.filter(invoice => invoice.text(INVOICE_FIELDS.application) === "Cash Refund");
        if (!matches.length)
            return;
        results.push({
            postings: postingPairs({ number: "221.100" }, paymentAccountSource(data), invoiceComponents(data, matches)),
            category: "Refund to a client - by bank / check", tChartRow: 6
        });
    }
    async function handleVendorBankPayment(data, results) {
        const { payment } = data;
        if (data.invoiceType !== "AP" ||
            data.vendorType !== "AP - Product" ||
            payment.value(PAYMENT_FIELDS.returned) ||
            payment.text(PAYMENT_FIELDS.recordType) !== "Regular Payment" ||
            !BANK_PAYMENT_METHODS.includes(payment.text(PAYMENT_FIELDS.method)))
            return;
        const matches = data.invoices.filter(invoice => getLinkedRecords(invoice, INVOICE_FIELDS.purchaseOrders).length > 0 || getLinkedRecords(invoice, INVOICE_FIELDS.vendors).length > 0);
        if (!matches.length)
            return;
        results.push({
            postings: postingPairs({ number: "211.100" }, paymentAccountSource(data), invoiceComponents(data, matches)),
            category: "Pay a vendor / bill from the bank (ACH, wire, check, Nickel, Wise)", tChartRow: 8
        });
    }
    async function handleVendorCardPayment(data, results) {
        const { payment } = data;
        if (data.invoiceType !== "AP" ||
            data.vendorType !== "AP - Product" ||
            payment.text(PAYMENT_FIELDS.recordType) !== "Regular Payment" ||
            !getLinkedRecords(payment, PAYMENT_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "231.100"))
            return;
        const matches = data.invoices.filter(invoice => getLinkedRecords(invoice, INVOICE_FIELDS.purchaseOrders).length > 0 || getLinkedRecords(invoice, INVOICE_FIELDS.vendors).length > 0);
        if (!matches.length)
            return;
        results.push({
            postings: postingPairs({ number: "211.100" }, CREDIT_CARD_ACCOUNT, invoiceComponents(data, matches)),
            category: "Pay a vendor with the company credit card", tChartRow: 9
        });
    }
    async function handleCreditCardStatementPayment(data, results) {
        const { payment } = data;
        if (payment.text(PAYMENT_FIELDS.recordType) !== "CC Batch Payment" ||
            !getLinkedRecords(payment, PAYMENT_FIELDS.miniPayments).length ||
            !data.paymentHasBankAccount)
            return;
        results.push({
            postings: postingPairs(CREDIT_CARD_ACCOUNT, paymentAccountSource(data), await cardStatementComponents(data)),
            category: "Pay the credit-card statement", tChartRow: 10
        });
    }
    async function handleVendorRefund(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Credit")
            return;
        results.push({
            postings: postingPairs(paymentAccountSource(data), { number: "211.100" }, invoiceComponents(data, data.invoices)),
            category: "Vendor sends us a refund", tChartRow: 14
        });
    }
    async function handleStaffPayment(data, results) {
        // Partial implementation - functioning: mapped payroll liabilities work; bank wire/FX fees and employee benefits are excluded.
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Staff")
            return;
        const liabilityAccounts = { "005.101": "241.100", "005.003": "241.100", "005.001": "241.100", "005.002": "241.100", "005.006": "241.200", "005.005": "241.400" };
        const lines = await readInvoiceLines(data, Object.keys(liabilityAccounts));
        if (!lines.length)
            return;
        // Bank wire and FX fees stay excluded until their source and amount are defined.
        addLineAccountEntries(data, results, lines, liabilityAccounts, 16, "Pay offshore / 1099 / owner staff (Wise, ACH)");
    }
    async function handleLoanPayment(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)")
            return;
        const lines = await readInvoiceLines(data, ["232.100", "231.200", "007.003"]);
        if (!lines.some(item => item.accountNumber === "232.100"))
            return;
        addLineAccountEntries(data, results, repaymentLines(lines, "232.100"), { "232.100": "232.100", "007.003": "007.003" }, 17, "Loan payment (principal + interest)");
    }
    async function handleLineOfCreditDraw(data, results) {
        if (data.invoiceType !== "AR" || data.vendorType !== "AR - Non-Product")
            return;
        const matches = data.invoices.filter(invoice => getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "231.200"));
        if (!matches.length)
            return;
        results.push({
            postings: postingPairs(paymentAccountSource(data), { number: "231.200" }, purposeComponents(data, matches)),
            category: "Line of credit - borrow (draw)", tChartRow: 18
        });
    }
    async function handleLineOfCreditRepayment(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)")
            return;
        const lines = await readInvoiceLines(data, ["232.100", "231.200", "007.003"]);
        if (!lines.some(item => item.accountNumber === "231.200"))
            return;
        addLineAccountEntries(data, results, repaymentLines(lines, "231.200"), { "231.200": "231.200", "007.003": "007.003" }, 19, "Line of credit - repay");
    }
    async function handleBankTransfer(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)" || !data.paymentHasBankAccount)
            return;
        const paymentAccountId = getLinkedRecords(data.payment, PAYMENT_FIELDS.accounts)[0].id;
        const matches = data.invoices.filter(invoice => getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => BANK_ACCOUNT_NUMBERS.includes(data.accountNumbersById.get(account.id) || "") && account.id !== paymentAccountId));
        if (!matches.length)
            return;
        for (const invoice of matches) {
            const banks = getLinkedRecords(invoice, INVOICE_FIELDS.accounts).filter(account => BANK_ACCOUNT_NUMBERS.includes(data.accountNumbersById.get(account.id)));
            if (banks.length !== 1)
                throw new Error(`Invoice ${invoice.id} must identify one source bank account.`);
        }
        const calculated = purposeComponents(data, matches);
        for (const [entryKey, components] of groupByInvoiceAccount(calculated)) {
            results.push({
                entryKey, postings: postingPairs(paymentAccountSource(data), components[0].invoiceAccount, components),
                category: "Move money between our own bank accounts", tChartRow: 20
            });
        }
    }
    async function handleOwnerDistribution(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)")
            return;
        const matches = data.invoices.filter(invoice => getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "316.100"));
        if (!matches.length)
            return;
        results.push({
            postings: postingPairs({ number: "316.100" }, paymentAccountSource(data), purposeComponents(data, matches)),
            category: "Owner distribution paid", tChartRow: 21
        });
    }
    async function handleOwnerContribution(data, results) {
        if (data.invoiceType !== "AR" || data.vendorType !== "AR - Non-Product")
            return;
        const matches = data.invoices.filter(invoice => getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "311.200"));
        if (!matches.length)
            return;
        results.push({
            postings: postingPairs(paymentAccountSource(data), { number: "311.200" }, purposeComponents(data, matches)),
            category: "Owner puts money into the company", tChartRow: 22
        });
    }
    async function handleIncomeTaxPayment(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)")
            return;
        const matches = data.invoices.filter(invoice => getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => ["242.100", "242.200"].includes(data.accountNumbersById.get(account.id) || "")));
        if (!matches.length)
            return;
        const calculated = purposeComponents(data, matches);
        for (const [entryKey, components] of groupByInvoiceAccount(calculated)) {
            results.push({
                entryKey, postings: postingPairs(components[0].invoiceAccount, paymentAccountSource(data), components),
                category: "Income tax payment", tChartRow: 23
            });
        }
    }
    async function handleInsuranceClaimReceipt(data, results) {
        // Partial implementation - not functioning: known filters are implemented; matching invoices throw Not yet implemented until the debit mapping is defined.
        if (data.invoiceType !== "AR" || data.vendorType !== "AR - Non-Product")
            return;
        const matches = data.invoices.filter(invoice => getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "122.100"));
        if (!matches.length)
            return;
        // Not yet implemented: the chart has not defined the bank/recovery split.
        throw new Error("Not yet implemented: T-Chart row 24 is blocked: Actual Triggers does not define how Payments.Amount splits into bank and insurance-recovery amounts.");
    }
    async function handleSecurityDepositPayment(data, results) {
        if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)")
            return;
        const matches = data.invoices.filter(invoice => getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "143.200"));
        if (!matches.length)
            return;
        results.push({
            postings: postingPairs({ number: "143.200" }, paymentAccountSource(data), purposeComponents(data, matches)),
            category: "Security deposit paid (lease)", tChartRow: 25
        });
    }
    async function handleEarlyPaymentDiscount(data, results) {
        // Partial implementation - not functioning: known filters are implemented; matching invoices throw Not yet implemented until the credit mapping is defined.
        if (data.invoiceType !== "AP")
            return;
        for (const invoice of data.invoices) {
            if (invoice.text(INVOICE_FIELDS.paymentStatus) !== "Fully Paid")
                continue;
            const amount = invoice.value(INVOICE_FIELDS.discountTotal);
            if (amount == null || amount === 0)
                continue;
            const lines = (await readInvoiceLines(data)).filter(item => item.invoice?.id === invoice.id && item.line.text(LINE_FIELDS.type) === "Discount" && item.line.text(LINE_FIELDS.discountStatus) !== "Expired");
            if (!lines.length)
                throw new Error(`Not yet implemented: T-Chart row 11 has Discount Lines Total but no qualifying discount lines on invoice ${invoice.id}.`);
            // Not yet implemented: sum Line Amount by account; the discount credit account is pending.
            throw new Error("Not yet implemented: T-Chart row 11 is blocked: the credit account is pending. Sum qualifying Invoice Lines.Line Amount by Chart of Accounts.");
        }
    }
    async function handleVendorCreditApplication(data, results) {
        if (data.invoiceType !== "AP")
            return;
        const matches = data.invoices.filter(invoice => invoice.text(INVOICE_FIELDS.paymentStatus) === "Fully Paid" &&
            invoice.value(INVOICE_FIELDS.creditsApplied) != null &&
            invoice.value(INVOICE_FIELDS.creditsApplied) !== 0);
        if (!matches.length)
            return;
        const creditIds = [];
        for (const invoice of matches) {
            const ids = linkedIds(invoice, INVOICE_FIELDS.sourceCredits);
            if (!ids.length)
                throw new Error(`Invoice ${invoice.id} has Credits Applied but no source credit invoice.`);
            creditIds.push(...ids);
        }
        const credits = await client.readRecords(TABLES.invoices, creditIds, Object.values(CREDIT_FIELDS));
        const creditsById = new Map(credits.map(invoice => [invoice.id, invoice]));
        for (const invoice of matches) {
            const applied = moneyUnits(invoice.value(INVOICE_FIELDS.creditsApplied), 2, `Invoice ${invoice.id} Credits Applied`);
            const sources = linkedIds(invoice, INVOICE_FIELDS.sourceCredits).map(id => creditsById.get(id));
            const weights = sources.map(credit => {
                if (credit.id === invoice.id || credit.text(CREDIT_FIELDS.type) !== "AP" || credit.text(CREDIT_FIELDS.vendorTypeAP) !== "AP - Credit")
                    throw new Error(`Invoice ${invoice.id} does not reference a valid AP credit invoice.`);
                if (!linkedIds(credit, CREDIT_FIELDS.recipientInvoices).includes(invoice.id))
                    throw new Error(`Source credit ${credit.id} does not link back to bill ${invoice.id}.`);
                const available = moneyUnits(credit.value(CREDIT_FIELDS.available), 4, `Source credit ${credit.id} Available Credits`);
                if (available > 0)
                    throw new Error(`Source credit ${credit.id} has a positive Available Credits amount; expected a native negative credit.`);
                return { id: credit.id, cents: -available };
            });
            const availableUnits = weights.reduce((sum, weight) => sum + weight.cents, 0);
            if (!Number.isSafeInteger(availableUnits))
                throw new Error("Source credit total exceeds safe precision.");
            if (applied > 0 || -applied > Math.round(availableUnits / 100))
                throw new Error(`Invoice ${invoice.id} has an invalid applied-credit amount for its source credits.`);
            // Credits Applied = ROUND(SUM(Available Credits) * bill proportion, 4), so all sources share the same factor.
            const allocations = allocateCents(applied, weights);
            results.push({
                invoice, tChartRow: 12, ruleCode: "PAY-11", category: "Bill paid using vendor credits (no cash)",
                credits: sources.map(credit => ({ id: credit.id, name: credit.name, cents: allocations.get(credit.id) })),
                postings: sources.filter(credit => allocations.get(credit.id)).map(credit => ({
                    debitAccount: { number: "211.100" }, creditAccount: { number: "211.100" }, amount: moneyString(allocations.get(credit.id)),
                    ...componentContext(data, invoice), sourceRecordId: credit.id,
                    debitInvoiceRecordId: invoice.id, creditInvoiceRecordId: credit.id
                }))
            });
        }
    }
    async function handleCreditCardRebate(data, results) {
        if (data.invoiceType !== "AR" || data.vendorType !== "AR - Non-Product")
            return;
        for (const invoice of data.invoices) {
            if (!getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "004.011"))
                continue;
            if (invoice.text(INVOICE_FIELDS.paymentStatus) !== "Fully Paid")
                continue;
            const amount = invoice.value(INVOICE_FIELDS.rebateTotal);
            if (amount == null || amount === 0)
                continue;
            const cents = moneyUnits(amount, 2, `Invoice ${invoice.id} Purchased Discounts & Rebate Total`);
            results.push({
                invoice, tChartRow: 28, ruleCode: "PAY-27", category: "Credit-card rebate earned (cash back)",
                postings: cents ? [{ debitAccount: { number: "231.100" }, creditAccount: { number: "004.011" }, amount: moneyString(cents), ...componentContext(data, invoice) }] : []
            });
        }
    }
    // Payroll row 15 remains deferred until its filters and amount are defined.
    async function handlePayrollPayment() {
        // Not yet implemented: T-Chart row 15 has no Actual Triggers definition.
        throw new Error("Not yet implemented: T-Chart row 15 payroll trigger and amount mapping are undefined.");
    }
    async function handleFidelityIncome(data, results) {
        if (data.invoiceType !== "AR" || data.vendorType !== "AR - Non-Product")
            return;
        for (const invoice of data.invoices) {
            if (!getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "010.003"))
                continue;
            const cents = moneyCents(invoice.value(INVOICE_FIELDS.amount), `Invoice ${invoice.id} Invoice Amount`);
            results.push({
                invoice, ruleCode: "PAY-25", tChartRow: 26, category: "Interest / dividends received (Fidelity)",
                postings: postingPairs({ number: "112.200" }, { number: "010.003" }, [postingComponent(data, invoice, cents)])
            });
        }
    }
    function getLinkedRecords(record, fieldId) { return record.value(fieldId) || []; }
    function linkedIds(record, fieldId) { return [...new Set(getLinkedRecords(record, fieldId).map(link => link.id))].sort(); }
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
        const invoiceLinks = getLinkedRecords(payment, PAYMENT_FIELDS.invoices);
        return { payment, invoiceType: payment.text(PAYMENT_FIELDS.type), vendorType: payment.text(PAYMENT_FIELDS.vendorType), invoiceLinks };
    }
    async function loadInvoiceData(data) {
        const invoices = await client.readRecords(TABLES.invoices, data.invoiceLinks.map(link => link.id), Object.values(INVOICE_FIELDS));
        const ids = [...getLinkedRecords(data.payment, PAYMENT_FIELDS.accounts), ...invoices.flatMap(invoice => getLinkedRecords(invoice, INVOICE_FIELDS.accounts))].map(link => link.id);
        const accounts = await client.readRecords(TABLES.accounts, ids, Object.values(ACCOUNT_FIELDS));
        const accountNumbersById = new Map(accounts.map(account => [account.id, account.text(ACCOUNT_FIELDS.number)]));
        const paymentHasBankAccount = getLinkedRecords(data.payment, PAYMENT_FIELDS.accounts).some(account => BANK_ACCOUNT_NUMBERS.includes(accountNumbersById.get(account.id) || ""));
        return { invoices, accountNumbersById, paymentHasBankAccount };
    }
    function parseFirstShipOutDate(invoice) {
        const value = invoice.text(INVOICE_FIELDS.firstShipDate);
        if (!value)
            return "";
        // This lookup is limited to one M/D/YYYY date. Compare without a timezone shift.
        const [month, day, year] = value.split("/");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    // Posting components stay separate from console-formatted filter details.
    function moneyCents(value, label) {
        if (typeof value !== "number" || !Number.isFinite(value))
            throw new Error(`${label} is missing or is not a finite number.`);
        const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
        const cents = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + 2}`));
        if (!Number.isSafeInteger(cents))
            throw new Error(`${label} exceeds safe cent precision.`);
        return cents === 0 ? 0 : cents;
    }
    function moneyUnits(value, precision, label) {
        if (typeof value !== "number" || !Number.isFinite(value))
            throw new Error(`${label} is missing or is not a finite number.`);
        const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
        const units = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + precision}`));
        if (!Number.isSafeInteger(units))
            throw new Error(`${label} exceeds safe money precision.`);
        return units === 0 ? 0 : units;
    }
    function moneyString(cents) { return (cents / 100).toFixed(2); }
    function allocateCents(totalCents, weights) {
        if (!Number.isSafeInteger(totalCents) || weights.some(weight => !Number.isSafeInteger(weight.cents)))
            throw new Error("Allocation exceeds safe cent precision.");
        if (new Set(weights.filter(weight => weight.cents).map(weight => Math.sign(weight.cents))).size > 1)
            throw new Error("Mixed-sign invoice amounts require an explicit allocation before posting.");
        const sign = Math.sign(weights.find(weight => weight.cents)?.cents || 1);
        const ordered = weights.map(weight => ({ ...weight, cents: weight.cents * sign })).sort((a, b) => a.id.localeCompare(b.id));
        const sum = ordered.reduce((total, weight) => total + weight.cents, 0);
        if (!Number.isSafeInteger(sum))
            throw new Error("Allocation exceeds safe cent precision.");
        if (!sum && totalCents)
            throw new Error("Cannot allocate a payment against zero invoice amounts.");
        const parts = ordered.map(weight => {
            const product = totalCents * weight.cents;
            if (!Number.isSafeInteger(product))
                throw new Error("Allocation exceeds safe cent precision.");
            return { id: weight.id, cents: sum ? Math.trunc(product / sum) : 0, remainder: sum ? product % sum : 0 };
        });
        const direction = Math.sign(totalCents);
        let remainder = totalCents - parts.reduce((total, part) => total + part.cents, 0);
        for (const part of [...parts].sort((a, b) => direction * (b.remainder - a.remainder) || a.id.localeCompare(b.id))) {
            if (!remainder)
                break;
            part.cents += direction;
            remainder -= direction;
        }
        return new Map(parts.map(part => [part.id, part.cents === 0 ? 0 : part.cents]));
    }
    function invoiceWeights(invoices) {
        const values = invoices.map(invoice => ({ id: invoice.id, cents: moneyCents(invoice.value(INVOICE_FIELDS.amountToPay), `Invoice ${invoice.id} Amount To Pay`) }));
        if (new Set(values.filter(value => value.cents).map(value => Math.sign(value.cents))).size > 1)
            throw new Error("Mixed-sign invoice amounts require an explicit allocation before posting.");
        return values;
    }
    function invoiceAllocations(data) {
        if (!data.invoiceAllocations) {
            const amount = moneyCents(data.payment.value(PAYMENT_FIELDS.amount), "Payment Amount");
            if (data.invoices.length === 1)
                data.invoiceAllocations = new Map([[data.invoices[0].id, amount]]);
            else
                data.invoiceAllocations = amount ? allocateCents(amount, invoiceWeights(data.invoices)) : new Map(data.invoices.map(invoice => [invoice.id, 0]));
        }
        return data.invoiceAllocations;
    }
    function accountSource(data, link) { return { recordId: link.id, number: data.accountNumbersById.get(link.id) || "" }; }
    function paymentAccountSource(data) {
        const accounts = getLinkedRecords(data.payment, PAYMENT_FIELDS.accounts);
        if (accounts.length > 1)
            throw new Error("The payment must identify one payment account.");
        return accounts.length ? accountSource(data, accounts[0]) : null;
    }
    function postingPairs(debitAccount, creditAccount, components) {
        return components.filter(component => component.amount !== "0.00").map(component => ({
            debitAccount, creditAccount, ...component
        }));
    }
    function componentContext(data, invoice) {
        if (!invoice)
            return { sourceRecordId: data.payment.id, branch: [] };
        /** @type {any} */
        const context = { invoiceRecordId: invoice.id, sourceRecordId: invoice.id, branch: [] };
        const branch = invoice.value(INVOICE_FIELDS.branch);
        if (branch)
            context.branch = [branch.name];
        const refs = [
            ["vendor", INVOICE_FIELDS.vendors], ["client", INVOICE_FIELDS.clients],
            ["staff", INVOICE_FIELDS.staff], ["transaction", INVOICE_FIELDS.transactions],
            ["po", INVOICE_FIELDS.purchaseOrders],
        ];
        for (const [name, field] of refs) {
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
        const accounts = getLinkedRecords(invoice, INVOICE_FIELDS.accounts);
        context.invoiceAccounts = accounts.map(link => accountSource(data, link));
        if (accounts.length === 1)
            context.invoiceAccount = context.invoiceAccounts[0];
        return context;
    }
    function postingComponent(data, invoice, cents) {
        return { amount: moneyString(cents), ...componentContext(data, invoice) };
    }
    function invoiceComponents(data, invoices) {
        const shares = invoiceAllocations(data);
        return invoices.map(invoice => postingComponent(data, invoice, shares.get(invoice.id)));
    }
    function amountComponents(data, invoices, totalCents) {
        if (!invoices.length)
            return [postingComponent(data, null, totalCents)];
        if (invoices.length === 1)
            return [postingComponent(data, invoices[0], totalCents)];
        const shares = totalCents ? allocateCents(totalCents, invoiceWeights(invoices)) : new Map(invoices.map(invoice => [invoice.id, 0]));
        return invoices.map(invoice => postingComponent(data, invoice, shares.get(invoice.id)));
    }
    function purposeComponents(data, invoices) {
        const shares = invoiceAllocations(data);
        return invoices.map(invoice => {
            if (getLinkedRecords(invoice, INVOICE_FIELDS.accounts).length > 1 && shares.get(invoice.id)) {
                // Not yet implemented: no split among multiple account purposes is specified.
                throw new Error(`Not yet implemented: Invoice ${invoice.id} is blocked: Actual Triggers does not define a payment split across multiple linked accounts.`);
            }
            return postingComponent(data, invoice, shares.get(invoice.id));
        });
    }
    function groupByInvoiceAccount(components) {
        const groups = new Map();
        for (const component of components) {
            const key = component.invoiceAccount.number;
            if (!groups.has(key))
                groups.set(key, []);
            groups.get(key).push(component);
        }
        return groups;
    }
    async function readInvoiceLines(data, accountNumbers) {
        if (!data.invoiceLines) {
            const ids = data.invoices.flatMap(invoice => linkedIds(invoice, INVOICE_FIELDS.lines));
            const lines = await client.readRecords(TABLES.lines, ids, Object.values(LINE_FIELDS));
            const accountIds = lines.flatMap(line => linkedIds(line, LINE_FIELDS.accounts)).filter(id => !data.accountNumbersById.has(id));
            for (const account of await client.readRecords(TABLES.accounts, accountIds, Object.values(ACCOUNT_FIELDS)))
                data.accountNumbersById.set(account.id, account.text(ACCOUNT_FIELDS.number));
            data.invoiceLines = lines.map(line => {
                const invoices = data.invoices.filter(invoice => linkedIds(invoice, INVOICE_FIELDS.lines).includes(line.id));
                const accounts = getLinkedRecords(line, LINE_FIELDS.accounts);
                return { line, invoice: invoices[0], invoices, accountNumbers: accounts.map(account => data.accountNumbersById.get(account.id)), accountNumber: accounts.length === 1 ? data.accountNumbersById.get(accounts[0].id) : "" };
            });
        }
        const matches = accountNumbers ? data.invoiceLines.filter(item => item.accountNumbers.some(number => accountNumbers.includes(number))) : data.invoiceLines;
        for (const item of matches) {
            if (item.invoices.length !== 1 || !linkedIds(item.line, LINE_FIELDS.invoices).includes(item.invoice.id))
                throw new Error(`Invoice line ${item.line.id} must belong to one linked invoice with reciprocal links.`);
            if (item.accountNumbers.length !== 1)
                throw new Error(`Invoice line ${item.line.id} must identify one chart of account before posting.`);
        }
        return matches;
    }
    function repaymentLines(lines, principal) {
        const otherPrincipal = principal === "232.100" ? "231.200" : "232.100";
        return lines.filter(item => {
            if (item.accountNumber === principal)
                return true;
            if (item.accountNumber !== "007.003")
                return false;
            const invoiceAccounts = new Set(lines.filter(line => line.invoice.id === item.invoice.id).map(line => line.accountNumber));
            if (invoiceAccounts.has(principal) && !invoiceAccounts.has(otherPrincipal))
                return true;
            if (invoiceAccounts.has(otherPrincipal) && !invoiceAccounts.has(principal))
                return false;
            if (lines.some(line => line.accountNumber === otherPrincipal))
                throw new Error("Not yet implemented: a payment linking both auto-loan and LOC principal needs an explicit interest allocation.");
            return true;
        });
    }
    function addLineAccountEntries(data, results, lines, debitAccounts, tChartRow, category) {
        const groups = new Map();
        for (const { line, invoice, accountNumber } of lines) {
            if (!groups.has(accountNumber))
                groups.set(accountNumber, new Map());
            const invoices = groups.get(accountNumber);
            if (!invoices.has(invoice.id))
                invoices.set(invoice.id, { invoice, units: 0, sourceRecordIds: [] });
            const group = invoices.get(invoice.id);
            group.units += moneyUnits(line.value(LINE_FIELDS.amount), 4, `Line ${line.id} Amount`);
            if (!Number.isSafeInteger(group.units))
                throw new Error(`Account ${accountNumber} total exceeds safe money precision.`);
            group.sourceRecordIds.push(line.id);
        }
        for (const [entryKey, invoices] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
            results.push({
                tChartRow, category, entryKey,
                postings: postingPairs({ number: debitAccounts[entryKey] }, paymentAccountSource(data), [...invoices.values()].map(group => ({
                    ...postingComponent(data, group.invoice, moneyCents(group.units / 10000, "Account line total")), sourceRecordId: undefined, sourceRecordIds: group.sourceRecordIds.sort()
                })))
            });
        }
    }
    async function cardStatementComponents(data) {
        const links = getLinkedRecords(data.payment, PAYMENT_FIELDS.miniPayments);
        const minis = await client.readRecords(TABLES.payments, links.map(link => link.id), [PAYMENT_FIELDS.amount, PAYMENT_FIELDS.method, PAYMENT_FIELDS.invoices]);
        const groups = new Map();
        for (const mini of minis) {
            const method = mini.text(PAYMENT_FIELDS.method);
            if (!["CC - Amex", "CC - Visa"].includes(method))
                throw new Error(`Mini-payment ${mini.id} needs a specific credit-card method.`);
            if (!groups.has(method))
                groups.set(method, { id: method, cents: 0, miniPaymentRecordIds: [], invoiceRecordIds: [] });
            const group = groups.get(method);
            const cents = moneyCents(mini.value(PAYMENT_FIELDS.amount), `Mini-payment ${mini.id} Amount`);
            group.cents += cents;
            group.miniPaymentRecordIds.push(mini.id);
            group.invoiceRecordIds.push(...getLinkedRecords(mini, PAYMENT_FIELDS.invoices).map(link => link.id));
        }
        const total = moneyCents(data.payment.value(PAYMENT_FIELDS.amount), "Payment Amount");
        const allocations = allocateCents(total, [...groups.values()]);
        const invoiceIds = [...new Set([...groups.values()].flatMap(group => group.invoiceRecordIds))];
        const invoices = await client.readRecords(TABLES.invoices, invoiceIds, [INVOICE_FIELDS.branch]);
        const branches = new Map(invoices.map(invoice => [invoice.id, invoice.value(INVOICE_FIELDS.branch)?.name]));
        return [...groups.values()].map(group => ({
            amount: moneyString(allocations.get(group.id)), paymentMethod: group.id,
            sourceRecordId: data.payment.id, miniPaymentRecordIds: group.miniPaymentRecordIds,
            invoiceRecordIds: [...new Set(group.invoiceRecordIds)],
            branch: [...new Set(group.invoiceRecordIds.map(id => branches.get(id) || ""))]
        }));
    }
    const handlers = {
        "PAY-01": handleCustomerDeposit,
        "PAY-02": handleCustomerPaymentAfterShipment,
        "PAY-03": handleClientOverpayment,
        "PAY-04": handleSmallPaymentDifference,
        "PAY-05": handleClientCashRefund,
        "PAY-07": handleVendorBankPayment,
        "PAY-08": handleVendorCardPayment,
        "PAY-09": handleCreditCardStatementPayment,
        "PAY-10": handleEarlyPaymentDiscount,
        "PAY-11": handleVendorCreditApplication,
        "PAY-12": handleVendorPaymentReturned,
        "PAY-13": handleVendorRefund,
        "PAY-14": handlePayrollPayment,
        "PAY-15": handleStaffPayment,
        "PAY-16": handleLoanPayment,
        "PAY-17": handleLineOfCreditDraw,
        "PAY-18": handleLineOfCreditRepayment,
        "PAY-19": handleBankTransfer,
        "PAY-20": handleOwnerDistribution,
        "PAY-21": handleOwnerContribution,
        "PAY-22": handleIncomeTaxPayment,
        "PAY-23": handleInsuranceClaimReceipt,
        "PAY-24": handleSecurityDepositPayment,
        "PAY-25": handleFidelityIncome,
        "PAY-27": handleCreditCardRebate
    };
    return {
        fields,
        async evaluate(rule, id, eventType) {
            const data = await (async () => { const data = await loadPaymentData(id); return { ...data, ...await loadInvoiceData(data) }; })();
            await client.loadLinkNames(data.invoices || [], [INVOICE_FIELDS.states].filter(Boolean));
            const results = [];
            const handler = handlers[rule];
            if (!handler)
                throw new Error(`No handler for ${rule} in payment-sent.`);
            await handler(data, results);
            return { data, results: results };
        },
    };
}
