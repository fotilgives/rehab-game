-- =============================================================================
-- Банк центру знову зменшується на виграші — БЕЗ обмеження виплат
-- =============================================================================
-- Виплата = рівно значення таблиці (як і було, без ліміту). Додатково: сумарний
-- профіт живих гравців (payout - stake) віднімається від rps_center_bonus.amount,
-- щоб «Банк центру» візуально зменшувався на виграші. Фонд не падає нижче 0;
-- виплати НЕ обрізаються, навіть коли фонд порожній. Денний скид — rps_bonus_accrue.
-- =============================================================================

create or replace function public.rps_settle_round(p_round_id bigint)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  rno int; rk int; sc int; pp int; mx int; cos text; r record;
  v_total_profit int := 0;
begin
  rno := ((p_round_id - 1) % 35) + 1;
  select res_rock, res_scissors, res_paper into rk, sc, pp
    from rps_bot_script where round_no = rno;
  if rk is null then return; end if;

  perform rps_bonus_accrue();

  mx := greatest(rk, sc, pp);
  cos := case when rk = mx then 'rock' when sc = mx then 'scissors' else 'paper' end;
  update rps_rounds set win_move = cos where id = p_round_id;

  for r in
    select b.id, b.stake, s.real_move,
           (case s.real_move when 'rock' then rk when 'scissors' then sc else pp end) as tablepay,
           exists(select 1 from rps_profiles p where p.id = b.player_id) as is_real
    from rps_secret s
    join rps_bets b on b.round_id = s.round_id and b.player_id = s.player_id
    where s.round_id = p_round_id
    order by b.id
  loop
    update rps_bets set payout = r.tablepay, move = r.real_move where id = r.id;
    if r.is_real and r.tablepay > r.stake then
      v_total_profit := v_total_profit + (r.tablepay - r.stake);
    end if;
  end loop;

  if v_total_profit > 0 then
    update rps_center_bonus
       set amount = greatest(0, amount - v_total_profit), last_claim_at = now(), updated_at = now()
     where id = 1;
  end if;

  update rps_profiles p
     set balance = balance + b.payout,
         wins = wins + (case when b.payout > b.stake then 1 else 0 end),
         bluff_ready = (b.payout > b.stake)
    from rps_bets b
    where b.round_id = p_round_id and b.player_id = p.id;
end; $function$;
