alter table public.journal_lines
  add column if not exists branch text;

comment on column public.journal_lines.branch is
  'Reserved for future branch attribution. Nullable and unpopulated while consolidated reporting is used.';
