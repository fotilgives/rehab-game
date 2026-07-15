-- =============================================================================
-- Виплата РІВНО за таблицею 35 раундів (без ліміту фонду центру).
-- =============================================================================
-- Модель (узгоджено з власником):
--   * Виплата гравця = значення таблиці (res_*) для зіграного ходу, завжди точно.
--   * Ставка списується при ставці (rps_place_bet: balance -= stake), тож чистий
--     результат = payout - stake. Якщо res < ставки — це реальний програш по таблиці.
--   * Без ліміту: фонд центру в розрахунку НЕ використовується (виплата завжди повна).
--   * Боти (без профілю) баланс не отримують — лише живі гравці.
-- Це повертає модель з 0008, але прибирає обмеження «Банку центру» (за рішенням
-- власника: рівно по таблиці без ліміту). Числа таблиці вже в rps_bot_script.
-- =============================================================================

create or replace function public.rps_settle_round(p_round_id bigint)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  rno int; rk int; sc int; pp int; mx int; cos text; r record;
begin
  rno := ((p_round_id - 1) % 35) + 1;
  select res_rock, res_scissors, res_paper into rk, sc, pp
    from rps_bot_script where round_no = rno;
  if rk is null then return; end if;

  -- Косметичний «виграшний хід раунду» = найбільше значення таблиці.
  mx := greatest(rk, sc, pp);
  cos := case when rk = mx then 'rock' when sc = mx then 'scissors' else 'paper' end;
  update rps_rounds set win_move = cos where id = p_round_id;

  -- Виплата = рівно значення таблиці для зіграного ходу (real_move).
  for r in
    select b.id, s.real_move,
           (case s.real_move when 'rock' then rk when 'scissors' then sc else pp end) as tablepay
    from rps_secret s
    join rps_bets b on b.round_id = s.round_id and b.player_id = s.player_id
    where s.round_id = p_round_id
    order by b.id
  loop
    update rps_bets set payout = r.tablepay, move = r.real_move where id = r.id;
  end loop;

  -- Баланс/перемоги/блеф — лише живим гравцям. «Перемога» = виплата > ставки.
  update rps_profiles p
     set balance = balance + b.payout,
         wins = wins + (case when b.payout > b.stake then 1 else 0 end),
         bluff_ready = (b.payout > b.stake)
    from rps_bets b
    where b.round_id = p_round_id and b.player_id = p.id;
end; $function$;
