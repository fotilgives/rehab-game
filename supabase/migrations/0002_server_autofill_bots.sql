-- =============================================================================
-- Серверне авто-заповнення ботів (за сценарієм) — незалежно від браузера
-- =============================================================================
-- Проблема: боти додавались лише коли активний клієнт викликав rps_fill.
-- Без відвідувачів раунд лишався порожнім (0-1 ставка).
-- Рішення: rps_tick сам заповнює поточний betting-раунд до сценарної к-сті.
-- Тепер щойно будь-хто відкриває гру (rps_tick), боти вже на місці; а з
-- pg_cron (нижче) раунди крутяться з ботами навіть коли нікого немає.
-- =============================================================================

-- Ядро заповнення для конкретного раунду (без виклику rps_tick -> без рекурсії).
create or replace function public.rps_autofill(cur public.rps_rounds, p_target integer)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  round_no int; existing_bots int; target int;
  rec record; pid uuid; vnick text; inserted int := 0;
  nicks text[] := array['Олег','Марія','Дмитро','Іра','Назар','Софія','Артем','Юля','Влад','Оля',
                        'Тарас','Катя','Макс','Аня','Ігор','Лєра','Рома','Віка','Сергій','Даша'];
begin
  if cur.id is null or cur.status <> 'betting' or now() >= cur.ends_at then return 0; end if;
  perform pg_advisory_xact_lock(778899002);

  round_no := ((cur.id - 1) % 35) + 1;

  select count(*) into existing_bots
    from rps_bets b
    where b.round_id = cur.id
      and not exists (select 1 from rps_profiles p where p.id = b.player_id);

  target := least(coalesce(p_target, 20), 20);
  if target <= existing_bots then return 0; end if;

  for rec in
    select * from rps_bot_lineup(round_no)
    where slot > existing_bots and slot <= target
    order by slot
  loop
    pid := gen_random_uuid();
    vnick := nicks[1 + ((rec.slot * 7 + round_no) % 20)] || ' 🤖';
    insert into rps_bets(round_id, player_id, nickname, move, stake, is_bluff)
      values (cur.id, pid, vnick, rec.shown_move, rps_stake(), rec.real_move <> rec.shown_move);
    insert into rps_secret(round_id, player_id, real_move)
      values (cur.id, pid, rec.real_move);
    inserted := inserted + 1;
  end loop;

  return inserted;
end; $function$;

-- rps_fill тепер тонка обгортка: тік + заповнення поточного раунду.
create or replace function public.rps_fill(p_target integer)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare cur public.rps_rounds;
begin
  select * into cur from rps_tick();
  return rps_autofill(cur, coalesce(p_target, 20));
end; $function$;

-- rps_tick САМ заповнює ботів у поточному betting-раунді (повний сценарій).
create or replace function public.rps_tick()
returns rps_rounds
language plpgsql
security definer
set search_path to 'public'
as $function$
declare cur public.rps_rounds; nextw text;
begin
  perform pg_advisory_xact_lock(778899001);
  select * into cur from rps_rounds order by id desc limit 1;

  if cur.id is null then
    insert into rps_rounds(status, started_at, ends_at, win_move)
      values ('betting', now(), now() + make_interval(secs => rps_round_seconds()), 'rock')
      returning * into cur;
    perform rps_autofill(cur, 20);
    return cur;
  end if;

  if cur.status = 'betting' and now() >= cur.ends_at then
    perform rps_settle_round(cur.id);
    update rps_rounds set status = 'settled', result = (
      select jsonb_build_object('win_move', cur.win_move, 'players', count(*), 'bank', coalesce(sum(stake),0))
      from rps_bets where round_id = cur.id
    ) where id = cur.id;
    nextw := case cur.win_move when 'rock' then 'scissors' when 'scissors' then 'paper' else 'rock' end;
    insert into rps_rounds(status, started_at, ends_at, win_move)
      values ('betting', now(), now() + make_interval(secs => rps_round_seconds()), nextw)
      returning * into cur;
  end if;

  if cur.status = 'betting' then
    perform rps_autofill(cur, 20);
  end if;
  return cur;
end; $function$;

-- ── Повна автономність через pg_cron (УВІМКНЕНО) ─────────────────────────────
-- Боти крутять раунди й заповнюються навіть коли НІКОГО немає онлайн.
create extension if not exists pg_cron;
select cron.unschedule('rps_autorun') where exists (select 1 from cron.job where jobname = 'rps_autorun');
select cron.schedule('rps_autorun', '30 seconds', 'select public.rps_fill(20)');
