import type { Sql, TransactionSql } from "npm:postgres@3.4.9";

interface ReceiptOrder { day: string; earlierIds: string[]; faceCents?: number }
export interface CustomerSettlement {
  receivables?: { invoiceId: string; openCents: number; order?: ReceiptOrder }[];
  legacyCreditIds?: string[];
  credit?: { originId: string; invoiceId: string; cents: number };
}

export async function openReceivable(tx: TransactionSql, invoiceId: string, sourceId: string, order?: ReceiptOrder) {
  if (order) {
    const [row] = await tx<{ later: boolean; waiting: boolean }[]>`
      select exists(select from public.journal_entries e join public.journal_lines l on e.id=l.entry_id
        where e.rule_code='INV-16' and e.status in ('posted','pending') and e.source_record_id<>${sourceId}
          and l.account_code='121.100' and l.invoice_ref @> ${[invoiceId]}::text[]
          and (e.source_date>${order.day}::date or (e.source_date=${order.day}::date and e.source_record_id>${sourceId}))) as later,
        exists(select from unnest(${order.earlierIds}::text[]) prior(id) where not exists(
          select from public.journal_entries e join public.journal_lines l on e.id=l.entry_id
          where e.rule_code in ('INV-16','PAY-03') and e.status in ('posted','pending')
            and e.reverses_entry_id is null and e.source_record_id=prior.id and l.invoice_ref @> ${[invoiceId]}::text[])) as waiting`;
    if (row.later || row.waiting)
      throw new Error("Process linked AR receipts in accounting-date order before allocating this payment.");
  }
  const [row] = await tx<{ cents: string; ambiguous: boolean; billed: boolean }[]>`
    with attributed as (
    select l.invoice_ref, sum(l.debit-l.credit) as net,
      bool_or(e.source_record_id=${invoiceId} and l.debit>0 and e.status='posted' and e.reverses_entry_id is null
        and e.entry_date<=coalesce(${order?.day ?? null}::date,e.entry_date)) as billed
    from public.journal_lines l join public.journal_entries e on e.id=l.entry_id
    where l.account_code='121.100' and l.invoice_ref @> ${[invoiceId]}::text[]
      and e.status in ('posted','pending')
      and e.entry_date<=coalesce(${order?.day ?? null}::date,e.entry_date)
      and not (e.source_record_id is not distinct from ${sourceId} and e.rule_code in ('INV-16','PAY-28'))
    group by l.invoice_ref
    )
    select (coalesce(sum(net),0)*100)::bigint::text as cents,
      coalesce(bool_or(cardinality(invoice_ref)<>1 and net<>0),false) as ambiguous,
      coalesce(bool_or(billed),false) as billed from attributed`;
  if (row.ambiguous) throw new Error("Historical AR is shared across invoices; reconcile those allocations before posting.");
  if (row.billed) return safeCents(row.cents);
  // A sourced receipt can precede its opening AR. Prior invoice-specific settlements still use up the face amount.
  return order?.faceCents == null ? null : safeCents(String(order.faceCents + Number(row.cents)));
}

export async function availableCustomerCredit(tx: TransactionSql, originId: string, invoiceId: string, sourceId: string, day: string) {
  const [row] = await tx<{ cents: string }[]>`
    select (coalesce(sum(l.credit-l.debit),0)*100)::bigint::text as cents
    from public.journal_lines l join public.journal_entries e on e.id=l.entry_id
    where l.account_code='221.300' and e.source_record_id is distinct from ${sourceId}
      and ((e.rule_code='PAY-03' and e.source_record_id=${originId} and e.status='posted' and e.entry_date<=${day}::date)
        or (e.rule_code in ('PAY-28','PAY-29') and e.status in ('posted','pending')
          and (l.airtable_record_id=${originId} or l.invoice_ref @> ${[invoiceId]}::text[])))`;
  return safeCents(row.cents);
}

function safeCents(value: string) {
  const cents = Number(value);
  if (!Number.isSafeInteger(cents)) throw new Error("Customer ledger balance exceeds safe cent precision.");
  return Math.max(0, cents);
}

export function readCustomerBalance(sql: Sql) {
  return {
    receivable: (invoiceId: string, sourceId: string, order?: ReceiptOrder) => sql.begin(async tx => {
      await tx`set transaction read only`;
      await tx`set local role service_role`;
      return openReceivable(tx, invoiceId, sourceId, order);
    }),
    credit: (originId: string, invoiceId: string, sourceId: string, day: string) => sql.begin(async tx => {
      await tx`set transaction read only`;
      await tx`set local role service_role`;
      return availableCustomerCredit(tx, originId, invoiceId, sourceId, day);
    }),
  };
}

export async function verifyCustomerSettlement(tx: TransactionSql, sourceId: string, settlement: CustomerSettlement, day: string) {
  const balances = settlement.receivables ?? [];
  const locks = [...balances.map(item => item.invoiceId), ...(settlement.credit ? [settlement.credit.originId] : [])];
  for (const id of [...new Set(locks)].sort())
    await tx`select pg_advisory_xact_lock(hashtextextended('customer-balance:' || ${id}, 0))`;
  if (settlement.legacyCreditIds?.length) {
    const [legacy] = await tx`select 1 from public.journal_entries
      where rule_code='PAY-03' and source_table='tbldQXuqNEp8G5pfs'
        and source_record_id=any(${settlement.legacyCreditIds}::text[])
        and status in ('posted','pending') and reverses_entry_id is null limit 1`;
    if (legacy) throw new Error("A linked credit invoice already recorded this receipt. Reconcile the historical cash journal first.");
  }
  for (const item of balances) {
    const available = await openReceivable(tx, item.invoiceId, sourceId, item.order);
    if ((available ?? 0) !== item.openCents)
      throw new Error("Open AR changed. Refresh the payment or credit application before posting.");
  }
  if (settlement.credit) {
    const { originId, invoiceId, cents } = settlement.credit;
    if (!Number.isSafeInteger(cents) || cents <= 0 || await availableCustomerCredit(tx, originId, invoiceId, sourceId, day) < cents)
      throw new Error("The application or refund exceeds the posted customer credit available.");
  }
}
