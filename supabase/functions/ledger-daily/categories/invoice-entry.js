// Invoice Entry categories. The source owns its journal links; the generic writer records final account pairs.
import { combinedInvoiceBranches } from "./invoice-branch.ts";
import { CARD_LIABILITY_ACCOUNTS, CARD_REBATE_INCOME, invoiceWorkerFields as fields } from "../definitions.ts";
import { OPERATING_EXPENSE_ACCOUNT_MAPPING } from "../rules/expense-accounts.ts";
import { allocateInvoicePaymentCents } from "./payment-allocation.ts";
const SMALL_OVERPAYMENT_CENTS = 100;
const FIXED_ASSET_ACCOUNTS = new Map([
    ["recFJ4VqOAF9ywdrJ", "143.100"], // Leasehold Improvements
    ["rec212rPWpVSmXh8X", "143.300"], // Display Fixtures & Equipment
    ["recMMetXo1rbkC23L", "151.100"], // Automobiles
]);

export function createCategories(client, readRemainingDeposit, customerBalance) {
    const { TABLES: T, INVOICE_FIELDS: I, PAYMENT_FIELDS: P, SHIPPING_FIELDS: S, MTA_FIELDS: M, ACCOUNT_FIELDS: A } = fields;

    // ==================== CORE ====================

    async function handleDepositInvoice(data, results) {
        if (!isDeposit(data.invoice)) return;
        await addInvoice(results, data, "Deposit Invoice Created", "121.100", "221.100");
    }
    async function handleDepositPayment(data, results) {
        if (!sent(data)) return;
        const invoices = data.invoices.filter(isDeposit);
        await addPayment(results, data, "Deposit Invoice Paid", invoices, "121.100", true);
    }
    async function handleShipment(data, results) {
        if (!data.record.value(S.shipped) || !data.record.value(S.date)) return;
        const transactionIds = ids(data.record, S.transactions);
        const mtaIds = ids(data.record, S.mtas);
        if (!transactionIds.length || !mtaIds.length) return;
        if (transactionIds.length !== 1) throw new Error("Shipping Record must link exactly one Transaction; multiple transaction allocation is not defined.");
        const transaction = await client.readRecord(T.transactions, transactionIds[0], Object.values(fields.TRANSACTION_FIELDS));
        if (!transaction) throw new Error("Shipping Record transaction is missing.");
        const invoices = await client.readRecords(T.invoices, ids(transaction, fields.TRANSACTION_FIELDS.invoices), Object.values(I));
        const deposits = invoices.filter(isDeposit);
        if (!deposits.length) return;
        if (deposits.length !== 1) throw new Error("Transaction must identify exactly one deposit invoice; multiple deposit allocation is not defined.");
        const mtas = await client.readRecords(T.mtas, mtaIds, Object.values(M));
        const units = mtas.reduce((sum, mta) => checkedTotal(sum, moneyUnits(mta.value(M.amount), 4, "MTAs.Extended Sell Price")), 0);
        const cents = Math.sign(units) * Math.round(Math.abs(units) / 100);
        if (!cents) return;
        const depositCents = Math.max(0, moneyUnits(deposits[0].value(I.amount), 2, "Deposit Invoice Amount"));
        if (!readRemainingDeposit) throw new Error("Deposit release reader is not configured.");
        const remaining = await readRemainingDeposit(deposits[0].id, depositCents);
        data.depositInvoiceAmountCents = depositCents;
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
    async function handleBalancePayment(data, results, overpaymentOnly) {
        if (!sent(data)) return;
        const invoices = data.invoices.filter(isBalance).sort((a,b)=>a.id.localeCompare(b.id));
        if (!invoices.length) return;
        const numeric = data.payment.value(P.amount);
        const received = moneyUnits(numeric, 2, "Payment Amount");
        if (!received) return;
        if (received<0) {
            if (!overpaymentOnly) await addPayment(results,data,"Full or Balance Invoice Paid",invoices,"121.100",true);
            return;
        }
        if (!customerBalance) throw new Error("Customer AR balance reader is not configured.");
        const complete = ids(data.payment, P.invoices).length === invoices.length;
        const balances=[];
        for (const invoice of invoices) {
            const face = moneyUnits(invoice.value(I.amount),2,"Invoice Amount");
            if (face < 0) throw new Error("A full or balance invoice must have a nonnegative amount.");
            const day=data.payment.text(P.date).slice(0,10);
            const invoiceDay=invoice.text(I.date).slice(0,10);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(invoiceDay)) throw new Error("Linked customer invoice accounting date is missing or invalid.");
            const linkedIds=ids(invoice,I.payments).filter(id=>id!==data.payment.id);
            const linked=await client.readRecords(T.payments,linkedIds,[P.date,P.recordType,P.sent,P.cancelled,P.amount]);
            const earlierIds=linked.filter(payment=>{
                const date=payment.text(P.date).slice(0,10);
                return sent({payment}) && payment.value(P.amount)>0 &&
                    (date<day || (date===day && payment.id<data.payment.id));
            }).map(payment=>payment.id);
            const order={day,earlierIds,faceCents:face};
            const open = await customerBalance.receivable(invoice.id,data.payment.id,order);
            if (open == null) throw new Error("Could not verify the linked customer invoice balance.");
            balances.push({ invoiceId:invoice.id, openCents:open ?? 0, order, cap:Math.min(face,open ?? 0) });
        }
        const totalOpen=balances.reduce((sum,balance)=>checkedTotal(sum,balance.cap),0);
        const wholeSettlement=complete && received>=totalOpen;
        const parts=balances.map(({ cap }, i)=>wholeSettlement ? cap : complete && invoices.length===1 ? received :
            allocateInvoicePaymentCents(numeric,data.invoices,[invoices[i]],I.paymentProportion));
        if (parts.some((part,i)=>part<0 || part>balances[i].cap))
            throw new Error("Receipt allocations exceed open invoice balances. Confirm the intended allocation.");
        const applied=parts.reduce(checkedTotal,0);
        const excess=complete ? received-applied : 0;
        if (excess<0 || (complete && !wholeSettlement && excess>0))
            throw new Error("Receipt allocation does not reconcile to the confirmed cash amount.");
        const discrepancy = excess > 0 && excess <= SMALL_OVERPAYMENT_CENTS ? excess : 0;
        const customerCredit = excess - discrepancy;
        if (overpaymentOnly && !customerCredit) return;
        if (excess && invoices.length>1) {
            const clients = invoices.map(invoice=>ids(invoice,I.clients));
            if (clients.some(linked=>linked.length!==1 || linked[0]!==clients[0][0]) || combinedInvoiceBranches(invoices).length!==1)
                throw new Error("An excess across several invoices requires one verified customer and branch.");
        }
        const bank=await singleAccount(data.payment,P.accounts,"Receipt");
        const arPostings=[];
        for (let i=0;i<invoices.length;i++) {
            const leg=[];
            const extra = !discrepancy ? 0 : invoices.length === 1 ? discrepancy :
                allocateInvoicePaymentCents(discrepancy / 100, invoices, [invoices[i]], I.paymentProportion);
            if (extra < 0) throw new Error("Receipt discrepancy requires positive invoice allocations.");
            addResult(leg,"Full or Balance Invoice Paid",bank,"121.100",checkedTotal(parts[i],extra),invoiceContext(data,[invoices[i]]));
            if (leg.length) arPostings.push(leg[0].postings[0]);
        }
        if (arPostings.length) results.push({ruleCode:"INV-16",category:"Full or Balance Invoice Paid",postings:arPostings,
            ...(discrepancy ? { notes: `Overpayment discrepancy of ${(discrepancy / 100).toFixed(2)} remains in Accounts Receivable for manual adjustment.` } : {})});
        if (customerCredit) {
            addResult(results,"Client Overpayment Received",bank,"221.300",customerCredit,invoiceContext(data,invoices));
            results.at(-1).ruleCode="PAY-03";
        }
        data.customerSettlement={
            receivables:balances.map(({invoiceId,openCents,order})=>({invoiceId,openCents,order})),
            ...(excess ? {legacyCreditIds:ids(data.payment,P.generatedCredits)} : {}),
        };
    }
    async function handleAssetInvoice(data, results) {
        const account = assetAccount(data.invoice);
        if (!account) return;
        await addInvoice(results, data, "Fixed Asset Invoice Created", account, "211.100");
    }
    async function handleAssetPayment(data, results) {
        if (!sent(data)) return;
        const invoices = [];
        for (const invoice of data.invoices) if (assetAccount(invoice)) invoices.push(invoice);
        await addPayment(results, data, "Fixed Asset Invoice Paid", invoices, "211.100");
    }
    async function handleNonProductInvoice(data, results) {
        if (!isNonProduct(data.invoice)) return;
        const account = await singleAccount(data.invoice, I.accounts, "Non-product invoice");
        if (["004.011", "311.200", "004.004"].includes(account)) return;
        if (account===CARD_REBATE_INCOME) {
            const payments=await client.readRecords(T.payments,ids(data.invoice,I.payments),[P.accounts]);
            const accountIds=[...new Set(payments.flatMap(payment=>ids(payment,P.accounts)))];
            const accounts=await client.readRecords(T.accounts,accountIds,[A.number]);
            if (accounts.some(card=>CARD_LIABILITY_ACCOUNTS.includes(card.text(A.number)))) return;
        }
        await addInvoice(results, data, "Non-product Client Invoice Created", "121.100", account);
    }
    async function handleNonProductPayment(data, results) {
        if (!sent(data)) return;
        const invoices = [];
        for (const invoice of data.invoices) {
            if (!isNonProduct(invoice)) continue;
            const account=await singleAccount(invoice,I.accounts,"Non-product invoice");
            if (["004.011", "311.200", "004.004"].includes(account)) continue;
            if (account===CARD_REBATE_INCOME && CARD_LIABILITY_ACCOUNTS.includes(await singleAccount(data.payment,P.accounts,"Payment"))) continue;
            invoices.push(invoice);
        }
        await addPayment(results, data, "Non-product Client Invoice Paid", invoices, "121.100", true);
    }
    async function handleVendorReturn(data, results) {
        const invoice = data.invoice;
        if (invoice.text(I.type) !== "AP" || invoice.text(I.vendorTypeAP) !== "AP - Credit" || invoice.value(I.cancelled)) return;
        // Post the credit memo as a positive return amount in the stated account direction.
        addResult(results, "Vendor Credit Memo - Returned Goods", "211.100", "131.400",
            Math.abs(moneyUnits(invoice.value(I.amount), 2, "Invoice Amount")), invoiceContext(data, [invoice]));
    }
    async function handleVendorPriceCredit() { throw new Error("Not yet implemented: vendor price credit is deferred."); }

    // ==================== UTILS ====================

    function sent(data) { return data.payment.value(P.sent) && !data.payment.value(P.cancelled) && data.payment.text(P.recordType) === "Regular Payment"; }
    function ids(record, field) { return (record.value(field) || []).map(link => link.id); }
    function isAR(invoice) { return invoice.text(I.type) === "AR" && !invoice.value(I.cancelled); }
    function isDeposit(invoice) { return isAR(invoice) && invoice.text(I.vendorTypeAR) === "AR - Product" && invoice.text(I.kind) === "Deposit Invoice"; }
    function isBalance(invoice) { return isAR(invoice) && invoice.text(I.vendorTypeAR) === "AR - Product" && ["Full Invoice", "Balance Invoice"].includes(invoice.text(I.kind)); }
    function isNonProduct(invoice) { return isAR(invoice) && invoice.text(I.vendorTypeAR) === "AR - Non-Product" && !ids(invoice,I.loan).length && !ids(invoice,I.monthlyLoan).length; }
    async function singleAccount(record, field, label) {
        const links = ids(record, field);
        if (links.length !== 1) throw new Error(`${label} must link exactly one account.`);
        const account = await client.readRecord(T.accounts, links[0], Object.values(A));
        if (!account || !account.text(A.number)) throw new Error(`${label} account number is missing.`);
        return account.text(A.number);
    }
    function assetAccount(invoice) {
        if (invoice.text(I.type) !== "AP" || invoice.text(I.vendorTypeAP) !== "AP - Assets" || invoice.value(I.prepaid) || invoice.value(I.cancelled) || ids(invoice,I.monthlyLoan).length) return null;
        const links = ids(invoice, I.accounts);
        if (!links.length) return null;
        if (links.length !== 1) throw new Error("Fixed asset invoice must link exactly one account.");
        const recordId = links[0], number = FIXED_ASSET_ACCOUNTS.get(recordId);
        return number ? { recordId, number } : null;
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
    function invoiceContext(data, invoices) {
        const invoiceIds = invoices.map(invoice => invoice.id).sort();
        const context = { sourceRecordId: data.record.id, invoiceRecordIds: invoiceIds, branch: [] };
        if (invoiceIds.length === 1) context.invoiceRecordId = invoiceIds[0];
        for (const [name, field] of [["vendor", I.vendors], ["client", I.clients], ["staff", I.staff], ["transaction", I.transactions], ["po", I.purchaseOrders]]) {
            context[`${name}RecordIds`] = [...new Set(invoices.flatMap(invoice => ids(invoice, field)))].sort();
        }
        context.stateRecordIds = [...new Set(invoices.flatMap(invoice => ids(invoice, I.states)))].sort();
        context.branch = combinedInvoiceBranches(invoices);
        return context;
    }
    function addResult(results, category, debit, credit, cents, context) {
        if (!cents) return;
        results.push({ category, postings: [{ debitAccount: typeof debit === "string" ? { number: OPERATING_EXPENSE_ACCOUNT_MAPPING[debit] ?? debit } : debit, creditAccount: { number: OPERATING_EXPENSE_ACCOUNT_MAPPING[credit] ?? credit },
            amount: (cents / 100).toFixed(2), ...context }] });
    }
    async function addInvoice(results, data, category, debit, credit) {
        addResult(results, category, debit, credit, moneyUnits(data.invoice.value(I.amount), 2, "Invoice Amount"), invoiceContext(data, [data.invoice]));
    }
    async function addPayment(results, data, category, invoices, account, incoming = false) {
        if (!invoices.length) return;
        const bank = await singleAccount(data.payment, P.accounts, "Payment");
        addResult(results, category, incoming ? bank : account, incoming ? account : bank,
            allocateInvoicePaymentCents(data.payment.value(P.amount), data.invoices, invoices, I.paymentProportion), invoiceContext(data, invoices));
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
        "INV-15": handleBalanceInvoice, "INV-16": handleBalancePayment,
        "PAY-03": (data,results) => handleBalancePayment(data,results,true), "INV-07": handleAssetInvoice,
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
