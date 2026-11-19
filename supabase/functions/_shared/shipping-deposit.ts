// Shipments sharing a deposit invoice serialize against the same release budget.
import type { Sql, TransactionSql } from "npm:postgres@3.4.9";
import { postPayment, type LedgerPaymentEvent, type PostingResult, PostingError } from "../ledger-payment/ledger.ts";
import { lockLedgerSource } from "./period-review.ts";

async function remainingDeposit(tx: TransactionSql, invoiceId: string, depositCents: number): Promise<number> {
  const [row] = await tx<{ cents: string }[]>`select (coalesce(sum(l.debit-l.credit),0)*100)::bigint::text as cents
    from public.journal_lines l join public.journal_entries e on e.id=l.entry_id
    where e.status='posted' and e.rule_code='INV-14' and e.source_table='tblrnXm1HN9y6HPxY'
      and l.account_code='221.100' and l.invoice_ref @> ${[invoiceId]}::text[]`;
  const cents = depositCents - Number(row.cents);
  if (!Number.isSafeInteger(cents)) throw new PostingError("Deposit balance exceeds safe money precision.");
  return Math.max(0, cents);
}

export async function readRemainingDeposit(sql: Sql, invoiceId: string, depositCents: number): Promise<number> {
  return sql.begin(async tx => {
    await tx`set transaction read only`;
    await tx`set local role service_role`;
    await tx`set local statement_timeout='10s'`;
    return remainingDeposit(tx, invoiceId, depositCents);
  }) as Promise<number>;
}

export async function postCappedShipment(sql: Sql, event: LedgerPaymentEvent,
  options: { allowAdditionalCategories?: boolean; transaction?: TransactionSql; approvalRequestId?: string; approvalEntryDate?: string } = {}): Promise<PostingResult> {
  const category = event.categories?.[0], posting = category?.postings?.[0];
  let key: unknown;
  try { key = JSON.parse(category?.entryKey ?? ""); } catch { throw new PostingError("Shipping requires a deposit invoice and original shipment valuation key."); }
  if (!event.shippingRecordId || event.source?.tableId !== "tblrnXm1HN9y6HPxY" || event.source.recordId !== event.shippingRecordId
      || event.categories.length !== 1 || category.ruleCode !== "INV-14" || category.postings.length !== 1
      || !Array.isArray(key) || key.length !== 2 || typeof key[0] !== "string" || !/^rec[A-Za-z0-9]{14}$/.test(key[0])
      || !Number.isSafeInteger(key[1]) || key[1] === 0 || posting.debitAccount.number !== "221.100" || posting.creditAccount.number !== "004.001"
      || posting.debitAccount.recordId || posting.creditAccount.recordId || posting.invoiceRecordId !== key[0]
      || posting.invoiceRecordIds?.some(id => id !== key[0]) || posting.debitInvoiceRecordId || posting.creditInvoiceRecordId
      || posting.debitInvoiceRecordIds?.length || posting.creditInvoiceRecordIds?.length)
    throw new PostingError("Shipping must supply one deposit-linked 221.100 / 004.001 pair and its original valuation.");
  const [invoiceId, shippedCents] = key as [string, number];
  const depositCents = invoiceDepositCents(event);
  const execute = async (tx: TransactionSql): Promise<PostingResult> => {
    await tx`set local role service_role`;
    await tx`set local statement_timeout='10s'`;
    await lockLedgerSource(tx, event.source!);
    await lockLedgerSource(tx, {tableId:"tbldQXuqNEp8G5pfs",recordId:invoiceId});
    const previous = await tx<{ source_entry_key: string; cents: string }[]>`select e.source_entry_key,(sum(l.debit)*100)::bigint::text as cents
      from ledger_private.current_airtable_journals(${event.source!.tableId},${event.shippingRecordId!}) e join public.journal_lines l on l.entry_id=e.id and l.account_code='221.100'
      where e.source_system='airtable' and e.source_table=${event.source!.tableId} and e.source_record_id=${event.shippingRecordId!}
        and e.rule_code='INV-14' and e.reverses_entry_id is null and e.status in ('posted','pending')
        and (${event.repostId ?? null}::uuid is null or e.posting_cycle=${event.repostId ?? null}::uuid)
      group by e.id,e.source_entry_key`;
    if (previous.length > 1 || previous.some(row => row.source_entry_key !== category.entryKey))
      throw new PostingError("Shipping source already exists with different deposit or shipment values.", "23505");
    const cents = previous.length ? Number(previous[0].cents) : shippedCents < 0 ? shippedCents : Math.min(shippedCents, await remainingDeposit(tx, invoiceId, depositCents));
    if (!Number.isSafeInteger(cents)) throw new PostingError("Shipping amount exceeds safe money precision.");
    const amount = (cents/100).toFixed(2);
    if (options.approvalRequestId && amount !== posting.amount)
      throw new PostingError("Deposit availability changed. Review this pending request before approving its amount.", "23505");
    return postPayment(sql, {...event,categories:[{...category,postings:[{...posting,amount}]}]}, {...options,transaction:tx});
  };
  return options.transaction ? execute(options.transaction) : sql.begin(execute) as Promise<PostingResult>;
}

/** A pending release can only become reportable if its frozen amount is still funded. */
export async function verifyPendingShipment(tx: TransactionSql, event: LedgerPaymentEvent) {
  const category = event.categories[0];
  const [invoiceId, shippedCents] = JSON.parse(category.entryKey!);
  const depositCents = invoiceDepositCents(event);
  await lockLedgerSource(tx, {tableId:"tbldQXuqNEp8G5pfs",recordId:invoiceId});
  const cents = shippedCents < 0 ? shippedCents : Math.min(shippedCents, await remainingDeposit(tx, invoiceId, depositCents));
  if ((cents / 100).toFixed(2) !== category.postings[0].amount)
    throw new PostingError("Deposit availability changed. Review this pending request before approving its amount.", "23505");
}

function invoiceDepositCents(event: LedgerPaymentEvent): number {
  const amount = event.depositInvoiceAmountCents;
  if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount < 0)
    throw new PostingError("Shipping requires the linked Airtable deposit invoice amount in cents.");
  return amount;
}
