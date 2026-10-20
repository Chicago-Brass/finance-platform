-- Applied Oct 20, 2026: new tables/sequences/functions in public start with NO access for
-- anon/authenticated. Every grant must be explicit (and paired with RLS policies).
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, public;
