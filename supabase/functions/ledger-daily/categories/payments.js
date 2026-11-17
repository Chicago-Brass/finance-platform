// Current Payment T-Charts. Each source owns its journals and reversal; the shared writer only records final pairs.
import { paymentWorkerFields as fields, POSTING_FIELDS } from "../definitions.ts";
import { inSyncDateRange } from "../scope.ts";

export function createCategories(client) {
    const { TABLES: T, INVOICE_FIELDS: I, PAYMENT_FIELDS: P, LINE_FIELDS: L, ACCOUNT_FIELDS: A } = fields;

    async function handleClientCredit(data,results) {
        if (!invoiceMatches(data.invoice,"AR","AR - Refund/Credit")) return;
        const invoice=data.invoice, cents=-money(invoice.value(I.amount),"Invoice Amount");
        if (!cents) return;
        const payments=await client.readRecords(T.payments,ids(invoice,I.payments),[P.accounts]);
        const accountIds=[...new Set(payments.flatMap(payment=>ids(payment,P.accounts)))];
        if (accountIds.length!==1) throw new Error("Credit invoice linked payments must identify exactly one payment account.");
        const bank=await client.readRecord(T.accounts,accountIds[0],Object.values(A));
        if (!bank || !bank.text(A.number)) throw new Error("Credit invoice payment account number is missing.");
        addResult(results,"Client Credit Created",bank.text(A.number),"221.300",cents,context(data,[invoice]));
    }
    async function handleClientCreditApplication(data,results) {
        const invoice=data.invoice;
        if (!invoiceMatches(invoice,"AR") || !nonzero(invoice,I.creditsApplied)) return;
        const credits=await client.readRecords(T.invoices,ids(invoice,I.sourceCredits),Object.values(I));
        if (!credits.some(credit=>credit.text(I.application)==="Credit to Another Order")) return;
        addResult(results,"Client Credit Applied","221.300","121.100",-money(invoice.value(I.creditsApplied),"Credits Applied"),context(data,[invoice]));
    }
    async function handleClientCashRefund(data,results) {
        if (!sent(data)) return;
        const invoices=data.invoices.filter(invoice=>invoiceMatches(invoice,"AR","AR - Refund/Credit") && invoice.text(I.application)==="Cash Refund");
        if (!invoices.length) return;
        addResult(results,"Client Cash Refund","221.300",await selectedAccount(data.payment,P.accounts,"Payment"),-money(data.payment.value(P.amount),"Payment Amount"),context(data,invoices));
    }
    async function handleVendorCardPayment(data,results) {
        if (!sent(data) || await selectedAccount(data.payment,P.accounts,"Payment")!=="231.100") return;
        const invoices=data.invoices.filter(invoice=>invoiceMatches(invoice,"AP","AP - Product"));
        addPayment(results,data,"Pay a Vendor with the Company Credit Card",invoices,"211.100","231.100");
    }
    async function handleCardStatementPayment(data,results) {
        if (!sent(data,"CC Batch Payment")) return;
        const minis=await client.readRecords(T.payments,ids(data.payment,P.miniPayments),[P.invoices]);
        const invoices=await client.readRecords(T.invoices,[...new Set(minis.flatMap(mini=>ids(mini,P.invoices)))],Object.values(I));
        addResult(results,"Pay the Credit-card Statement","231.100",await selectedAccount(data.payment,P.accounts,"Payment"),
            money(data.payment.value(P.amount),"Payment Amount"),context(data,invoices));
    }
    async function handleEarlyPaymentDiscount(data,results) {
        if (!await paidInvoice(data,"AP") || data.record.text(L.type)!=="Discount" || data.record.text(L.discountStatus)==="Expired") return;
        addResult(results,"Early-payment Discount Taken","211.100","004.011",-money(data.record.value(L.amount),"Line Amount"),context(data,[data.invoice]));
    }
    async function handleVendorCreditApplication(data,results) {
        if (!sent(data)) return;
        for (const invoice of data.invoices) {
            if (!invoiceMatches(invoice,"AP") || invoice.text(I.status)!=="Fully Paid" || !nonzero(invoice,I.creditsApplied)) continue;
            const sourceIds=ids(invoice,I.sourceCredits);
            if (!sourceIds.length) throw new Error("Bill has Credits Applied but no source credit invoice.");
            const credits=await client.readRecords(T.invoices,sourceIds,Object.values(I));
            const weights=credits.map(credit=>{
                if (credit.id===invoice.id || !invoiceMatches(credit,"AP","AP - Credit")) throw new Error("Bill source credit must be a distinct AP Credit invoice.");
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
        const refs=context(data,data.invoices);refs.branch=[];
        addResult(results,"Vendor Payment Returned","112.100","211.100",-money(data.payment.value(P.amount),"Payment Amount"),refs);
    }
    async function handleVendorRepayment(data,results) {
        if (!sent(data,"Repayment") || data.payment.text(P.type)!=="AP") return;
        addResult(results,"Vendor Return Payment Repaid","211.100","112.100",money(data.payment.value(P.amount),"Payment Amount"),context(data,data.invoices));
    }
    async function handleVendorRefund(data,results) {
        if (!sent(data)) return;
        const invoices=data.invoices.filter(invoice=>invoiceMatches(invoice,"AP","AP - Refund"));
        if (!invoices.length) return;
        addResult(results,"Vendor Refund Received",await selectedAccount(data.payment,P.accounts,"Payment"),"211.100",-money(data.payment.value(P.amount),"Payment Amount"),context(data,invoices));
    }
    async function handleLoanInvoice(data) {
        if (!invoiceMatches(data.invoice,"AR","AR - Non-Product") || !ids(data.invoice,I.loan).length) return;
        throw new Error("Not yet implemented: Payment row 12 needs eligible loan accounts and cash-recognition ownership.");
    }
    async function handleLoanPayment(data) {
        if (!sent(data) || !data.invoices.some(invoice=>invoiceMatches(invoice,"AR","AR - Non-Product"))) return;
        throw new Error("Not yet implemented: Payment row 13 needs the monthly invoice link and principal/interest source.");
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
        if (!sent(data) || await selectedAccount(data.payment,P.accounts,"Payment")!=="231.100") return;
        const invoices=[];
        for (const invoice of data.invoices) if (invoiceMatches(invoice,"AR","AR - Non-Product") && invoice.text(I.status)==="Fully Paid" && ids(invoice,I.accounts).length && await selectedAccount(invoice,I.accounts,"Invoice")==="004.011") invoices.push(invoice);
        addPayment(results,data,"Credit-card Rebate Earned",invoices,"231.100","004.011");
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
    async function selectedAccount(record,field,label) {
        const links=ids(record,field);
        if (links.length!==1) throw new Error(`${label} must link exactly one account.`);
        const account=await client.readRecord(T.accounts,links[0],Object.values(A));
        if (!account || !account.text(A.number)) throw new Error(`${label} account number is missing.`);
        return account.text(A.number);
    }
    function context(data,invoices) {
        const invoiceIds=invoices.map(invoice=>invoice.id).sort();
        const refs={sourceRecordId:data.record.id,invoiceRecordIds:invoiceIds,branch:[]};
        if (invoiceIds.length===1) refs.invoiceRecordId=invoiceIds[0];
        for (const [name,field] of [["vendor",I.vendors],["client",I.clients],["staff",I.staff],["transaction",I.transactions],["po",I.purchaseOrders],["state",I.states]]) {
            refs[`${name}RecordIds`]=[...new Set(invoices.flatMap(invoice=>ids(invoice,field)))].sort();
        }
        const branches=invoices.map(invoice=>invoice.value(I.branch)?.name);
        refs.branch=branches.some(branch=>!branch)?[]:[...new Set(branches)];
        return refs;
    }
    function addResult(results,category,debit,credit,cents,refs,entryKey) {
        if (!cents) return;
        results.push({category,...(entryKey?{entryKey}:{}),postings:[{debitAccount:{number:debit},creditAccount:{number:credit},amount:(cents/100).toFixed(2),...refs}]});
    }
    function addPayment(results,data,category,invoices,debit,credit) {
        if (invoices.length) addResult(results,category,debit,credit,money(data.payment.value(P.amount),"Payment Amount"),context(data,invoices));
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
    async function paidInvoice(data,type,vendor) {
        if (!invoiceMatches(data.invoice,type,vendor) || data.invoice.text(I.status)!=="Fully Paid") return false;
        const controls=POSTING_FIELDS[T.payments];
        const payments=await client.readRecords(T.payments,ids(data.invoice,I.payments),[...Object.values(P),controls.reverse,controls.reverseDate]);
        const eligible=[];
        for (const payment of payments) {
            if (!payment.value(P.sent) || payment.text(P.recordType)!=="Regular Payment" || payment.value(P.cancelled) || payment.value(controls.reverse) || payment.value(controls.reverseDate) || !inSyncDateRange(payment.text(P.date).slice(0,10),client.dateRange)) continue;
            eligible.push(payment);
        }
        eligible.sort((a,b)=>b.text(P.date).localeCompare(a.text(P.date)) || a.id.localeCompare(b.id));
        if (!eligible.length) return false;
        data.entryDate=eligible[0].value(P.date);
        return true;
    }
    async function loadData(tableId,recordId) {
        const group=tableId===T.invoices?I:tableId===T.payments?P:tableId===T.lines?L:null;
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
    const handlers={"PAY-03":handleClientCredit,"PAY-28":handleClientCreditApplication,"PAY-29":handleClientCashRefund,
        "PAY-08":handleVendorCardPayment,"PAY-09":handleCardStatementPayment,"PAY-10":handleEarlyPaymentDiscount,
        "PAY-11":handleVendorCreditApplication,"PAY-12":handleVendorReturn,"PAY-30":handleVendorRepayment,
        "PAY-13":handleVendorRefund,"PAY-31":handleLoanInvoice,"PAY-16":handleLoanPayment,
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
