alter table public.expense_maintenance_issues
  drop constraint expense_maintenance_issues_notes_check,
  add column resolved boolean not null default false;

grant update (resolved) on public.expense_maintenance_issues to authenticated;

create function public.append_expense_issue_note(issue_id text, note_text text)
returns text
language sql
security invoker
set search_path = ''
as $$
  update public.expense_maintenance_issues
  set notes = case when notes = '' then '' else notes || E'\n\n' end
    || '[' || pg_catalog.to_char(clock_timestamp() at time zone 'America/Chicago', 'Mon FMDD, FMHH12:MIAM') || ']'
    || E'\n' || note_text
  where id = issue_id
    and char_length(note_text) <= 4000
    and note_text ~ '[^[:space:]]'
  returning notes;
$$;

revoke all on function public.append_expense_issue_note(text, text) from public, anon, authenticated;
grant execute on function public.append_expense_issue_note(text, text) to authenticated;
