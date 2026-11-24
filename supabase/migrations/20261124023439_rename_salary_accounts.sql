update public.accounts as account
set name = salary.name
from (values
  ('005.001', 'Salary - Owners'),
  ('005.003', 'Salary - 1099'),
  ('005.101', 'Salary - Offshore')
) as salary(code, name)
where account.code = salary.code and account.name is distinct from salary.name;
