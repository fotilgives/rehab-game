-- Фонд центру (singleton) — пропущено в початковій схемі
CREATE TABLE IF NOT EXISTS public.rps_center_bonus (
  id            integer     PRIMARY KEY DEFAULT 1,
  amount        integer     NOT NULL DEFAULT 0,
  cycle_day     integer     NOT NULL DEFAULT 1,
  last_accrual  date,
  last_claim_at timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- Виплата ТОЧНО за таблицею + фонд центру (ліміт 5000/день)
-- =============================================================================
-- Модель (узгоджено з власником):
--   * Боти між собою — окремо, баланс центру НЕ чіпають.
--   * Живий гравець: виплата = рівно значення таблиці (res) для його ходу,
--     незалежно від к-сті інших ставок (1:1 з таблицею).
--   * Профіт (payout-ставка) фінансується з фонду центру; денний ліміт 5000.
--     Фонд порожній → профіт зрізається (повертаємо хоча б ставку).
--   * Програшний хід (res<ставки) — виплата = res (гравець у мінусі, до ботів).
-- =============================================================================

-- Значення таблиці (res-колонка) для кожного раунду.
alter table public.rps_bot_script
  add column if not exists res_rock int,
  add column if not exists res_scissors int,
  add column if not exists res_paper int;

update public.rps_bot_script s set
  res_rock = v.rk, res_scissors = v.sc, res_paper = v.pp
from (values
  (1,85,83,140),(2,125,60,133),(3,75,100,133),(4,100,100,100),(5,57,150,116),
  (6,166,80,75),(7,62,80,200),(8,100,100,100),(9,62,140,700),(10,150,83,80),
  (11,116,85,100),(12,100,100,100),(13,87,71,160),(14,57,125,140),(15,166,100,60),
  (16,100,100,100),(17,125,80,100),(18,160,75,83),(19,87,71,160),(20,100,100,100),
  (21,83,80,150),(22,150,83,80),(23,114,62,140),(24,100,100,100),(25,66,75,200),
  (26,71,160,87),(27,114,50,175),(28,100,100,100),(29,120,133,62),(30,133,125,60),
  (31,100,120,83),(32,100,100,100),(33,120,116,71),(34,125,120,66),(35,200,125,40)
) v(rno, rk, sc, pp)
where s.round_no = v.rno;

-- Фонд центру: денний ліміт 5000, скидається щодня (не накопичується).
create or replace function public.rps_bonus_accrue()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare r public.rps_center_bonus; today date := (now() at time zone 'Europe/Kyiv')::date;
begin
  select * into r from rps_center_bonus where id = 1 for update;
  if not found then
    insert into rps_center_bonus(id, amount, cycle_day, last_accrual)
      values (1, rps_daily_fund(), 1, today) on conflict (id) do nothing;
    return;
  end if;
  if today <= r.last_accrual then return; end if;
  update rps_center_bonus
     set amount = rps_daily_fund(),
         cycle_day = (r.cycle_day % 10) + 1,
         last_accrual = today, updated_at = now()
   where id = 1;
end; $function$;

-- Розрахунок раунду за таблицею.
create or replace function public.rps_settle_round(p_round_id bigint)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  rno int; rk int; sc int; pp int; mx int; cos text;
  v_center int; r record; pay int; profit int; grant_amt int;
begin
  rno := ((p_round_id - 1) % 35) + 1;
  select res_rock, res_scissors, res_paper into rk, sc, pp
    from rps_bot_script where round_no = rno;
  if rk is null then return; end if;

  perform rps_bonus_accrue();
  select amount into v_center from rps_center_bonus where id = 1 for update;
  v_center := coalesce(v_center, 0);

  for r in
    select b.id, b.stake, s.real_move,
           (case s.real_move when 'rock' then rk when 'scissors' then sc else pp end) as tablepay,
           exists(select 1 from rps_profiles p where p.id = b.player_id) as is_real
    from rps_secret s
    join rps_bets b on b.round_id = s.round_id and b.player_id = s.player_id
    where s.round_id = p_round_id
    order by b.id
  loop
    pay := r.tablepay;
    if r.is_real then
      profit := pay - r.stake;
      if profit > 0 then
        grant_amt := least(profit, v_center);       -- профіт з фонду центру
        pay := r.stake + grant_amt;                  -- точно за таблицею поки фонд є
        v_center := v_center - grant_amt;
      end if;
      -- profit<=0: pay = res (програш до ботів), центр не чіпаємо
    end if;
    update rps_bets set payout = pay, move = r.real_move where id = r.id;
  end loop;

  update rps_center_bonus set amount = v_center, last_claim_at = now(), updated_at = now() where id = 1;

  -- косметичний "виграшний хід раунду" = найбільше значення таблиці
  mx := greatest(rk, sc, pp);
  cos := case when rk = mx then 'rock' when sc = mx then 'scissors' else 'paper' end;
  update rps_rounds set win_move = cos where id = p_round_id;

  -- баланс/перемоги/блеф лише живим гравцям
  update rps_profiles p
    set balance = balance + b.payout,
        wins = wins + (case when b.payout > b.stake then 1 else 0 end),
        bluff_ready = (b.payout > b.stake)
    from rps_bets b
    where b.round_id = p_round_id and b.player_id = p.id;
end; $function$;

-- Скинути фонд на денний ліміт зараз.
update public.rps_center_bonus set amount = rps_daily_fund(), updated_at = now() where id = 1;
