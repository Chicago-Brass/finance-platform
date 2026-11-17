-- Allow whole-journal deletion; the existing foreign key cascades its lines.
-- Keep posted-entry edits, line edits/deletes, balance and period checks protected.
do $migration$
declare
  definition text := pg_get_functiondef('public.tg_journal_entries_guard()'::regprocedure);
  delete_guard text := $guard$  if tg_op = 'DELETE' then
    if old.status = 'posted' then
      raise exception 'Posted journal entry #% cannot be deleted. Post a reversing entry instead.', old.entry_number;
    end if;
    return old;
  end if;$guard$;
begin
  if strpos(definition, delete_guard) = 0 then
    raise exception 'Unexpected journal DELETE guard; review the current definition before changing it.';
  end if;
  execute replace(definition, delete_guard, $replacement$  if tg_op = 'DELETE' then
    return old;
  end if;$replacement$);
end
$migration$;
