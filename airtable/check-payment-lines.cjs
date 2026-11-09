const assert = require("node:assert/strict");
const { harness, link, select } = require("./check.cjs");

async function main() {
    const h = await harness("sent");
    for (const total of [-101, -1, 0, 1, 101]) {
        const shares = h.allocateCents(total, [{ id: "b", cents: -100 }, { id: "a", cents: -100 }, { id: "c", cents: -100 }]);
        assert.equal([...shares.values()].reduce((sum, value) => sum + value, 0), total);
        assert.deepEqual([...shares.values()].filter(Boolean).map(Math.sign), Array([...shares.values()].filter(Boolean).length).fill(Math.sign(total)));
    }
    const { TABLES: T, PAYMENT_FIELDS: P, INVOICE_FIELDS: I, LINE_FIELDS: L, ACCOUNT_FIELDS: A } = h;
    const fractional = await harness("sent"); fractional.bank();
    fractional.payment({ [P.vendorType]: select("AP - Staff"), [P.vendorTypesAP]: ["AP - Staff"] });
    fractional.invoice("invoice", { [I.lines]: [link("a"), link("b")] });
    fractional.add(T.accounts, "wages", { [A.number]: "005.002" });
    for (const id of ["a", "b"]) fractional.add(T.lines, id, { [L.invoices]: [link("invoice")], [L.accounts]: [link("wages")], [L.amount]: 0.005 });
    await fractional.main("payment");
    assert.equal(fractional.calls[0].body.categories[0].postings[0].amount, "0.01", "Sum matching line amounts before rounding the account subtotal to cents");
    const rebate = await harness("sent"); rebate.bank();
    rebate.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Non-Product"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Non-Product"] });
    rebate.add(T.accounts, "rebate", { [A.number]: "004.011" });
    rebate.invoice("invoice", { [I.accounts]: [link("rebate")], [I.paymentStatus]: select("Fully Paid"), [I.rebateTotal]: -2 });
    await rebate.main("payment");
    assert.equal(rebate.calls[0].body.categories[0].postings[0].amount, "-2.00", "Invoice rebates retain their native sign");
    for (const scenario of ["reciprocal", "multiple-accounts"]) {
        const h = await harness("sent"); h.bank();
        h.payment({ [P.vendorType]: select("AP - Staff"), [P.vendorTypesAP]: ["AP - Staff"] });
        h.invoice("invoice", { [I.lines]: [link("line")] });
        h.add(T.accounts, "wages", { [A.number]: "005.002" }); h.add(T.accounts, "tax", { [A.number]: "005.006" });
        h.add(T.lines, "line", { [L.amount]: 10, [L.invoices]: scenario === "reciprocal" ? [] : [link("invoice")], [L.accounts]: scenario === "multiple-accounts" ? [link("wages"), link("tax")] : [link("wages")] });
        await assert.rejects(h.main("payment"), scenario === "reciprocal" ? /reciprocal/ : /one chart of account/);
        assert.equal(h.calls.length, 0);
    }
    const badBalance = await harness("sent"); badBalance.bank();
    badBalance.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Product"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Product"] });
    badBalance.invoice("invoice", { [I.amountToPay]: 100, [I.totalPaid]: 90, [I.remaining]: 5 });
    await assert.rejects(badBalance.main("payment"), /does not reconcile/); assert.equal(badBalance.calls.length, 0);

    const events = await harness("events", { eventType: "cancelled" }); const E = events.PAYMENT_FIELDS;
    events.bank(); events.payment({ [E.type]: select("AR"), [E.vendorType]: select("AR - Product"), [E.vendorTypesAP]: [], [E.vendorTypesAR]: ["AR - Product"], [E.cancelled]: true, [E.cancelledDate]: "2026-10-29", [E.amount]: -1.01, [E.invoices]: [link("a"), link("b")] });
    events.invoice("a", { [I.amountToPay]: -100 }); events.invoice("b", { [I.amountToPay]: -100 });
    await events.main("payment", "cancelled");
    assert.deepEqual(events.calls[0].body.categories[0].postings.map(posting => posting.amount), ["-0.51", "-0.50"]);
    console.log("Passed: signed cent conservation, line identity/account guards, shortfall arithmetic and signed cancellation allocation.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
