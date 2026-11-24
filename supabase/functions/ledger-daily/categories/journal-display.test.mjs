import assert from "node:assert/strict";
import { test } from "node:test";
import { AirtableClient } from "../airtable.ts";
import { expenseWorkerFields } from "../definitions.ts";
import { addJournalDisplay } from "./journal-display.ts";

const { TABLES, INVOICE_FIELDS } = expenseWorkerFields;
const short = "fld0fjHao1e7VIu76";

test("display labels follow the journal's posted links and tolerate unavailable Airtable data", async () => {
  const field = (id, tableId) => ({ id, type: "singleLineText", ...(tableId && { options: { linkedTableId: tableId } }) });
  const table = (id, ...fields) => ({ id, primaryFieldId: "name", fields: [field("name"), ...fields] });
  const schema = { tables: [table(TABLES.invoices, field(short), field(INVOICE_FIELDS.clients, "clients"),
    field(INVOICE_FIELDS.vendors, "vendors")), table("clients"), table("vendors")] };
  const client = new AirtableClient("test-only", Date.now() + 70_000, async url => {
    if (url.includes("/meta/")) return Response.json(schema);
    if (url.includes("/vendors?")) return new Response("", { status: 403 });
    return Response.json({ records: url.includes("/clients?") ? [
      { id: "c1", fields: { name: "Client One" } }, { id: "c2", fields: {} },
    ] : [{ id: "i1", fields: { [short]: "INV.1234" } }] });
  });
  await client.initialize();
  const event = { source: { tableId: TABLES.lines, recordId: "line" }, categories: [
    { postings: [{ amount: "5.00", invoiceRecordId: "i1", clientRecordIds: ["c1", "c1"], vendorRecordId: "v1" },
      { amount: "0.00", invoiceRecordId: "i2", clientRecordId: "c2" }] },
    { postings: [{ amount: "15.00", invoiceRecordIds: ["i2"], clientRecordIds: ["c2", "c3"] }] },
  ] };
  await addJournalDisplay(client, event);
  assert.deepEqual(event.categories[0].display, { clientNames: ["Client One"], vendorNames: [], referenceNumber: "INV.1234" });
  assert.deepEqual(event.categories[1].display, { clientNames: [], vendorNames: [], referenceNumber: undefined });
  event.source.tableId = TABLES.payments;
  await addJournalDisplay(client, event);
  assert.equal(event.categories[0].display.referenceNumber, undefined);
});
