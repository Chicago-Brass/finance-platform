// FIN Payment Sent - qualify all Sent categories and post payment-owned and invoice-owned ledger entries.
// Airtable inputs: paymentRecordId, ledgerWebhookUrl. Secret: Dual Ledger Webhook Secret.
// See DOCS at bottom.

// ==================== CORE ====================
// Each category checks its filters, then handles and logs a match.

async function handleVendorPaymentReturned(data, results) {
    // Partial implementation - functioning: current return entry works; the new cancellation/deletion workflow is deferred.
    if (data.invoiceType !== "AP" || !data.payment.getCellValue(PAYMENT_FIELDS.returned)) return;

    const cents = moneyCents(data.payment.getCellValue(PAYMENT_FIELDS.amount), "Payment Amount");

    results.push({
        category: "Vendor payment cancelled / returned", tChartRow: 13,
        postings: cents ? [{ debitAccount: { number: "112.100" }, creditAccount: { number: "211.100" }, amount: moneyString(cents), sourceRecordId: data.payment.id }] : [],
        ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.returned, PAYMENT_FIELDS.type, PAYMENT_FIELDS.amount]),
    });
}

async function handleCustomerDeposit(data, results) {
    if (data.invoiceType !== "AR" || data.vendorType !== "AR - Product") return;
    const paymentDate = data.payment.getCellValue(PAYMENT_FIELDS.date);
    const matches = data.invoices.filter(invoice => {
        const shipOutDate = parseFirstShipOutDate(invoice);
        if (shipOutDate && !paymentDate) throw new Error(`Payment Date is missing for shipment comparison with invoice ${invoice.id}.`);
        return !shipOutDate || paymentDate <= shipOutDate;
    });
    if (!matches.length) return;

    results.push({
        postings: postingPairs(paymentAccountSource(data), { number: "221.100" }, invoiceComponents(data, matches)),
        category: "CUSTOMER DEPOSIT RECEIVED (before the order is processed)", tChartRow: 2,
        ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType, PAYMENT_FIELDS.date], matches, [INVOICE_FIELDS.firstShipDate]),
    });
}

async function handleCustomerPaymentAfterShipment(data, results) {
    if (data.invoiceType !== "AR" || data.vendorType !== "AR - Product") return;
    const paymentDate = data.payment.getCellValue(PAYMENT_FIELDS.date);
    const matches = data.invoices.filter(invoice => {
        const shipOutDate = parseFirstShipOutDate(invoice);
        if (shipOutDate && !paymentDate) throw new Error(`Payment Date is missing for shipment comparison with invoice ${invoice.id}.`);
        return shipOutDate && paymentDate > shipOutDate;
    });
    if (!matches.length) return;

    results.push({
        postings: postingPairs(paymentAccountSource(data), { number: "121.100" }, invoiceComponents(data, matches)),
        category: "Customer payment AFTER the order shipped (credit-terms clients)", tChartRow: 3,
        ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType, PAYMENT_FIELDS.date], matches, [INVOICE_FIELDS.firstShipDate]),
    });
}

async function handleClientOverpayment(data, results) {
    // Partial implementation - functioning: credit-payment mapping works; overlap with the original receipt remains under review.
    if (data.invoiceType !== "AR" || data.vendorType !== "AR - Refund/Credit") return;
    const matches = data.invoices.filter(invoice => invoice.getCellValueAsString(INVOICE_FIELDS.application) === "Credit to Another Order");
    if (!matches.length) return;

    results.push({
        postings: postingPairs(paymentAccountSource(data), { number: "221.300" }, invoiceComponents(data, matches)),
        category: "Client OVERPAYS or pays with no invoice to apply it to", tChartRow: 4,
        ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType, PAYMENT_FIELDS.amount], matches, [INVOICE_FIELDS.application]),
    });
}

async function handleSmallPaymentDifference(data, results) {
    if (data.invoiceType !== "AR" || data.vendorType !== "AR - Product") return;
    const overpaid = data.payment.getCellValue(PAYMENT_FIELDS.overpaid) || 0;
    if (overpaid > 0 && overpaid <= 1) {
        results.push({
            postings: postingPairs({ number: "007.002" }, { number: "121.100" }, amountComponents(data, data.invoices, moneyCents(overpaid, "Overpaid Amount"))),
            category: "Small short-pay / rounding difference written off", tChartRow: 5,
            ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType, PAYMENT_FIELDS.overpaid]),
        });
    }
    for (const invoice of data.invoices) {
        const remaining = invoice.getCellValue(INVOICE_FIELDS.remaining);
        if (!(remaining > 0 && remaining <= 5)) continue;
        const expected = moneyUnits(invoice.getCellValue(INVOICE_FIELDS.amountToPay), 4, "Invoice Amount To Pay") - moneyUnits(invoice.getCellValue(INVOICE_FIELDS.totalPaid), 4, "Total Paid Amount");
        if (Math.abs(moneyUnits(remaining, 4, "Invoice Remaining Balance") - expected) > 1) throw new Error(`Invoice ${invoice.id} Remaining Balance does not reconcile to Amount To Pay minus Total Paid Amount.`);
        results.push({
            invoice, ruleCode: "PAY-04", category: "Small short-pay / rounding difference written off", tChartRow: 5,
            postings: postingPairs({ number: "007.002" }, { number: "121.100" }, [postingComponent(data, invoice, moneyCents(remaining, "Invoice Remaining Balance"))]),
            ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType], [invoice], [INVOICE_FIELDS.remaining, INVOICE_FIELDS.amountToPay, INVOICE_FIELDS.totalPaid]),
        });
    }
}

async function handleClientCashRefund(data, results) {
    if (data.invoiceType !== "AR" || data.vendorType !== "AR - Refund/Credit") return;
    const matches = data.invoices.filter(invoice => invoice.getCellValueAsString(INVOICE_FIELDS.application) === "Cash Refund");
    if (!matches.length) return;

    results.push({
        postings: postingPairs({ number: "221.100" }, paymentAccountSource(data), invoiceComponents(data, matches)),
        category: "Refund to a client - by bank / check", tChartRow: 6,
        ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType], matches, [INVOICE_FIELDS.application]),
    });
}

async function handleVendorBankPayment(data, results) {
    const { payment } = data;
    if (
        data.invoiceType !== "AP" ||
        data.vendorType !== "AP - Product" ||
        payment.getCellValue(PAYMENT_FIELDS.returned) ||
        payment.getCellValueAsString(PAYMENT_FIELDS.recordType) !== "Regular Payment" ||
        !BANK_PAYMENT_METHODS.includes(payment.getCellValueAsString(PAYMENT_FIELDS.method))
    ) return;
    const matches = data.invoices.filter(invoice => getLinkedRecords(invoice, INVOICE_FIELDS.purchaseOrders).length > 0 || getLinkedRecords(invoice, INVOICE_FIELDS.vendors).length > 0);
    if (!matches.length) return;

    results.push({
        postings: postingPairs({ number: "211.100" }, paymentAccountSource(data), invoiceComponents(data, matches)),
        category: "Pay a vendor / bill from the bank (ACH, wire, check, Nickel, Wise)", tChartRow: 8,
        ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.returned, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType, PAYMENT_FIELDS.recordType, PAYMENT_FIELDS.method], matches, [INVOICE_FIELDS.purchaseOrders, INVOICE_FIELDS.vendors]),
    });
}

async function handleVendorCardPayment(data, results) {
    const { payment } = data;
    if (
        data.invoiceType !== "AP" ||
        data.vendorType !== "AP - Product" ||
        payment.getCellValueAsString(PAYMENT_FIELDS.recordType) !== "Regular Payment" ||
        !getLinkedRecords(payment, PAYMENT_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "231.100")
    ) return;
    const matches = data.invoices.filter(invoice => getLinkedRecords(invoice, INVOICE_FIELDS.purchaseOrders).length > 0 || getLinkedRecords(invoice, INVOICE_FIELDS.vendors).length > 0);
    if (!matches.length) return;

    results.push({
        postings: postingPairs({ number: "211.100" }, CREDIT_CARD_ACCOUNT, invoiceComponents(data, matches)),
        category: "Pay a vendor with the company credit card", tChartRow: 9,
        ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType, PAYMENT_FIELDS.recordType, PAYMENT_FIELDS.accounts], matches, [INVOICE_FIELDS.purchaseOrders, INVOICE_FIELDS.vendors]),
    });
}

async function handleCreditCardStatementPayment(data, results) {
    const { payment } = data;
    if (
        payment.getCellValueAsString(PAYMENT_FIELDS.recordType) !== "CC Batch Payment" ||
        !getLinkedRecords(payment, PAYMENT_FIELDS.miniPayments).length ||
        !data.paymentHasBankAccount
    ) return;

    results.push({
        postings: postingPairs(CREDIT_CARD_ACCOUNT, paymentAccountSource(data), await cardStatementComponents(data)),
        category: "Pay the credit-card statement", tChartRow: 10,
        ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.recordType, PAYMENT_FIELDS.miniPayments, PAYMENT_FIELDS.accounts]),
    });
}

async function handleVendorRefund(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Credit") return;

    results.push({
        postings: postingPairs(paymentAccountSource(data), { number: "211.100" }, invoiceComponents(data, data.invoices)),
        category: "Vendor sends us a refund", tChartRow: 14,
        ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType, PAYMENT_FIELDS.accounts]),
    });
}

async function handleStaffPayment(data, results) {
    // Partial implementation - functioning: mapped payroll liabilities work; bank wire/FX fees and employee benefits are excluded.
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Staff") return;
    const liabilityAccounts = { "005.101": "241.100", "005.003": "241.100", "005.001": "241.100", "005.002": "241.100", "005.006": "241.200", "005.005": "241.400" };
    const lines = await readInvoiceLines(data, Object.keys(liabilityAccounts));
    if (!lines.length) return;
    // Bank wire and FX fees stay excluded until their source and amount are defined.
    addLineAccountEntries(data, results, lines, liabilityAccounts, 16, "Pay offshore / 1099 / owner staff (Wise, ACH)");
}

async function handleLoanPayment(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)") return;
    const lines = await readInvoiceLines(data, ["232.100", "231.200", "007.003"]);
    if (!lines.some(item => item.accountNumber === "232.100")) return;
    addLineAccountEntries(data, results, repaymentLines(lines, "232.100"), { "232.100": "232.100", "007.003": "007.003" }, 17, "Loan payment (principal + interest)");
}

async function handleLineOfCreditDraw(data, results) {
    if (data.invoiceType !== "AR" || data.vendorType !== "AR - Non-Product") return;
    const matches = data.invoices.filter(invoice =>
        getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "231.200")
    );
    if (!matches.length) return;

    results.push({
        postings: postingPairs(paymentAccountSource(data), { number: "231.200" }, purposeComponents(data, matches)),
        category: "Line of credit - borrow (draw)", tChartRow: 18,
        ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType], matches, [INVOICE_FIELDS.accounts]),
    });
}

async function handleLineOfCreditRepayment(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)") return;
    const lines = await readInvoiceLines(data, ["232.100", "231.200", "007.003"]);
    if (!lines.some(item => item.accountNumber === "231.200")) return;
    addLineAccountEntries(data, results, repaymentLines(lines, "231.200"), { "231.200": "231.200", "007.003": "007.003" }, 19, "Line of credit - repay");
}

async function handleBankTransfer(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)" || !data.paymentHasBankAccount) return;
    const paymentAccountId = getLinkedRecords(data.payment, PAYMENT_FIELDS.accounts)[0].id;
    const matches = data.invoices.filter(invoice =>
        getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => BANK_ACCOUNT_NUMBERS.includes(data.accountNumbersById.get(account.id) || "") && account.id !== paymentAccountId)
    );
    if (!matches.length) return;

    for (const invoice of matches) {
        const banks = getLinkedRecords(invoice, INVOICE_FIELDS.accounts).filter(account => BANK_ACCOUNT_NUMBERS.includes(data.accountNumbersById.get(account.id)));
        if (banks.length !== 1) throw new Error(`Invoice ${invoice.id} must identify one source bank account.`);
    }
    const calculated = purposeComponents(data, matches);
    for (const [entryKey, components] of groupByInvoiceAccount(calculated)) {
        results.push({
            entryKey, postings: postingPairs(paymentAccountSource(data), components[0].invoiceAccount, components),
            category: "Move money between our own bank accounts", tChartRow: 20,
            ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType, PAYMENT_FIELDS.accounts], matches.filter(invoice => components.some(component => component.invoiceRecordId === invoice.id)), [INVOICE_FIELDS.accounts]),
        });
    }
}

async function handleOwnerDistribution(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)") return;
    const matches = data.invoices.filter(invoice =>
        getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "316.100")
    );
    if (!matches.length) return;

    results.push({
        postings: postingPairs({ number: "316.100" }, paymentAccountSource(data), purposeComponents(data, matches)),
        category: "Owner distribution paid", tChartRow: 21,
        ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType], matches, [INVOICE_FIELDS.accounts]),
    });
}

async function handleOwnerContribution(data, results) {
    if (data.invoiceType !== "AR" || data.vendorType !== "AR - Non-Product") return;
    const matches = data.invoices.filter(invoice =>
        getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "311.200")
    );
    if (!matches.length) return;

    results.push({
        postings: postingPairs(paymentAccountSource(data), { number: "311.200" }, purposeComponents(data, matches)),
        category: "Owner puts money into the company", tChartRow: 22,
        ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType], matches, [INVOICE_FIELDS.accounts]),
    });
}

async function handleIncomeTaxPayment(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)") return;
    const matches = data.invoices.filter(invoice =>
        getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => ["242.100", "242.200"].includes(data.accountNumbersById.get(account.id) || ""))
    );
    if (!matches.length) return;

    const calculated = purposeComponents(data, matches);
    for (const [entryKey, components] of groupByInvoiceAccount(calculated)) {
        results.push({
            entryKey, postings: postingPairs(components[0].invoiceAccount, paymentAccountSource(data), components),
            category: "Income tax payment", tChartRow: 23,
            ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType], matches.filter(invoice => components.some(component => component.invoiceRecordId === invoice.id)), [INVOICE_FIELDS.accounts]),
        });
    }
}

async function handleInsuranceClaimReceipt(data, results) {
    // Partial implementation - not functioning: known filters are implemented; matching invoices throw Not yet implemented until the debit mapping is defined.
    if (data.invoiceType !== "AR" || data.vendorType !== "AR - Non-Product") return;
    const matches = data.invoices.filter(invoice =>
        getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "122.100")
    );
    if (!matches.length) return;

    // Not yet implemented: the chart has not defined the bank/recovery split.
    throw new Error("Not yet implemented: T-Chart row 24 is blocked: Actual Triggers does not define how Payments.Amount splits into bank and insurance-recovery amounts.");
}

async function handleSecurityDepositPayment(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)") return;
    const matches = data.invoices.filter(invoice =>
        getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "143.200")
    );
    if (!matches.length) return;

    results.push({
        postings: postingPairs({ number: "143.200" }, paymentAccountSource(data), purposeComponents(data, matches)),
        category: "Security deposit paid (lease)", tChartRow: 25,
        ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType], matches, [INVOICE_FIELDS.accounts]),
    });
}

async function handleEarlyPaymentDiscount(data, results) {
    // Partial implementation - not functioning: known filters are implemented; matching invoices throw Not yet implemented until the credit mapping is defined.
    if (data.invoiceType !== "AP") return;
    for (const invoice of data.invoices) {
        if (invoice.getCellValueAsString(INVOICE_FIELDS.paymentStatus) !== "Fully Paid") continue;
        const amount = invoice.getCellValue(INVOICE_FIELDS.discountTotal);
        if (amount == null || amount === 0) continue;
        const lines = (await readInvoiceLines(data)).filter(item => item.invoice?.id === invoice.id && item.line.getCellValueAsString(LINE_FIELDS.type) === "Discount" && item.line.getCellValueAsString(LINE_FIELDS.discountStatus) !== "Expired");
        if (!lines.length) throw new Error(`Not yet implemented: T-Chart row 11 has Discount Lines Total but no qualifying discount lines on invoice ${invoice.id}.`);
        // Not yet implemented: sum Line Amount by account; the discount credit account is pending.
        throw new Error("Not yet implemented: T-Chart row 11 is blocked: the credit account is pending. Sum qualifying Invoice Lines.Line Amount by Chart of Accounts.");
    }
}

async function handleVendorCreditApplication(data, results) {
    if (data.invoiceType !== "AP") return;
    const matches = data.invoices.filter(invoice =>
        invoice.getCellValueAsString(INVOICE_FIELDS.paymentStatus) === "Fully Paid" &&
        invoice.getCellValue(INVOICE_FIELDS.creditsApplied) != null &&
        invoice.getCellValue(INVOICE_FIELDS.creditsApplied) !== 0
    );
    if (!matches.length) return;

    const creditIds = [];
    for (const invoice of matches) {
        const ids = linkedIds(invoice, INVOICE_FIELDS.sourceCredits);
        if (!ids.length) throw new Error(`Invoice ${invoice.id} has Credits Applied but no source credit invoice.`);
        creditIds.push(...ids);
    }
    const credits = await readRecords(TABLES.invoices, creditIds, Object.values(CREDIT_FIELDS));
    const creditsById = new Map(credits.map(invoice => [invoice.id, invoice]));

    for (const invoice of matches) {
        const applied = moneyUnits(invoice.getCellValue(INVOICE_FIELDS.creditsApplied), 2, `Invoice ${invoice.id} Credits Applied`);
        const sources = linkedIds(invoice, INVOICE_FIELDS.sourceCredits).map(id => creditsById.get(id));
        const weights = sources.map(credit => {
            if (credit.id === invoice.id || credit.getCellValueAsString(CREDIT_FIELDS.type) !== "AP" || credit.getCellValueAsString(CREDIT_FIELDS.vendorTypeAP) !== "AP - Credit") throw new Error(`Invoice ${invoice.id} does not reference a valid AP credit invoice.`);
            if (!linkedIds(credit, CREDIT_FIELDS.recipientInvoices).includes(invoice.id)) throw new Error(`Source credit ${credit.id} does not link back to bill ${invoice.id}.`);
            const available = moneyUnits(credit.getCellValue(CREDIT_FIELDS.available), 4, `Source credit ${credit.id} Available Credits`);
            if (available > 0) throw new Error(`Source credit ${credit.id} has a positive Available Credits amount; expected a native negative credit.`);
            return { id: credit.id, cents: -available };
        });
        const availableUnits = weights.reduce((sum, weight) => sum + weight.cents, 0);
        if (!Number.isSafeInteger(availableUnits)) throw new Error("Source credit total exceeds safe precision.");
        if (applied > 0 || -applied > Math.round(availableUnits / 100)) throw new Error(`Invoice ${invoice.id} has an invalid applied-credit amount for its source credits.`);
        // Credits Applied = ROUND(SUM(Available Credits) * bill proportion, 4), so all sources share the same factor.
        const allocations = allocateCents(applied, weights);
        results.push({
            invoice, tChartRow: 12, ruleCode: "PAY-11", category: "Bill paid using vendor credits (no cash)",
            credits: sources.map(credit => ({ id: credit.id, name: credit.name, cents: allocations.get(credit.id) })),
            postings: sources.filter(credit => allocations.get(credit.id)).map(credit => ({
                debitAccount: { number: "211.100" }, creditAccount: { number: "211.100" }, amount: moneyString(allocations.get(credit.id)),
                ...componentContext(data, invoice), sourceRecordId: credit.id,
                debitInvoiceRecordId: invoice.id, creditInvoiceRecordId: credit.id,
            })),
            ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type], [invoice], [INVOICE_FIELDS.paymentStatus, INVOICE_FIELDS.creditsApplied]),
        });
    }
}

async function handleCreditCardRebate(data, results) {
    if (data.invoiceType !== "AR" || data.vendorType !== "AR - Non-Product") return;
    for (const invoice of data.invoices) {
        if (!getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "004.011")) continue;
        if (invoice.getCellValueAsString(INVOICE_FIELDS.paymentStatus) !== "Fully Paid") continue;
        const amount = invoice.getCellValue(INVOICE_FIELDS.rebateTotal);
        if (amount == null || amount === 0) continue;
        const cents = moneyUnits(amount, 2, `Invoice ${invoice.id} Purchased Discounts & Rebate Total`);

        results.push({
            invoice, tChartRow: 28, ruleCode: "PAY-27", category: "Credit-card rebate earned (cash back)",
            postings: cents ? [{ debitAccount: { number: "231.100" }, creditAccount: { number: "004.011" }, amount: moneyString(cents), ...componentContext(data, invoice) }] : [],
            ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType], [invoice], [INVOICE_FIELDS.paymentStatus, INVOICE_FIELDS.rebateTotal]),
        });
    }
}

// Payroll row 15 remains deferred until its filters and amount are defined.
async function handlePayrollPayment() {
    // Not yet implemented: T-Chart row 15 has no Actual Triggers definition.
    throw new Error("Not yet implemented: T-Chart row 15 payroll trigger and amount mapping are undefined.");
}

async function handleFidelityIncome(data, results) {
    if (data.invoiceType !== "AR" || data.vendorType !== "AR - Non-Product") return;
    for (const invoice of data.invoices) {
        if (!getLinkedRecords(invoice, INVOICE_FIELDS.accounts).some(account => data.accountNumbersById.get(account.id) === "010.003")) continue;
        const cents = moneyCents(invoice.getCellValue(INVOICE_FIELDS.amount), `Invoice ${invoice.id} Invoice Amount`);
        results.push({
            invoice, ruleCode: "PAY-25", tChartRow: 26, category: "Interest / dividends received (Fidelity)",
            postings: postingPairs({ number: "112.200" }, { number: "010.003" }, [postingComponent(data, invoice, cents)]),
            ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType], [invoice], [INVOICE_FIELDS.accounts, INVOICE_FIELDS.amount]),
        });
    }
}

// ==================== UTILS ====================
// Configuration, shared native data reads and the category runner.

const TABLES = {
    payments: "tblR61NG9i0giid28",
    invoices: "tbldQXuqNEp8G5pfs",
    accounts: "tblJ2RF8vlOhNMBKR",
    lines: "tblV26TC0f6CKDneL",
};

const PAYMENT_FIELDS = {
    name: "fld0WzELo8ivaRfEb",            // Payment formula (primary display name)
    amount: "fldhP2S68pT3XkZmX",          // Amount (current payment)
    reference: "fldxjaur2SnqKmRfN",       // Reference Number
    methodAR: "fldICKCPwydpwAPL1",        // Method - AR
    vendorType: "fldJlmVZzUf5tuz0m",       // Vendor Type (includes override)
    vendorTypesAP: "fldXsmHPdtpkNKFun",    // Vendor Type AP (New), raw rollup
    vendorTypesAR: "fldRIZiZhwJb4rztx",    // Vendor Type AR (New), raw rollup

    type: "fldkoW3MMQEe0Lwm1",             // Invoice Type
    sent: "fld03L3JpNZBLauEC",             // Sent
    returned: "fldRvZLik2A6g0KVd",         // Return Payment (AP)
    date: "fld0mYG8IMrDaNzdE",             // Payment Date
    recordType: "fldRT5cjyYzDUHMmm",       // Payment Record Type
    method: "fldu02yC1LElzDabE",           // Method - AP
    overpaid: "fldjsHZCoUYnnc2fV",         // Overpaid Amount
    accounts: "fldCIQSOdytBGi91S",         // Account to Pay/Receive
    invoices: "fldzPDwsJ1ZT2tVIs",         // Master Invoice Table
    miniPayments: "fldnR14dyPcbdOeap",     // Linked Mini-Payments from This Batch
};
const LINE_FIELDS = { amount: "fldkhhHCD2qKD71rI", accounts: "fldwr0Pfp8OHsNj5N", invoices: "fldZpOBUbuVJbuaOG", type: "fldchdpL3w2aXfm4P", discountStatus: "fldU0H6S3D9uAFwBs" };
const INVOICE_FIELDS = {
    amount: "fldm5nXoW7MrwjkhW",
    totalPaid: "fldjIeCk9utD91Rq6",
    remaining: "fldnPvmnWzmfgBq3m",
    lines: "fldF0uqCMkPgwuIes",
    name: "fldMZyzqDidRujeZS",         // Invoice ID (primary display name)
    rebateTotal: "fldyTbRUtFof1IByi",  // Purchased Discounts & Rebate Total
    sourceCredits: "fldQ6CZ4bMQjpCKoh", // From field: Credit Invoice Apply to What?
    creditsApplied: "fldtVpTc9y7AtQNx0", // Credits Applied
    discountTotal: "fldsPglrh1E185nU4", // Discount Lines Total, Open and Applied; excludes Expired
    paymentStatus: "fldde9LpRBshHfqCE", // Payment Invoice Status, computed
    amountToPay: "fldNqZMZsZfRPiRFp",     // Invoice Amount To Pay
    clients: "fld9aY5ze2BbaoWG5",          // Linked Client (FIN)
    staff: "fldJXrFmx3Y6Szxa5",            // Linked Staff (FIN)
    branch: "fldt5PjqGDrINUYT5",           // Branch
    states: "fld3kO1XElo5S3Hhy",           // States & Sales Tax Rates

    application: "fld0uNpxg7XweQ9Xf",      // Method of Application
    accounts: "fldT5u0prSS8G1H4x",         // Linked Chart of Accounts
    purchaseOrders: "fldcIaoLYHgegP17m",   // Related Purchase Order
    vendors: "fld77UN3hpnMagzkj",          // Linked Vendors (For both Expenses and Product Invoices)
    transactions: "fldxUmaAhUJjAGnrw",     // Linked Transaction
    firstShipDate: "fldXs88CyaF07XyWv",    // First Ship Out Date (from Linked Transaction)
};
const CREDIT_FIELDS = {
    name: "fldMZyzqDidRujeZS",         // Invoice ID (primary display name)
    type: "fld9e6yDIv0PtBDV0",         // Invoice Type
    vendorTypeAP: "fldXwodwAuXLJt5rP", // Vendor Type (AP)
    available: "fldREWnrJBr5DqkBB",    // Available Credits
    recipientInvoices: "fldkLsua8jujHnXWQ", // Credit Invoice Apply to What?
};

const ACCOUNT_FIELDS = { number: "fldTjgAITNrJVCCWq" };
const CREDIT_CARD_ACCOUNT = { recordId: "receFCwcrEx4SXLST", number: "231.100" }; // FIN Credit Card Clearing
const BANK_ACCOUNT_NUMBERS = ["112.100", "0747", "112.200"];
const BANK_PAYMENT_METHODS = ["Nickel Check", "Wise", "Our ACH / Wire", "Vendor ACH / Wire", "Paper Check"];

function getLinkedRecords(record, fieldId) { return record.getCellValue(fieldId) || []; }

function linkedIds(record, fieldId) { return [...new Set(getLinkedRecords(record, fieldId).map(link => link.id))].sort(); }

async function readRecords(tableId, recordIds, fields) {
    const ids = [...new Set(recordIds)];
    const records = [];
    for (let start = 0; start < ids.length; start += 100) {
        const batch = ids.slice(start, start + 100);
        const query = await base.getTable(tableId).selectRecordsAsync({ recordIds: batch, fields });
        const found = new Set(query.records.map(record => record.id));
        const missing = batch.filter(id => !found.has(id));
        if (missing.length) throw new Error(`Missing linked records in ${tableId}: ${missing.join(", ")}`);
        records.push(...query.records);
    }
    return records;
}

async function loadPaymentData(paymentRecordId) {
    if (!paymentRecordId) throw new Error("Map paymentRecordId to the trigger's Airtable record ID.");
    const payment = await base.getTable(TABLES.payments).selectRecordAsync(paymentRecordId, { fields: Object.values(PAYMENT_FIELDS) });
    if (!payment) throw new Error(`Payment not found: ${paymentRecordId}`);
    const vendorTypes = [...new Set([
        payment.getCellValue(PAYMENT_FIELDS.vendorTypesAP),
        payment.getCellValue(PAYMENT_FIELDS.vendorTypesAR),
    ].flat().filter(Boolean))];
    if (vendorTypes.length > 1) throw new Error(`Payment ${payment.id} has multiple Vendor Types: ${vendorTypes.join(", ")}. Correct the payment links before processing.`);
    const invoiceLinks = getLinkedRecords(payment, PAYMENT_FIELDS.invoices);
    return { payment, invoiceType: payment.getCellValueAsString(PAYMENT_FIELDS.type), vendorType: payment.getCellValueAsString(PAYMENT_FIELDS.vendorType), invoiceLinks, invoiceNames: new Map(invoiceLinks.map(link => [link.id, link.name])) };
}

async function loadInvoiceData(data) {
    const invoices = await readRecords(TABLES.invoices, data.invoiceLinks.map(link => link.id), Object.values(INVOICE_FIELDS));
    const ids = [...getLinkedRecords(data.payment, PAYMENT_FIELDS.accounts), ...invoices.flatMap(invoice => getLinkedRecords(invoice, INVOICE_FIELDS.accounts))].map(link => link.id);
    const accounts = await readRecords(TABLES.accounts, ids, Object.values(ACCOUNT_FIELDS));
    const accountNumbersById = new Map(accounts.map(account => [account.id, account.getCellValueAsString(ACCOUNT_FIELDS.number)]));
    const paymentHasBankAccount = getLinkedRecords(data.payment, PAYMENT_FIELDS.accounts).some(account => BANK_ACCOUNT_NUMBERS.includes(accountNumbersById.get(account.id) || ""));
    return { invoices, accountNumbersById, paymentHasBankAccount };
}

function parseFirstShipOutDate(invoice) {
    const value = invoice.getCellValueAsString(INVOICE_FIELDS.firstShipDate);
    if (!value) return "";
    // This lookup is limited to one M/D/YYYY date. Compare without a timezone shift.
    const [month, day, year] = value.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

async function main(paymentRecordId) {
    const paymentData = await loadPaymentData(paymentRecordId);
    /** @type {any[]} */
    const results = [];
    if (!paymentData.payment.getCellValue(PAYMENT_FIELDS.sent)) {
        printResults(results, paymentData, "sent", "Sent is not checked.");
        return results;
    }
    await handleVendorPaymentReturned(paymentData, results);
    const data = { ...paymentData, ...await loadInvoiceData(paymentData) };

    await handleCustomerDeposit(data, results);
    await handleCustomerPaymentAfterShipment(data, results);
    await handleClientOverpayment(data, results);
    await handleSmallPaymentDifference(data, results);
    await handleClientCashRefund(data, results);
    await handleVendorBankPayment(data, results);
    await handleVendorCardPayment(data, results);
    await handleCreditCardStatementPayment(data, results);
    await handleVendorRefund(data, results);
    await handleStaffPayment(data, results);
    await handleLoanPayment(data, results);
    await handleLineOfCreditDraw(data, results);
    await handleLineOfCreditRepayment(data, results);
    await handleBankTransfer(data, results);
    await handleOwnerDistribution(data, results);
    await handleOwnerContribution(data, results);
    await handleIncomeTaxPayment(data, results);
    await handleInsuranceClaimReceipt(data, results);
    await handleSecurityDepositPayment(data, results);
    await handleEarlyPaymentDiscount(data, results);
    await handleVendorCreditApplication(data, results);
    await handleCreditCardRebate(data, results);
    await handleFidelityIncome(data, results);

    const reason = !results.length && !data.vendorType ? "Payments.Vendor Type is blank; no vendor-specific category qualifies." : "";
    printResults(results, data, "sent", reason);
    await pushWebhook(data, results.filter(result => !result.invoice), "sent");
    await pushInvoicePackets(data, results.filter(result => result.invoice));
    return results;
}

// Posting components stay separate from console-formatted filter details.
function moneyCents(value, label) {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} is missing or is not a finite number.`);
    const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
    const cents = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + 2}`));
    if (!Number.isSafeInteger(cents)) throw new Error(`${label} exceeds safe cent precision.`);
    return cents === 0 ? 0 : cents;
}

function moneyUnits(value, precision, label) {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} is missing or is not a finite number.`);
    const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
    const units = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + precision}`));
    if (!Number.isSafeInteger(units)) throw new Error(`${label} exceeds safe money precision.`);
    return units === 0 ? 0 : units;
}

function moneyString(cents) { return (cents / 100).toFixed(2); }

function allocateCents(totalCents, weights) {
    if (!Number.isSafeInteger(totalCents) || weights.some(weight => !Number.isSafeInteger(weight.cents))) throw new Error("Allocation exceeds safe cent precision.");
    if (new Set(weights.filter(weight => weight.cents).map(weight => Math.sign(weight.cents))).size > 1) throw new Error("Mixed-sign invoice amounts require an explicit allocation before posting.");
    const sign = Math.sign(weights.find(weight => weight.cents)?.cents || 1);
    const ordered = weights.map(weight => ({ ...weight, cents: weight.cents * sign })).sort((a, b) => a.id.localeCompare(b.id));
    const sum = ordered.reduce((total, weight) => total + weight.cents, 0);
    if (!Number.isSafeInteger(sum)) throw new Error("Allocation exceeds safe cent precision.");
    if (!sum && totalCents) throw new Error("Cannot allocate a payment against zero invoice amounts.");
    const parts = ordered.map(weight => {
        const product = totalCents * weight.cents;
        if (!Number.isSafeInteger(product)) throw new Error("Allocation exceeds safe cent precision.");
        return { id: weight.id, cents: sum ? Math.trunc(product / sum) : 0, remainder: sum ? product % sum : 0 };
    });
    const direction = Math.sign(totalCents);
    let remainder = totalCents - parts.reduce((total, part) => total + part.cents, 0);
    for (const part of [...parts].sort((a, b) => direction * (b.remainder - a.remainder) || a.id.localeCompare(b.id))) {
        if (!remainder) break;
        part.cents += direction;
        remainder -= direction;
    }
    return new Map(parts.map(part => [part.id, part.cents === 0 ? 0 : part.cents]));
}

function invoiceWeights(invoices) {
    const values = invoices.map(invoice => ({ id: invoice.id, cents: moneyCents(invoice.getCellValue(INVOICE_FIELDS.amountToPay), `Invoice ${invoice.id} Amount To Pay`) }));
    if (new Set(values.filter(value => value.cents).map(value => Math.sign(value.cents))).size > 1) throw new Error("Mixed-sign invoice amounts require an explicit allocation before posting.");
    return values;
}

function invoiceAllocations(data) {
    if (!data.invoiceAllocations) {
        const amount = moneyCents(data.payment.getCellValue(PAYMENT_FIELDS.amount), "Payment Amount");
        if (data.invoices.length === 1) data.invoiceAllocations = new Map([[data.invoices[0].id, amount]]);
        else data.invoiceAllocations = amount ? allocateCents(amount, invoiceWeights(data.invoices)) : new Map(data.invoices.map(invoice => [invoice.id, 0]));
    }
    return data.invoiceAllocations;
}

function accountSource(data, link) { return { recordId: link.id, number: data.accountNumbersById.get(link.id) || "" }; }

function paymentAccountSource(data) {
    const accounts = getLinkedRecords(data.payment, PAYMENT_FIELDS.accounts);
    if (accounts.length > 1) throw new Error("The payment must identify one payment account.");
    return accounts.length ? accountSource(data, accounts[0]) : null;
}

function postingPairs(debitAccount, creditAccount, components) {
    return components.filter(component => component.amount !== "0.00").map(component => ({
        debitAccount, creditAccount, ...component,
    }));
}


function componentContext(data, invoice) {
    if (!invoice) return { sourceRecordId: data.payment.id, branch: [] };
    /** @type {any} */
    const context = { invoiceRecordId: invoice.id, sourceRecordId: invoice.id, branch: [] };
    const branch = invoice.getCellValue(INVOICE_FIELDS.branch);
    if (branch) context.branch = [branch.name];
    const refs = [
        ["vendor", INVOICE_FIELDS.vendors], ["client", INVOICE_FIELDS.clients],
        ["staff", INVOICE_FIELDS.staff], ["transaction", INVOICE_FIELDS.transactions],
        ["po", INVOICE_FIELDS.purchaseOrders],
    ];
    for (const [name, field] of refs) {
        const ids = getLinkedRecords(invoice, field).map(link => link.id);
        context[`${name}RecordIds`] = ids;
        if (ids.length === 1) context[`${name}RecordId`] = ids[0];
    }
    const states = getLinkedRecords(invoice, INVOICE_FIELDS.states);
    context.stateRecordIds = states.map(link => link.id);
    context.stateNames = states.map(link => link.name);
    if (states.length === 1 && /^[A-Z]{2}$/.test(states[0].name)) context.stateCode = states[0].name;
    const accounts = getLinkedRecords(invoice, INVOICE_FIELDS.accounts);
    context.invoiceAccounts = accounts.map(link => accountSource(data, link));
    if (accounts.length === 1) context.invoiceAccount = context.invoiceAccounts[0];
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
    if (!invoices.length) return [postingComponent(data, null, totalCents)];
    if (invoices.length === 1) return [postingComponent(data, invoices[0], totalCents)];
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
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(component);
    }
    return groups;
}

async function readInvoiceLines(data, accountNumbers) {
    if (!data.invoiceLines) {
        const ids = data.invoices.flatMap(invoice => linkedIds(invoice, INVOICE_FIELDS.lines));
        const lines = await readRecords(TABLES.lines, ids, Object.values(LINE_FIELDS));
        const accountIds = lines.flatMap(line => linkedIds(line, LINE_FIELDS.accounts)).filter(id => !data.accountNumbersById.has(id));
        for (const account of await readRecords(TABLES.accounts, accountIds, Object.values(ACCOUNT_FIELDS))) data.accountNumbersById.set(account.id, account.getCellValueAsString(ACCOUNT_FIELDS.number));
        data.invoiceLines = lines.map(line => {
            const invoices = data.invoices.filter(invoice => linkedIds(invoice, INVOICE_FIELDS.lines).includes(line.id));
            const accounts = getLinkedRecords(line, LINE_FIELDS.accounts);
            return { line, invoice: invoices[0], invoices, accountNumbers: accounts.map(account => data.accountNumbersById.get(account.id)), accountNumber: accounts.length === 1 ? data.accountNumbersById.get(accounts[0].id) : "" };
        });
    }
    const matches = accountNumbers ? data.invoiceLines.filter(item => item.accountNumbers.some(number => accountNumbers.includes(number))) : data.invoiceLines;
    for (const item of matches) {
        if (item.invoices.length !== 1 || !linkedIds(item.line, LINE_FIELDS.invoices).includes(item.invoice.id)) throw new Error(`Invoice line ${item.line.id} must belong to one linked invoice with reciprocal links.`);
        if (item.accountNumbers.length !== 1) throw new Error(`Invoice line ${item.line.id} must identify one chart of account before posting.`);
    }
    return matches;
}

function repaymentLines(lines, principal) {
    const otherPrincipal = principal === "232.100" ? "231.200" : "232.100";
    return lines.filter(item => {
        if (item.accountNumber === principal) return true;
        if (item.accountNumber !== "007.003") return false;
        const invoiceAccounts = new Set(lines.filter(line => line.invoice.id === item.invoice.id).map(line => line.accountNumber));
        if (invoiceAccounts.has(principal) && !invoiceAccounts.has(otherPrincipal)) return true;
        if (invoiceAccounts.has(otherPrincipal) && !invoiceAccounts.has(principal)) return false;
        if (lines.some(line => line.accountNumber === otherPrincipal)) throw new Error("Not yet implemented: a payment linking both auto-loan and LOC principal needs an explicit interest allocation.");
        return true;
    });
}

function addLineAccountEntries(data, results, lines, debitAccounts, tChartRow, category) {
    const groups = new Map();
    for (const { line, invoice, accountNumber } of lines) {
        if (!groups.has(accountNumber)) groups.set(accountNumber, new Map());
        const invoices = groups.get(accountNumber);
        if (!invoices.has(invoice.id)) invoices.set(invoice.id, { invoice, units: 0, sourceRecordIds: [] });
        const group = invoices.get(invoice.id);
        group.units += moneyUnits(line.getCellValue(LINE_FIELDS.amount), 4, `Line ${line.id} Amount`);
        if (!Number.isSafeInteger(group.units)) throw new Error(`Account ${accountNumber} total exceeds safe money precision.`);
        group.sourceRecordIds.push(line.id);
    }
    for (const [entryKey, invoices] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
        results.push({
            tChartRow, category, entryKey,
            postings: postingPairs({ number: debitAccounts[entryKey] }, paymentAccountSource(data), [...invoices.values()].map(group => ({
                ...postingComponent(data, group.invoice, moneyCents(group.units / 10000, "Account line total")), sourceRecordId: undefined, sourceRecordIds: group.sourceRecordIds.sort(),
            }))),
            ...formatMatchDetails(data, [PAYMENT_FIELDS.sent, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType], [...invoices.values()].map(group => group.invoice), [INVOICE_FIELDS.lines]),
        });
    }
}

async function cardStatementComponents(data) {
    const links = getLinkedRecords(data.payment, PAYMENT_FIELDS.miniPayments);
    const minis = await readRecords(TABLES.payments, links.map(link => link.id), [PAYMENT_FIELDS.amount, PAYMENT_FIELDS.method, PAYMENT_FIELDS.invoices]);
    const groups = new Map();
    for (const mini of minis) {
        const method = mini.getCellValueAsString(PAYMENT_FIELDS.method);
        if (!["CC - Amex", "CC - Visa"].includes(method)) throw new Error(`Mini-payment ${mini.id} needs a specific credit-card method.`);
        if (!groups.has(method)) groups.set(method, { id: method, cents: 0, miniPaymentRecordIds: [], invoiceRecordIds: [] });
        const group = groups.get(method);
        const cents = moneyCents(mini.getCellValue(PAYMENT_FIELDS.amount), `Mini-payment ${mini.id} Amount`);
        group.cents += cents;
        group.miniPaymentRecordIds.push(mini.id);
        group.invoiceRecordIds.push(...getLinkedRecords(mini, PAYMENT_FIELDS.invoices).map(link => link.id));
    }
    const total = moneyCents(data.payment.getCellValue(PAYMENT_FIELDS.amount), "Payment Amount");
    const allocations = allocateCents(total, [...groups.values()]);
    const invoiceIds = [...new Set([...groups.values()].flatMap(group => group.invoiceRecordIds))];
    const invoices = await readRecords(TABLES.invoices, invoiceIds, [INVOICE_FIELDS.branch]);
    const branches = new Map(invoices.map(invoice => [invoice.id, invoice.getCellValue(INVOICE_FIELDS.branch)?.name]));
    return [...groups.values()].map(group => ({
        amount: moneyString(allocations.get(group.id)), paymentMethod: group.id,
        sourceRecordId: data.payment.id, miniPaymentRecordIds: group.miniPaymentRecordIds,
        invoiceRecordIds: [...new Set(group.invoiceRecordIds)],
        branch: [...new Set(group.invoiceRecordIds.map(id => branches.get(id) || ""))],
    }));
}

async function pushInvoicePackets(data, results) {
    if (!results.length) return;
    if (!ledgerWebhookUrl) throw new Error("Set ledgerWebhookUrl to the deployed ledger-payment Edge Function URL.");
    const entryDate = data.payment.getCellValue(PAYMENT_FIELDS.date);
    if (!entryDate) throw new Error("Payment Date is required for invoice settlement posting.");
    const invoices = new Map(results.map(result => [result.invoice.id, result.invoice]));
    for (const invoice of invoices.values()) {
        const matches = results.filter(result => result.invoice.id === invoice.id);
        const payload = {
            paymentRecordId: data.payment.id, paymentName: data.payment.name, eventType: "sent", entryDate,
            source: { tableId: TABLES.invoices, recordId: invoice.id, recordName: invoice.name },
            referenceNumber: invoice.id,
            categories: matches.map(result => ({ ruleCode: result.ruleCode, entryKey: result.entryKey, transactionType: result.category, postings: result.postings })),
        };
        await postLedgerPayload(payload);
    }
}

async function pushWebhook(data, results, eventType) {
    if (!results.length) return;
    if (!ledgerWebhookUrl) throw new Error("Map ledgerWebhookUrl to the deployed ledger-payment function URL.");
    const rawAmount = data.payment.getCellValue(PAYMENT_FIELDS.amount);
    const amount = moneyString(moneyCents(rawAmount, "Payment Amount"));
    const entryDate = data.payment.getCellValue(PAYMENT_FIELDS.date);
    if (!entryDate) throw new Error("Payment Date is required for posting.");
    const accounts = getLinkedRecords(data.payment, PAYMENT_FIELDS.accounts);
    if (accounts.length > 1) throw new Error("The payment must identify one payment account.");
    const payload = {
        paymentRecordId: data.payment.id, eventType, entryDate,
        paymentName: data.payment.getCellValueAsString(PAYMENT_FIELDS.name) || data.payment.id,
        referenceNumber: data.payment.getCellValueAsString(PAYMENT_FIELDS.reference),
        paymentAmount: amount, invoiceType: data.invoiceType,
        paymentMethod: data.payment.getCellValueAsString(PAYMENT_FIELDS.method) || data.payment.getCellValueAsString(PAYMENT_FIELDS.methodAR),
        paymentAccount: accounts.length ? accountSource(data, accounts[0]) : null,
        categories: results.map(result => ({ ruleCode: `PAY-${String(result.tChartRow - 1).padStart(2, "0")}`, entryKey: result.entryKey, transactionType: result.category.trim().replace(/[\u2013\u2014]/g, "-"), postings: result.postings })),
    };
    return postLedgerPayload(payload);
}

async function postLedgerPayload(payload) {
    const response = await fetch(ledgerWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ledger-secret": input.secret("Dual Ledger Webhook Secret") },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Ledger webhook failed (${response.status}): ${await response.text()}`);
    const result = await response.json();
    printPostingResponse(result);
    return result;
}

const { paymentRecordId, ledgerWebhookUrl } = input.config();
await main(paymentRecordId);

// ==================== HELPER ====================
function printPostingResponse(response) {
    if (response.status === "pending_review" || response.status === "rejected") {
        console.log(`Ledger: ${response.status}\nReview request: ${response.requestId}\nNo journals were posted.`);
        return;
    }
    const report = ["--------------------------------------------------------", "LEDGER RESULT", "--------------------------------------------------------"];
    for (const result of response.results || []) {
        report.push(`Rule: ${result.ruleCode}`, `Status: ${result.status}`);
        if (result.entryKey) report.push(`Account entry: ${result.entryKey}`);
        for (const id of result.journalEntryIds || (result.journalEntryId ? [result.journalEntryId] : [])) report.push(`Journal ID: ${id}`);
    }
    console.log(report.join("\n"));
}

// Result details and console formatting only. No qualification or posting.

function formatFields(tableId, record, fieldIds) {
    const table = base.getTable(tableId);
    return Object.fromEntries(fieldIds.map(fieldId => [table.getField(fieldId).name, record.getCellValue(fieldId)]));
}

function formatMatchDetails(data, paymentFieldIds = [], invoices = [], invoiceFieldIds = []) {
    const details = { paymentRecordId: data.payment.id, paymentFilters: formatFields(TABLES.payments, data.payment, paymentFieldIds) };
    return invoices.length ? { ...details, invoices: invoices.map(invoice => ({ invoiceRecordId: invoice.id, filters: formatFields(TABLES.invoices, invoice, invoiceFieldIds) })) } : details;
}

function formatValue(value) {
    if (value == null || value === "") return "(empty)";
    if (typeof value === "boolean") return value ? "checked" : "unchecked";
    if (Array.isArray(value)) return value.length ? value.map(formatValue).join(", ") : "(empty)";
    if (typeof value === "object") return value.name;
    if (typeof value === "number") return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return String(value);
}

function printResults(results, data, eventType, reason = "") {
    const divider = "--------------------------------------------------------";
    const eventName = "Payment " + eventType.charAt(0).toUpperCase() + eventType.slice(1);
    const report = [divider, "PAYMENT SUMMARY", divider, `Payment ID: ${data.payment.id}`, `Event: ${eventName}`, `Matched categories: ${new Set(results.map(result => result.tChartRow)).size}`, `Prepared journals: ${results.length}`];
    const addFields = fields => {
        for (const [name, value] of Object.entries(fields)) {
            if (name === "Linked Mini-Payments from This Batch") {
                report.push(`Linked mini-payment count: ${(value || []).length}`);
                continue;
            }
            for (const item of Array.isArray(value) && value.length ? value : [value]) report.push(`${name}: ${formatValue(item)}`);
        }
    };
    for (const [index, match] of results.entries()) {
        report.push("", divider, `MATCH ${index + 1}`, divider, `Category: ${match.category}`, `T-Chart row: ${match.tChartRow}`);
        if (match.entryKey) report.push(`Line account: ${match.entryKey}`);
        const fields = Object.entries(match.paymentFilters).filter(([name]) => name !== "Sent" || eventType !== "sent");
        if (fields.length) {
            report.push("", "PAYMENT FILTERS");
            addFields(Object.fromEntries(fields));
        }
        for (const invoice of match.invoices || []) {
            report.push("", "INVOICE", `Invoice name: ${data.invoiceNames.get(invoice.invoiceRecordId) || "Unnamed invoice"}`, `Invoice ID: ${invoice.invoiceRecordId}`);
            addFields(invoice.filters);
        }
        for (const credit of match.credits || []) report.push("", "SOURCE CREDIT", `Source credit name: ${credit.name}`, `Source credit ID: ${credit.id}`, `Applied amount: ${moneyString(credit.cents)}`);
    }
    if (!results.length) report.push("", "No approved category matched.");
    if (reason) report.push(`Reason: ${reason}`);
    console.log(report.join("\n"));
}

/*
DOCS
PURPOSE / RUNTIME
  Native FIN Airtable automation. Qualify the approved Sent payment movements, calculate
  final debit/credit account pairs locally. Post payment-owned movements as one packet
  and vendor-credit/rebate totals as invoice-owned packets to prevent duplicate totals.
INPUTS / SECRET
  paymentRecordId: FIN Payments record ID from the trigger.
  ledgerWebhookUrl: deployed ledger-payment Edge Function URL.
  Secret: Dual Ledger Webhook Secret, matching the Edge Function LEDGER_WEBHOOK_SECRET.
DATA / OWNERSHIP
  All reads use native FIN tables and immutable IDs. No Airtable record writes.
  Sent + Return Payment (AP) + Invoice Type AP adds its category alongside every
  other matching Sent category. Payment Date is its accounting date.
  Current Amount retains its sign: debit Fifth Third
  112.100, credit AP 211.100 as specified by the T-Chart. Zero is a no-op; missing Amount fails. There is
  no original-journal lookup, reversal or deletion. The console identifies Sent as the trigger.
  Amount is the event movement. Invoice Amount To Pay determines proportional
  invoice shares. Same-sign invoice weights are allocated to cents, with stable
  record-ID tie-breaking. Missing/mixed-sign allocations fail before the POST.
  Each CORE function owns its category filters and component calculation.
  Same-day shipment payments are deposits. Staff payments do not require a manual
  invoice-paid status. Invoice-owned discounts, vendor credits and rebates are
  handled in this same script as separate invoice-owned packets, not payment-owned totals.
  Deposit/after-shipment qualification uses Payment Date and the invoice's First
  Ship Out Date only. Clear to Purchase is not required and Transactions is not queried.
  Linked transaction IDs remain posting metadata from the invoice links.
  Bank transfers debit the payment-linked bank and credit the invoice-linked bank,
  following the Actual Triggers Notes confirmed by the user.
  CORE selects final debit/credit source account identities. Supabase resolves generic
  account aliases and persists the supplied pairs; it does not classify categories.
  Relevant FIN references and branch values travel with each component.
NETWORK / RETRIES
  Prepare all matching components before any POST. One payment packet plus one per
  qualifying invoice. No POST for no matches; blocked categories throw before posting.
  Print the match summary before POST and each acknowledgement immediately, so a later
  failed request does not hide journal IDs from requests already acknowledged.
  No automatic retries. On failure, the run fails; a repeat uses the same payment
  and category identity so Supabase can verify or reject a duplicate.
LIMITS
  Rows 11 and 24 remain blocked by pending credit/bank/recovery mappings. Row 15 is deferred.
  Staff lines clear their original payroll liabilities, including W2 wages, payroll tax and
  401k. Benefits and bank wire/FX fees are excluded pending their mappings/source.
  Staff and loan/LOC lines sum by source account, with a separate keyed journal per account.
  Shared interest needs an unambiguous principal owner. Other invoice-purpose splits remain blocked.
  Row 5 uses 0 < Overpaid Amount <= 1 per payment, or 0 < Remaining Balance <= 5 per invoice.
  Underpayment balances are checked against Amount To Pay minus Total Paid Amount.
  Row 26 uses Invoice Amount, debit Fidelity 112.200, credit Interest and Dividends 010.003.
  Vendor credits, rebates, interest and underpaid write-offs retain invoice-owned identities.
  Vendor refunds debit the selected payment account. All monetary sources retain their sign.
  Branch is nullable payload data. No Airtable data writes or UI changes.
LOCAL CHECK
  node airtable/check.cjs
*/
