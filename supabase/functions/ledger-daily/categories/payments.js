// Current Payment T-Charts. Each source owns its journals and reversal; the shared writer only records final pairs.
import { combinedInvoiceBranches } from "./invoice-branch.ts";
import { CARD_LIABILITY_ACCOUNTS, CARD_REBATE_INCOME, paymentWorkerFields as fields, POSTING_FIELDS, LINKED_SETTLEMENT_FIELDS, LOAN_RECORDS, LOAN_SOURCE_FIELDS } from "../definitions.ts";
import { inSyncDateRange } from "../scope.ts";
import { allocateInvoicePaymentCents } from "./payment-allocation.ts";

export function createCategories(client, customerBalance) {
    const { TABLES: T, INVOICE_FIELDS: I, PAYMENT_FIELDS: P, LINE_FIELDS: L, ACCOUNT_FIELDS: A } = fields;

    function verifiedCredit(credit, method) {
        if (!invoiceMatches(credit,"AR","AR - Refund/Credit") || credit.text(I.application)!==method)
            throw new Error("Use a linked AR credit with the matching Method of Application.");
        const origins=ids(credit,I.originalCreditPayment);
        if (origins.length!==1) throw new Error("Customer credit must identify one original receipt.");
        const branches=[...new Set(credit.value(I.transactionBranch) ?? [])];
        if (ids(credit,I.transactions).length!==1 || branches.length!==1)
            throw new Error("Customer credit needs one linked transaction with a verified branch.");
        return { originId:origins[0], invoiceId:credit.id, branch:branches[0] };
    }
    async function confirmCredit(data, credit, cents) {
        if (!customerBalance) throw new Error("Customer credit balance reader is not configured.");
        if (cents<=0 || await customerBalance.credit(credit.originId,credit.invoiceId,data.record.id,data.entryDate?.slice(0,10))<cents)
            throw new Error("The application or refund exceeds the posted customer credit available.");
        return { originId:credit.originId, invoiceId:credit.invoiceId, cents };
    }
    async function handleClientCreditApplication(data,results) {
        const invoice=data.invoice;
        if (!invoiceMatches(invoice,"AR") || !nonzero(invoice,I.creditsApplied)) return;
        const linked=ids(invoice,I.sourceCredits);
        if (linked.length!==1 || linked[0]===invoice.id)
            throw new Error("Credit application needs one distinct source credit with a verified allocation.");
        const record=await client.readRecord(T.invoices,linked[0],Object.values(I));
        const credit=verifiedCredit(record,"Credit to Another Order");
        if (combinedInvoiceBranches([invoice])[0]!==credit.branch)
            throw new Error("Customer credit and recipient invoice branches must match.");
        const creditClients=ids(record,I.clients), invoiceClients=ids(invoice,I.clients);
        if (creditClients.length!==1 || invoiceClients.length!==1 || creditClients[0]!==invoiceClients[0])
            throw new Error("Customer credit and recipient invoice must belong to the same customer.");
        const cents=-money(invoice.value(I.creditsApplied),"Credits Applied");
        const creditBalance=await confirmCredit(data,credit,cents);
        const open=await customerBalance.receivable(invoice.id,invoice.id);
        if (open==null || cents>open) throw new Error("Credit application exceeds the recipient invoice's posted open AR.");
        data.customerSettlement={receivables:[{invoiceId:invoice.id,openCents:open}],credit:creditBalance};
        addResult(results,"Client Credit Applied","221.300","121.100",cents,{
            ...context(data,[invoice]),branch:[credit.branch],sourceRecordId:credit.originId,
            debitInvoiceRecordId:credit.invoiceId,creditInvoiceRecordId:invoice.id,
        });
    }
    async function handleClientCashRefund(data,results) {
        if (!sent(data)) return;
        const invoices=data.invoices.filter(invoice=>invoiceMatches(invoice,"AR","AR - Refund/Credit") && invoice.text(I.application)==="Cash Refund");
        if (!invoices.length) return;
        if (invoices.length!==1 || ids(data.payment,P.invoices).length!==1)
            throw new Error("A customer refund needs one explicitly allocated credit invoice.");
        const credit=verifiedCredit(invoices[0],"Cash Refund");
        if (credit.originId===data.payment.id) throw new Error("The original receipt cannot also be its refund.");
        const cents=-money(data.payment.value(P.amount),"Refund Payment Amount");
        data.customerSettlement={credit:await confirmCredit(data,credit,cents)};
        addResult(results,"Client Cash Refund","221.300",await selectedAccount(data.payment,P.accounts,"Payment"),cents,
            {...context(data,invoices),branch:[credit.branch],sourceRecordId:credit.originId});
    }
    async function handleVendorCardPayment(data,results) {
        if (!sent(data) || data.payment.text(P.method)!=="Credit Card") return;
        const invoices=data.invoices.filter(invoice=>invoiceMatches(invoice,"AP","AP - Product"));
        if (!invoices.length) return;
        const card=await selectedAccount(data.payment,P.accounts,"Payment");
        if (!CARD_LIABILITY_ACCOUNTS.includes(card)) return;
        addPayment(results,data,"Pay a Vendor with the Company Credit Card",invoices,"211.100",card);
    }
    async function handleCardStatementPayment(data,results) {
        if (!sent(data,"CC Batch Payment")) return;
        const miniIds=[...new Set(ids(data.payment,P.miniPayments))];
        const minis=await client.readRecords(T.payments,miniIds,[P.invoices,P.accounts]);
        if (!minis.length || minis.length!==miniIds.length) throw new Error("Card statement must have all linked mini-payments available.");
        await client.readRecords(T.accounts,[...new Set(minis.flatMap(mini=>ids(mini,P.accounts)))],[A.number]);
        const cards=[...new Set(await Promise.all(minis.map(mini=>selectedAccount(mini,P.accounts,"Statement mini-payment"))))];
        if (cards.length!==1 || !CARD_LIABILITY_ACCOUNTS.includes(cards[0]))
            throw new Error("Card statement mini-payments must identify one Amex or Chase account.");
        const bank=await selectedAccount(data.payment,P.accounts,"Payment");
        if (CARD_LIABILITY_ACCOUNTS.includes(bank) || bank==="231.100") throw new Error("Card statement must use a separate bank account.");
        const invoices=await client.readRecords(T.invoices,[...new Set(minis.flatMap(mini=>ids(mini,P.invoices)))],Object.values(I));
        addResult(results,"Pay the Credit-card Statement",cards[0],bank,
            money(data.payment.value(P.amount),"Payment Amount"),context(data,invoices));
    }
    async function handleEarlyPaymentDiscount(data,results) {
        if (data.record.text(L.type)!=="Discount" || data.record.text(L.discountStatus)==="Expired") return;
        const vendor=data.invoice?.text(I.vendorTypeAP);
        if (!["AP - Product","AP - Expenses (Sales Tax)"].includes(vendor) || !await paidInvoice(data,"AP",vendor)) return;
        addResult(results,"Early-payment Discount Taken","211.100","004.011",-money(data.record.value(L.amount),"Line Amount"),
            context(data,[data.invoice]));
    }
    async function handleVendorCreditApplication(data,results) {
        if (!sent(data)) return;
        for (const invoice of data.invoices) {
            if (!invoiceMatches(invoice,"AP") || invoice.text(I.status)!=="Fully Paid" || !nonzero(invoice,I.creditsApplied)) continue;
            const sourceIds=ids(invoice,I.sourceCredits);
            if (!sourceIds.length) throw new Error("Bill has Credits Applied but no source credit invoice.");
            const credits=await client.readRecords(T.invoices,sourceIds,Object.values(I));
            const weights=credits.map(credit=>{
                if (credit.id===invoice.id || !invoiceMatches(credit,"AP","AP - Credit") || credit.text(I.application)!=="Credit to Another Order")
                    throw new Error("Bill source credit must be a distinct AP Credit invoice marked Credit to Another Order.");
                const available=money(credit.value(I.creditAvailable),"Source Credit Available Credits",4);
                if (available>=0) throw new Error("Source credit Available Credits must be negative.");
                return {id:credit.id,units:-available};
            });
            const amount=-money(invoice.value(I.creditsApplied),"Credits Applied");
            const allocations=allocate(amount,weights);
            const refs=context(data,[invoice]);
            results.push({category:"Bill Paid Using Vendor Credits",entryKey:invoice.id,
                postings:credits.filter(credit=>allocations.get(credit.id)).map(credit=>({
                    debitAccount:{number:"211.100"},creditAccount:{number:"211.100"},amount:(allocations.get(credit.id)/100).toFixed(2),
                    ...refs,sourceRecordId:credit.id,debitInvoiceRecordId:invoice.id,creditInvoiceRecordId:credit.id}))});
        }
    }
    async function handleVendorReturn(data,results) {
        if (!sent(data,"Return Payment") || data.payment.text(P.type)!=="AP") return;
        const refs=context(data,data.invoices);
        addResult(results,"Vendor Payment Returned",await selectedAccount(data.payment,P.accounts,"Payment"),"211.100",-money(data.payment.value(P.amount),"Payment Amount"),refs);
    }
    async function handleVendorRepayment(data,results) {
        if (!sent(data,"Repayment") || data.payment.text(P.type)!=="AP") return;
        addResult(results,"Vendor Return Payment Repaid","211.100",await selectedAccount(data.payment,P.accounts,"Payment"),money(data.payment.value(P.amount),"Payment Amount"),context(data,data.invoices));
    }
    async function handleVendorRefund(data,results) {
        if (!sent(data)) return;
        const invoices=data.invoices.filter(invoice=>invoiceMatches(invoice,"AP","AP - Refund"));
        if (!invoices.length) return;
        addResult(results,"Vendor Refund Received",await selectedAccount(data.payment,P.accounts,"Payment"),"211.100",-allocateInvoicePaymentCents(data.payment.value(P.amount),data.invoices,invoices,I.paymentProportion),context(data,invoices));
    }
    async function handleLoanFunding(data,results,setup) {
        const loan = data.record;
        if (!loan.value(LOAN_RECORDS.active) || loan.text(LOAN_RECORDS.setup) !== setup) return;
        const cents = money(loan.value(LOAN_RECORDS.amount),"Loan Amount");
        if (cents <= 0) throw new Error("Loan Amount must be positive.");
        const original = loan.value(LOAN_RECORDS.date);
        const date = loan.value(LOAN_RECORDS.overrideDate) ?? (Array.isArray(original) && original.length === 1 ? original[0] : original);
        if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(date)) throw new Error("One effective Loan Start Date is required.");
        data.entryDate = date.slice(0,10);
        const credit = await selectedAccount(loan, LOAN_RECORDS.account,"Loan","Liability");

        const cash = setup === LOAN_RECORDS.cashSetup;
        let debit = "112.100", invoices = [];
        if (cash) {
            const sourceIds = ids(loan,LOAN_RECORDS.sourceInvoice);
            if (sourceIds.length > 1) throw new Error("Loan must link at most one funding invoice.");
            invoices = await client.readRecords(T.invoices,sourceIds,Object.values(I));
            if (invoices.some(invoice=>invoice.value(I.cancelled) || ids(invoice,I.manualJournals).length)) return;
        } else {
            const assetIds = ids(loan,LOAN_RECORDS.asset);
            if (assetIds.length !== 1) throw new Error("Financed purchase must link exactly one asset.");
            const asset = await client.readRecord(LOAN_RECORDS.assetTable,assetIds[0],[LOAN_RECORDS.assetAccount]);
            if (!asset) throw new Error("Financed purchase asset is missing.");
            debit = await selectedAccount(asset,LOAN_RECORDS.assetAccount,"Financed asset","Asset");
        }
        addResult(results,cash ? "Loan Funding Recorded" : "Financed Purchase Recorded",debit,credit,cents,context(data,invoices));
    }
    async function handleLoanPayment(data,results) {
        const { invoice, record } = data;
        const loans = ids(invoice,I.monthlyLoan);
        if (!loans.length || invoice.value(I.cancelled) || invoice.text(I.status) !== "Fully Paid") return;
        if (loans.length !== 1) throw new Error("A monthly repayment invoice must link exactly one loan.");
        const cents = money(record.value(L.amount),"Line Amount");
        if (!cents) return;
        const debit = await selectedAccount(record,L.accounts,"Loan repayment line");
        if (debit !== "007.003") {
            const loan = await client.readRecord(LOAN_RECORDS.table,loans[0],[LOAN_RECORDS.account]);
            if (!loan) throw new Error("Monthly repayment loan is missing.");
            if (debit !== await selectedAccount(loan,LOAN_RECORDS.account,"Loan")) return;
        }
        const settlements = await linkedSettlements(invoice);
        if (settlements.length !== 1) throw new Error("A fully paid loan invoice must identify exactly one sent regular payment.");
        const payment = settlements[0];
        const date = payment.text(P.date).slice(0,10);
        if (!date) throw new Error("Loan repayment Payment Date is missing.");
        if (!inSyncDateRange(date,client.dateRange)) return;
        data.entryDate = payment.value(P.date);
        addResult(results,"Monthly Loan Repayment",debit,await selectedAccount(payment,P.accounts,"Payment"),cents,context(data,[invoice]));
    }
    async function handleOwnerDistribution(data,results) {
        await accountPayment(data,results,"Owner Distribution Paid","AP","AP - Expenses (Non-Sales Tax)","316.100",false);
    }
    async function handleOwnerContribution(data,results) {
        await accountPayment(data,results,"Owner Contribution Received","AR","AR - Non-Product","311.200",true);
    }
    async function handleInsuranceReceipt(data,results) {
        if (!sent(data)) return;
        const invoices=await accountInvoices(data,"AR","AR - Non-Product","004.004");
        addPayment(results,data,"Insurance Claim Payout Received",invoices,"112.100","004.004");
    }
    async function handleSecurityDepositInvoice(data,results) {
        if (!invoiceMatches(data.invoice,"AP","AP - Assets") || await selectedAccount(data.invoice,I.accounts,"Invoice")!=="143.200") return;
        addResult(results,"Security Deposit Invoice","143.200","211.100",money(data.invoice.value(I.amount),"Invoice Amount"),context(data,[data.invoice]));
    }
    async function handleSecurityDepositPayment(data,results) {
        await accountPayment(data,results,"Security Deposit Paid","AP","AP - Assets","143.200",false,"211.100");
    }
    async function handleCardRebate(data,results) {
        if (!sent(data)) return;
        const card=await selectedAccount(data.payment,P.accounts,"Payment");
        if (!CARD_LIABILITY_ACCOUNTS.includes(card)) return;
        const statementDiscounts=[], cashback=[];
        for (const invoice of data.invoices) {
            if (invoice.text(I.status)!=="Fully Paid" || !ids(invoice,I.accounts).length) continue;
            const isStatementDiscount=invoiceMatches(invoice,"AP","AP - Expenses (Non-Sales Tax)")
                && data.payment.text(P.method)==="Credit Card" && invoice.value(I.amount)<0;
            const isCashback=invoiceMatches(invoice,"AR","AR - Non-Product");
            if ((!isStatementDiscount && !isCashback) || await selectedAccount(invoice,I.accounts,"Invoice")!==CARD_REBATE_INCOME) continue;
            (isStatementDiscount ? statementDiscounts : cashback).push(invoice);
        }
        if (statementDiscounts.length) {
            const cents=-paymentShare(data,statementDiscounts);
            addResult(results,"Credit-card Rebate Earned",card,CARD_REBATE_INCOME,cents,context(data,statementDiscounts),cashback.length?"statement-discounts":undefined);
        }
        addPayment(results,data,"Credit-card Rebate Earned",cashback,card,CARD_REBATE_INCOME);
    }

    function ids(record,field) { return (record.value(field)||[]).map(link=>link.id); }
    function invoiceMatches(invoice,type,vendor) {
        return invoice && !invoice.value(I.cancelled) && invoice.text(I.type)===type && (!vendor || invoice.text(type==="AP"?I.vendorTypeAP:I.vendorTypeAR)===vendor);
    }
    function sent(data,recordType="Regular Payment") { return data.payment.value(P.sent) && !data.payment.value(P.cancelled) && data.payment.text(P.recordType)===recordType; }
    function nonzero(record,field) { return record.value(field)!=null && record.value(field)!==0; }
    function money(value,label,precision=2) {
        if (typeof value!=="number" || !Number.isFinite(value)) throw new Error(`${label} is missing or invalid.`);
        const [digits,exponent="0"]=String(Math.abs(value)).split("e");
        const cents=Math.sign(value)*Math.round(Number(`${digits}e${Number(exponent)+precision}`));
        if (!Number.isSafeInteger(cents)) throw new Error(`${label} exceeds safe cent precision.`);
        return cents===0?0:cents;
    }
    function allocate(cents,weights) {
        const total=weights.reduce((sum,weight)=>sum+BigInt(weight.units),0n);
        if (!total) throw new Error("Source credit total is zero.");
        const sign=Math.sign(cents),amount=BigInt(Math.abs(cents));
        const parts=weights.map(weight=>{
            const numerator=amount*BigInt(weight.units);
            return {id:weight.id,cents:Number(numerator/total)*sign,remainder:numerator%total};
        });
        let remaining=cents-parts.reduce((sum,part)=>sum+part.cents,0);
        for (const part of [...parts].sort((a,b)=>a.remainder===b.remainder?a.id.localeCompare(b.id):a.remainder>b.remainder?-1:1)) {
            if (!remaining) break;
            part.cents+=sign;remaining-=sign;
        }
        return new Map(parts.map(part=>[part.id,part.cents]));
    }
    async function selectedAccount(record,field,label,expectedType) {
        const links=ids(record,field);
        if (links.length!==1) throw new Error(`${label} must link exactly one account.`);
        const account=await client.readRecord(T.accounts,links[0],[...Object.values(A),...(expectedType ? [LOAN_RECORDS.accountType] : [])]);
        if (!account || !account.text(A.number)) throw new Error(`${label} account number is missing.`);
        if (expectedType && account.text(LOAN_RECORDS.accountType) !== expectedType) throw new Error(`${label} must link a ${expectedType.toLowerCase()} account.`);
        return account.text(A.number);
    }
    function context(data,invoices) {
        const invoiceIds=invoices.map(invoice=>invoice.id).sort();
        const refs={sourceRecordId:data.record.id,invoiceRecordIds:invoiceIds,branch:[]};
        if (invoiceIds.length===1) refs.invoiceRecordId=invoiceIds[0];
        for (const [name,field] of [["vendor",I.vendors],["client",I.clients],["staff",I.staff],["transaction",I.transactions],["po",I.purchaseOrders],["state",I.states]]) {
            refs[`${name}RecordIds`]=[...new Set(invoices.flatMap(invoice=>ids(invoice,field)))].sort();
        }
        refs.branch=combinedInvoiceBranches(invoices);
        return refs;
    }
    function addResult(results,category,debit,credit,cents,refs,entryKey) {
        if (!cents) return;
        results.push({category,...(entryKey?{entryKey}:{}),postings:[{debitAccount:{number:debit},creditAccount:{number:credit},amount:(cents/100).toFixed(2),...refs}]});
    }
    function paymentShare(data,invoices) {
        const amount=data.payment.value(P.amount);
        return allocateInvoicePaymentCents(amount,data.invoices,invoices,I.paymentProportion);
    }
    function addPayment(results,data,category,invoices,debit,credit) {
        if (invoices.length) addResult(results,category,debit,credit,paymentShare(data,invoices),context(data,invoices));
    }
    async function accountInvoices(data,type,vendor,code) {
        const invoices=[];
        for (const invoice of data.invoices) if (invoiceMatches(invoice,type,vendor) && ids(invoice,I.accounts).length && await selectedAccount(invoice,I.accounts,"Invoice")===code) invoices.push(invoice);
        return invoices;
    }
    async function accountPayment(data,results,category,type,vendor,code,incoming,settlementAccount=code) {
        if (!sent(data)) return;
        const invoices=await accountInvoices(data,type,vendor,code);
        if (!invoices.length) return;
        const bank=await selectedAccount(data.payment,P.accounts,"Payment");
        addPayment(results,data,category,invoices,incoming?bank:settlementAccount,incoming?settlementAccount:bank);
    }
    async function linkedSettlements(invoice) {
        const controls=POSTING_FIELDS[T.payments];
        const payments=await client.readRecords(T.payments,ids(invoice,I.payments),LINKED_SETTLEMENT_FIELDS);
        return payments.filter(payment=>sent({payment}) && !payment.value(controls.reverse) && !payment.value(controls.reverseDate));
    }
    async function paidInvoice(data,type,vendor) {
        if (!invoiceMatches(data.invoice,type,vendor) || data.invoice.text(I.status)!=="Fully Paid") return false;
        const eligible=(await linkedSettlements(data.invoice)).filter(payment=>inSyncDateRange(payment.text(P.date).slice(0,10),client.dateRange));
        eligible.sort((a,b)=>b.text(P.date).localeCompare(a.text(P.date)) || a.id.localeCompare(b.id));
        if (!eligible.length) return false;
        data.entryDate=eligible[0].value(P.date);
        return true;
    }
    async function loadData(tableId,recordId) {
        const group=tableId===T.invoices?I:tableId===T.payments?P:tableId===T.lines?L:tableId===LOAN_RECORDS.table?LOAN_SOURCE_FIELDS:null;
        if (!group) throw new Error("Unsupported Payment category source table.");
        const record=await client.readRecord(tableId,recordId,Object.values(group));
        if (!record) throw new Error(`Payment category source not found: ${recordId}`);
        const data={record,invoices:[],entryDate:null};
        if (tableId===T.invoices) {data.invoice=record;data.entryDate=record.value(I.date);}
        if (tableId===T.payments) {data.payment=record;data.entryDate=record.value(P.date);data.invoices=await client.readRecords(T.invoices,ids(record,P.invoices),Object.values(I));}
        if (tableId===T.lines) {
            const parents=ids(record,L.invoices);
            if (parents.length!==1) throw new Error("Invoice Line must link exactly one Invoice.");
            data.invoice=await client.readRecord(T.invoices,parents[0],Object.values(I));
            if (!data.invoice) throw new Error("Invoice Line parent is missing.");
        }
        return data;
    }
    const handlers={"PAY-28":handleClientCreditApplication,"PAY-29":handleClientCashRefund,
        "PAY-08":handleVendorCardPayment,"PAY-09":handleCardStatementPayment,"PAY-10":handleEarlyPaymentDiscount,
        "PAY-11":handleVendorCreditApplication,"PAY-12":handleVendorReturn,"PAY-30":handleVendorRepayment,
        "PAY-13":handleVendorRefund,"PAY-31":(data,results)=>handleLoanFunding(data,results,LOAN_RECORDS.cashSetup),
        "PAY-33":(data,results)=>handleLoanFunding(data,results,LOAN_RECORDS.purchaseSetup),"PAY-16":handleLoanPayment,
        "PAY-20":handleOwnerDistribution,"PAY-21":handleOwnerContribution,"PAY-23":handleInsuranceReceipt,
        "PAY-32":handleSecurityDepositInvoice,"PAY-24":handleSecurityDepositPayment,"PAY-27":handleCardRebate};
    return {fields,async evaluate(rule,recordId,tableId=T.payments) {
        const handler=handlers[rule];
        if (!handler) throw new Error(`Unknown Payment category ${rule}.`);
        const data=await loadData(tableId,recordId),results=[];
        await handler(data,results);
        return {data,results};
    }};
}
