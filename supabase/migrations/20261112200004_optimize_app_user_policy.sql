-- Cache the complete JWT email expression once per statement without changing row visibility.
alter policy "users read own row" on public.app_users
using (email = (select lower(auth.jwt() ->> 'email')));
