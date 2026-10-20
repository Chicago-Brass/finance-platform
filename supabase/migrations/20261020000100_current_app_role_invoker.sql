-- Applied Oct 20, 2026: run current_app_role() with the caller's rights.
-- The "users read own row" RLS policy already lets a user read their own allowlist row,
-- so SECURITY DEFINER is unnecessary (clears Supabase advisor lint 0029).
alter function public.current_app_role() security invoker;
