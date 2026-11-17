-- Operational selection, not a migration/seed default. Re-run only after reviewing rule status.
begin;
update public.ledger_rules set enabled=(rule_code=any(array['PAY-03','PAY-28','PAY-29','PAY-08','PAY-09','PAY-10','PAY-11','PAY-12','PAY-30','PAY-13','PAY-20','PAY-21','PAY-23','PAY-32','PAY-24','PAY-27','EXP-01','EXP-02','EXP-03','EXP-04','EXP-05','EXP-06','EXP-07','EXP-09','EXP-10','EXP-11','EXP-13','EXP-14','EXP-15','EXP-16','EXP-17','EXP-18','EXP-19','EXP-20','EXP-21','EXP-23','EXP-26','EXP-27','INV-12','INV-13','INV-14','INV-15','INV-16','INV-08','INV-10','INV-18']));
do $$ begin if (select count(*) from public.ledger_rules where enabled)<>46 then raise exception 'Expected 46 complete rules'; end if; end $$;
commit;
