-- =============================================================================
-- Прибрати «гарантію живим гравцям» — повертає ЧИСТУ циклічну виплату
-- =============================================================================
-- Було: програш живого гравця докидався з денного фонду до (ставка + 25),
--       через що кожна ставка давала +25 («постійний виграш»).
-- Стало: виплата = лише циклічний розподіл пулів (✊←✌️, ✌️←✋, ✋←✊).
--        Гравець може отримати менше ставки (реальний мінус), але клієнт
--        показує це як «виграш +X» (психологія «лотереї без тих хто програв»).
-- =============================================================================
create or replace function public.rps_settle_round(p_round_id bigint)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  rock_pot int; sc_pot int; pp_pot int;
  rock_n int; sc_n int; pp_n int;
  arr record; tgt text; n int; i int; per int; distributed int; r record; share int;
  rpp int; spp int; ppp int; cosmetic text;
begin
  select coalesce(sum(b.stake) filter (where s.real_move='rock'),0),
         coalesce(sum(b.stake) filter (where s.real_move='scissors'),0),
         coalesce(sum(b.stake) filter (where s.real_move='paper'),0),
         count(*) filter (where s.real_move='rock'),
         count(*) filter (where s.real_move='scissors'),
         count(*) filter (where s.real_move='paper')
    into rock_pot, sc_pot, pp_pot, rock_n, sc_n, pp_n
    from rps_secret s
    join rps_bets b on b.round_id = s.round_id and b.player_id = s.player_id
    where s.round_id = p_round_id;

  if rock_pot + sc_pot + pp_pot = 0 then return; end if;

  -- циклічний розподіл: кожна група забирає пул того, кого б'є
  for arr in
    select * from (values
      (rock_pot, 'paper',    'rock'),
      (sc_pot,   'rock',     'scissors'),
      (pp_pot,   'scissors', 'paper')
    ) v(pot, winner, refundm)
  loop
    if arr.pot <= 0 then continue; end if;
    tgt := arr.winner;
    if (tgt='rock' and rock_n=0) or (tgt='scissors' and sc_n=0) or (tgt='paper' and pp_n=0) then
      tgt := arr.refundm;
    end if;

    select count(*) into n
      from rps_secret s where s.round_id = p_round_id and s.real_move = tgt;
    if n = 0 then continue; end if;

    per := arr.pot / n;
    distributed := 0; i := 0;
    for r in
      select b.id from rps_secret s
        join rps_bets b on b.round_id = s.round_id and b.player_id = s.player_id
        where s.round_id = p_round_id and s.real_move = tgt
        order by b.id
    loop
      i := i + 1;
      if i = n then share := arr.pot - distributed; else share := per; end if;
      update rps_bets set payout = payout + share where id = r.id;
      distributed := distributed + share;
    end loop;
  end loop;

  -- розкрити справжні ходи (зняти блеф)
  update rps_bets b set move = s.real_move
    from rps_secret s
    where b.round_id = s.round_id and b.player_id = s.player_id and b.round_id = p_round_id;

  -- косметичний "виграшний хід раунду" = найбільша виплата на гравця
  rpp := case when rock_n > 0 then sc_pot   / rock_n else -1 end;
  spp := case when sc_n   > 0 then pp_pot   / sc_n   else -1 end;
  ppp := case when pp_n   > 0 then rock_pot / pp_n   else -1 end;
  cosmetic := case when rpp >= spp and rpp >= ppp then 'rock'
                   when spp >= ppp then 'scissors' else 'paper' end;
  update rps_rounds set win_move = cosmetic where id = p_round_id;

  -- баланс/перемоги/блеф (реальна перемога = виплата > ставки)
  update rps_profiles p
    set balance = balance + b.payout,
        wins = wins + (case when b.payout > b.stake then 1 else 0 end),
        bluff_ready = (b.payout > b.stake)
    from rps_bets b
    where b.round_id = p_round_id and b.player_id = p.id;
end; $function$;