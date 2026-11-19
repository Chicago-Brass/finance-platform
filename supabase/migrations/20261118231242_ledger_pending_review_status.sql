-- Commit enum additions before the migration that uses them.
alter type public.entry_status add value 'pending';
alter type public.entry_status add value 'rejected';
