alter table public.journal_entries
  add column if not exists transaction_type text,
  add column if not exists source_event_type text;

comment on column public.journal_entries.transaction_type is
  'Free-text T-Chart category title from column A, supplied by the Airtable trigger.';

comment on column public.journal_entries.source_event_type is
  'Airtable payment lifecycle event, such as sent, reconciled, cancelled or returned, for source-event replay isolation.';
