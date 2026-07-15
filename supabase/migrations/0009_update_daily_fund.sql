-- =============================================================================
-- Встановлення денного ліміту фонду центру у 5000 монет
-- =============================================================================
create or replace function public.rps_daily_fund() returns integer
  language sql immutable as $$ select 5000 $$;

-- Оновлюємо поточний баланс фонду на 5000
update public.rps_center_bonus set amount = 5000 where id = 1;
