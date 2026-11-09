-- Separate account components under one source/category without inventing source records or rules.
alter table public.journal_entries add column source_entry_key text not null default '';
comment on column public.journal_entries.source_entry_key is 'Stable sender-supplied account component identity; empty for a whole-category journal.';
alter table public.journal_lines add column airtable_record_ids text[] not null default '{}';
comment on column public.journal_lines.airtable_record_ids is 'Source lines included in an aggregated account amount.';
drop index public.journal_entries_source_uniq_idx;
create unique index journal_entries_source_uniq_idx
  on public.journal_entries (source_system, source_table, source_record_id, rule_code, source_entry_key)
  nulls not distinct where source_record_id is not null and reverses_entry_id is null;

insert into public.accounts (code, name, account_type, subtype, normal_balance, is_bank, is_postable, active, airtable_record_id)
values ('009.002', 'Travel', 'expense', 'opex', 'debit', false, true, true, 'recNVjoY2qo8bdQT7'),
       ('009.006', 'Dues & Organization Subscription', 'expense', 'opex', 'debit', false, true, true, 'recsUdNvhsEbvL9v3'),
       ('005.102', 'Tech Allowance', 'expense', 'payroll', 'debit', false, true, true, 'recTcmhT5y78RAomk')
on conflict (code) do nothing;
