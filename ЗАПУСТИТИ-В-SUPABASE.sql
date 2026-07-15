-- ============================================================================
--  ТУРНІРНИЙ ДВИЖОК — застосувати до РОБОЧОГО проєкту Supabase (fjrkvxzuwihogmwfpnnt)
--  Дашборд → цей проєкт → SQL Editor → New query → вставити все → Run.
--  Скрипт ідемпотентний: безпечно запускати повторно.
--  Після нього: Settings → API → «Reload schema cache» (або чекай ~30 c).
-- ============================================================================

begin;  -- атомарно: або застосується все, або нічого (гра не лишиться зламаною)

-- ── 0. ТАБЛИЦЯ ВИПЛАТ (rps_bot_script) ───────────────────────────────────────
-- КРИТИЧНО: без цих даних гравці не отримують виплат після раунду (payout = 0)!
-- Додаємо колонки res_rock/scissors/paper якщо їх ще немає
alter table public.rps_bot_script
  add column if not exists res_rock     int,
  add column if not exists res_scissors int,
  add column if not exists res_paper    int;

-- Заповнюємо таблицю 35 раундами (ідемпотентно: вставляємо або оновлюємо)
insert into public.rps_bot_script
  (round_no, rock, scissors, paper, r2s, r2p, s2r, s2p, p2r, p2s, res_rock, res_scissors, res_paper)
values
  ( 1, 7,6,5, 1,0, 2,0, 0,0,  85, 83,140),
  ( 2, 4,5,3, 0,5, 3,0, 0,4, 125, 60,133),
  ( 3, 8,6,6, 0,0, 0,2, 3,0,  75,100,133),
  ( 4, 5,5,5, 0,2, 0,0, 3,2, 100,100,100),
  ( 5, 7,4,6, 0,0, 2,0, 0,2,  57,150,116),
  ( 6, 3,5,4, 0,0, 0,0, 0,0, 166, 80, 75),
  ( 7, 8,5,4, 0,0, 1,0, 0,2,  62, 80,200),
  ( 8, 6,6,6, 0,4, 1,0, 0,2, 100,100,100),
  ( 9, 8,5,7, 0,0, 0,0, 0,0,  62,140,700),
  (10, 4,6,5, 0,0, 0,2, 0,5, 150, 83, 80),
  (11, 6,7,6, 0,0, 0,0, 2,0, 116, 85,100),
  (12, 5,5,5, 0,0, 0,0, 2,0, 100,100,100),
  (13, 8,7,5, 0,3, 0,0, 0,0,  87, 71,160),
  (14, 7,4,5, 0,0, 0,0, 3,0,  57,125,140),
  (15, 3,5,5, 0,0, 3,0, 0,3, 166,100, 60),
  (16, 4,4,4, 0,0, 3,0, 0,3, 100,100,100),
  (17, 4,5,4, 2,2, 0,0, 0,0, 125, 80,100),
  (18, 5,8,6, 0,2, 0,2, 0,0, 160, 75, 83),
  (19, 8,7,5, 0,0, 0,0, 0,0,  87, 71,160),
  (20, 6,6,6, 1,1, 0,2, 0,0, 100,100,100),
  (21, 6,5,4, 1,1, 0,2, 0,0,  83, 80,150),
  (22, 4,6,5, 1,1, 0,2, 0,0, 150, 83, 80),
  (23, 7,8,5, 0,0, 0,4, 0,0, 114, 62,140),
  (24, 5,5,5, 0,1, 0,3, 0,0, 100,100,100),
  (25, 6,4,3, 0,1, 0,3, 0,0,  66, 75,200),
  (26, 7,5,8, 0,0, 0,0, 0,0,  71,160, 87),
  (27, 7,8,4, 0,0, 3,0, 0,0, 114, 50,175),
  (28, 5,5,5, 0,0, 3,0, 0,0, 100,100,100),
  (29, 5,6,8, 0,0, 2,0, 0,0, 120,133, 62),
  (30, 3,4,5, 0,1, 2,0, 0,0, 133,125, 60),
  (31, 5,5,6, 0,1, 0,0, 0,0, 100,120, 83),
  (32, 6,6,6, 0,1, 0,0, 0,0, 100,100,100),
  (33, 5,6,7, 0,1, 0,0, 0,0, 120,116, 71),
  (34, 4,5,6, 0,0, 0,0, 0,0, 125,120, 66),
  (35, 2,4,5, 0,0, 0,2, 1,0, 200,125, 40)
on conflict (round_no) do update set
  rock = excluded.rock, scissors = excluded.scissors, paper = excluded.paper,
  r2s = excluded.r2s, r2p = excluded.r2p, s2r = excluded.s2r, s2p = excluded.s2p,
  p2r = excluded.p2r, p2s = excluded.p2s,
  res_rock = excluded.res_rock, res_scissors = excluded.res_scissors, res_paper = excluded.res_paper;

-- Ініціалізуємо фонд центру (якщо ще не існує)
insert into public.rps_center_bonus(id, amount, cycle_day, last_accrual)
  values (1, 0, 1, current_date)
  on conflict (id) do nothing;


-- ── 1. Колонки та індекс ──────────────────────────────────────────────────
alter table public.rps_tournaments
  add column if not exists stake int not null default 100,
  add column if not exists round_seconds int not null default 30,
  add column if not exists status text not null default 'scheduled',
  add column if not exists started_at timestamptz,
  add column if not exists ended_at timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'rps_tournaments_status_check') then
    alter table public.rps_tournaments
      add constraint rps_tournaments_status_check check (status in ('scheduled','active','finished'));
  end if;
end $$;

alter table public.rps_tournament_invites
  add column if not exists tournament_balance int not null default 0,
  add column if not exists wins int not null default 0;

alter table public.rps_bets
  add column if not exists tournament_id bigint references public.rps_tournaments(id);

-- знімаємо «завислий» активний турнір, щоб не блокував унікальний індекс і старт
update public.rps_tournaments set status = 'scheduled', started_at = null where status = 'active';

create unique index if not exists rps_tournaments_one_active
  on public.rps_tournaments ((true)) where status = 'active';

-- ── 2. Приєднання / відповідь на запрошення ───────────────────────────────
create or replace function public.rps_tournament_join(
  p_player_id uuid, p_tournament_id bigint
) returns text language plpgsql security definer set search_path to 'public' as $function$
declare v_prepay int; v_balance int; v_invite_id bigint; v_status text;
begin
  select prepay_coins into v_prepay from public.rps_tournaments where id = p_tournament_id;
  if not found then return 'tournament_not_found'; end if;
  select balance into v_balance from public.rps_profiles where id = p_player_id;
  if not found then return 'player_not_found'; end if;
  select id, status into v_invite_id, v_status from public.rps_tournament_invites
    where tournament_id = p_tournament_id and player_id = p_player_id;
  if found then
    if v_status = 'yes' then return 'already_joined'; end if;
  else
    insert into public.rps_tournament_invites(tournament_id, player_id, status)
      values (p_tournament_id, p_player_id, 'pending') returning id into v_invite_id;
  end if;
  if v_prepay > 0 then
    if v_balance < v_prepay then return 'insufficient'; end if;
    update public.rps_profiles set balance = balance - v_prepay where id = p_player_id;
  end if;
  update public.rps_tournament_invites
     set status = 'yes', responded_at = now(), tournament_balance = v_prepay
   where id = v_invite_id;
  return 'ok';
end; $function$;

create or replace function public.rps_tournament_respond(
  p_player_id uuid, p_invite_id bigint, p_status text
) returns text language plpgsql security definer set search_path to 'public' as $function$
declare v_prepay int; v_balance int;
begin
  if p_status not in ('yes','no','later') then return 'bad_status'; end if;
  select tr.prepay_coins, pr.balance into v_prepay, v_balance
    from rps_tournament_invites ti
    join rps_tournaments tr on tr.id = ti.tournament_id
    join rps_profiles pr on pr.id = p_player_id
    where ti.id = p_invite_id and ti.player_id = p_player_id and ti.status in ('pending','later');
  if not found then return 'bad_invite'; end if;
  if p_status = 'yes' and v_prepay > 0 then
    if v_balance < v_prepay then return 'insufficient'; end if;
    update rps_profiles set balance = balance - v_prepay where id = p_player_id;
  end if;
  update rps_tournament_invites
     set status = p_status, responded_at = now(),
         tournament_balance = case when p_status = 'yes' then v_prepay else tournament_balance end
   where id = p_invite_id and player_id = p_player_id;
  return 'ok';
end; $function$;

-- ── 3. Створення турніру (9-арг основна + 6-арг сумісна) ───────────────────
-- Додаємо колонку end_date якщо ще не існує
alter table public.rps_tournaments add column if not exists end_date timestamptz;

-- Дропаємо ВСІ можливі варіанти функції (різний порядок параметрів), щоб уникнути конфлікту
drop function if exists public.rps_admin_create_tournament(uuid, text, text, text, text, int, uuid[], int, int);
drop function if exists public.rps_admin_create_tournament(uuid, text, text, text, int, uuid[], int, int, text);
drop function if exists public.rps_admin_create_tournament(uuid, text, text, text, int, uuid[], int, int);
drop function if exists public.rps_admin_create_tournament(uuid, text, text, text, int, uuid[]);
create function public.rps_admin_create_tournament(
  p_token uuid, p_name text, p_desc text, p_date text, p_end_date text, p_prepay int, p_player_ids uuid[],
  p_stake int, p_round_seconds int
) returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare v_tid bigint; v_pid uuid; v_date timestamptz; v_end_date timestamptz;
begin
  if not rps_is_admin_token(p_token) then return jsonb_build_object('error','forbidden'); end if;
  begin v_date := nullif(trim(p_date), '')::timestamptz; exception when others then v_date := null; end;
  begin v_end_date := nullif(trim(p_end_date), '')::timestamptz; exception when others then v_end_date := null; end;
  insert into rps_tournaments(name, description, date, end_date, prepay_coins, stake, round_seconds)
    values (p_name, p_desc, v_date, v_end_date, coalesce(p_prepay,0), coalesce(p_stake,100), coalesce(p_round_seconds,30))
    returning id into v_tid;
  if p_player_ids is not null then
    foreach v_pid in array p_player_ids loop
      insert into rps_tournament_invites(tournament_id, player_id) values (v_tid, v_pid)
        on conflict (tournament_id, player_id) do nothing;
    end loop;
  end if;
  return jsonb_build_object('tournament_id', v_tid, 'invited', array_length(p_player_ids,1));
end; $function$;

-- Сумісна версія без p_end_date (для старих викликів)
create or replace function public.rps_admin_create_tournament(
  p_token uuid, p_name text, p_desc text, p_date text, p_prepay int, p_player_ids uuid[]
) returns jsonb language plpgsql security definer set search_path to 'public' as $function$
begin
  return public.rps_admin_create_tournament(p_token, p_name, p_desc, p_date, null, p_prepay, p_player_ids, 100, 30);
end; $function$;

-- ── 4. Старт / фініш / видалення / редагування ────────────────────────────
create or replace function public.rps_admin_tournament_start(p_token uuid, p_tournament_id bigint)
returns text language plpgsql security definer set search_path to 'public' as $function$
begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  if exists (select 1 from rps_tournaments where status = 'active' and id <> p_tournament_id) then
    return 'other_active';
  end if;
  update rps_tournaments set status = 'active', started_at = now() where id = p_tournament_id;
  if not found then return 'not_found'; end if;
  return 'ok';
end; $function$;

create or replace function public.rps_admin_tournament_finish(p_token uuid, p_tournament_id bigint)
returns text language plpgsql security definer set search_path to 'public' as $function$
begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  update rps_tournaments set status = 'finished', ended_at = now() where id = p_tournament_id;
  if not found then return 'not_found'; end if;
  return 'ok';
end; $function$;

create or replace function public.rps_admin_tournament_delete(p_token uuid, p_id bigint)
returns text language plpgsql security definer set search_path to 'public' as $function$
begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  update rps_bets set tournament_id = null where tournament_id = p_id;
  delete from rps_tournaments where id = p_id;
  if not found then return 'not_found'; end if;
  return 'ok';
end; $function$;

-- Дропаємо всі варіанти rps_admin_tournament_update
drop function if exists public.rps_admin_tournament_update(uuid, bigint, text, text, text, text, int, int, int);
drop function if exists public.rps_admin_tournament_update(uuid, bigint, text, text, text, int, int, int, text);
drop function if exists public.rps_admin_tournament_update(uuid, bigint, text, text, text, int, int, int);
create function public.rps_admin_tournament_update(
  p_token uuid, p_id bigint, p_name text, p_desc text, p_date text, p_end_date text,
  p_prepay int, p_stake int, p_round_seconds int
) returns text language plpgsql security definer set search_path to 'public' as $function$
declare v_status text; v_date timestamptz; v_end_date timestamptz;
begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  select status into v_status from rps_tournaments where id = p_id;
  if not found then return 'not_found'; end if;
  if v_status = 'active' then return 'is_active'; end if;
  begin v_date := nullif(trim(p_date), '')::timestamptz; exception when others then v_date := null; end;
  begin v_end_date := nullif(trim(p_end_date), '')::timestamptz; exception when others then v_end_date := null; end;
  update rps_tournaments set
    name = coalesce(nullif(trim(p_name), ''), name),
    description = p_desc, date = v_date, end_date = v_end_date,
    prepay_coins = coalesce(p_prepay, prepay_coins),
    stake = coalesce(p_stake, stake),
    round_seconds = coalesce(p_round_seconds, round_seconds)
  where id = p_id;
  return 'ok';
end; $function$;

-- ── 5. Інфа для посилання-запрошення + статус гравця + рейтинг ─────────────
create or replace function public.rps_tournament_info(p_tournament_id bigint)
returns jsonb language sql security definer set search_path to 'public' stable as $function$
  select jsonb_build_object(
    'id', id, 'name', name, 'description', description,
    'prepay_coins', prepay_coins, 'date', date, 'end_date', end_date
  ) from public.rps_tournaments where id = p_tournament_id;
$function$;

create or replace function public.rps_my_tournament_status(p_player_id uuid)
returns jsonb language sql security definer set search_path to 'public' stable as $function$
  select case when t.id is null then jsonb_build_object('active', false) else jsonb_build_object(
    'active', true, 'tournament_id', t.id, 'name', t.name, 'stake', t.stake,
    'round_seconds', t.round_seconds, 'prepay_coins', t.prepay_coins,
    'participant', (i.id is not null and i.status = 'yes'),
    'tournament_balance', coalesce(i.tournament_balance, 0)
  ) end
  from (select * from public.rps_tournaments where status = 'active' limit 1) t
  left join public.rps_tournament_invites i on i.tournament_id = t.id and i.player_id = p_player_id;
$function$;

create or replace function public.rps_tournament_leaderboard(p_tournament_id bigint)
returns jsonb language sql security definer set search_path to 'public' stable as $function$
  select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select jsonb_build_object(
      'rank', row_number() over (order by i.tournament_balance desc, i.wins desc),
      'nickname', coalesce(p.nickname, 'Гравець'),
      'tournament_balance', i.tournament_balance,
      'wins', i.wins
    ) as x
    from public.rps_tournament_invites i
    join public.rps_profiles p on p.id = i.player_id
    where i.tournament_id = p_tournament_id and i.status = 'yes'
    order by i.tournament_balance desc, i.wins desc
  ) q;
$function$;

-- ── 6. Гра: турнірний режим (ізольований баланс, лише учасники) ────────────
-- rps_place_bet у робочій базі може мати інший тип результату — дропаємо, щоб
-- можна було перестворити з поверненням jsonb (те, що очікує фронтенд).
drop function if exists public.rps_place_bet(uuid, text, text, integer, text, boolean);
create function public.rps_place_bet(
  p_id uuid, p_nick text, p_move text, p_stake integer,
  p_shown_move text default null, p_is_bluff boolean default false
) returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  cur public.rps_rounds; bal int; v_stake int; v_shown text;
  v_active record; v_tbal int; v_tid bigint := null;
begin
  if p_move not in ('rock','scissors','paper') then raise exception 'bad move'; end if;
  perform rps_register(p_id, p_nick);
  select * into cur from rps_tick();
  if cur.status <> 'betting' or now() >= cur.ends_at then raise exception 'round closed'; end if;
  if p_is_bluff then
    v_shown := coalesce(p_shown_move, p_move);
    if v_shown not in ('rock','scissors','paper') then raise exception 'bad shown'; end if;
  else
    v_shown := p_move;
  end if;
  if exists (select 1 from rps_bets where round_id = cur.id and player_id = p_id) then
    raise exception 'already bet this round';
  end if;
  select * into v_active from rps_tournaments where status = 'active' limit 1;
  if v_active.id is not null then
    select tournament_balance into v_tbal from rps_tournament_invites
      where tournament_id = v_active.id and player_id = p_id and status = 'yes' for update;
    if not found then raise exception 'tournament_locked'; end if;
    v_stake := v_active.stake;
    if v_tbal < v_stake then raise exception 'insufficient_tournament'; end if;
    update rps_tournament_invites set tournament_balance = tournament_balance - v_stake
      where tournament_id = v_active.id and player_id = p_id;
    v_tid := v_active.id; bal := v_tbal - v_stake;
  else
    v_stake := rps_stake();
    select balance into bal from rps_profiles where id = p_id for update;
    if bal < v_stake then raise exception 'insufficient balance'; end if;
    update rps_profiles set balance = balance - v_stake where id = p_id;
    bal := bal - v_stake;
  end if;
  insert into rps_bets(round_id, player_id, nickname, move, stake, is_bluff, tournament_id)
    values (cur.id, p_id, coalesce(nullif(trim(p_nick),''),'Гравець'), v_shown, v_stake, p_is_bluff, v_tid);
  insert into rps_secret(round_id, player_id, real_move) values (cur.id, p_id, p_move);
  update rps_profiles
     set last_bet_round_id = cur.id, rounds_since_activity = rounds_since_activity + 1
   where id = p_id;
  update rps_profiles
     set last_activity_at = now(), decays_applied = 0, rounds_since_activity = 0
   where id = p_id and rounds_since_activity >= 5;
  return jsonb_build_object('round_id', cur.id, 'balance', bal, 'tournament_id', v_tid);
end; $function$;

create or replace function public.rps_settle_round(p_round_id bigint)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare
  rno int; rk int; sc int; pp int; mx int; cos text; r record;
  v_total_profit int := 0; v_payout int;
begin
  rno := ((p_round_id - 1) % 35) + 1;
  select res_rock, res_scissors, res_paper into rk, sc, pp from rps_bot_script where round_no = rno;
  if rk is null then return; end if;
  perform rps_bonus_accrue();
  mx := greatest(rk, sc, pp);
  cos := case when rk = mx then 'rock' when sc = mx then 'scissors' else 'paper' end;
  update rps_rounds set win_move = cos where id = p_round_id;
  for r in
    select b.id, b.stake, b.tournament_id, s.real_move,
           (case s.real_move when 'rock' then rk when 'scissors' then sc else pp end) as tablepay,
           exists(select 1 from rps_profiles p where p.id = b.player_id) as is_real, b.player_id
    from rps_secret s
    join rps_bets b on b.round_id = s.round_id and b.player_id = s.player_id
    where s.round_id = p_round_id order by b.id
  loop
    v_payout := round(r.tablepay * r.stake / 100.0)::int;
    update rps_bets set payout = v_payout, move = r.real_move where id = r.id;
    if r.tournament_id is not null then
      update rps_tournament_invites
         set tournament_balance = tournament_balance + v_payout,
             wins = wins + (case when v_payout > r.stake then 1 else 0 end)
       where tournament_id = r.tournament_id and player_id = r.player_id;
    elsif r.is_real and v_payout > r.stake then
      v_total_profit := v_total_profit + (v_payout - r.stake);
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
    where b.round_id = p_round_id and b.player_id = p.id and b.tournament_id is null;
end; $function$;

create or replace function public.rps_tick()
returns rps_rounds language plpgsql security definer set search_path to 'public' as $function$
declare cur public.rps_rounds; nextw text; v_secs int;
begin
  perform pg_advisory_xact_lock(778899001);
  select coalesce(t.round_seconds, rps_round_seconds()) into v_secs
    from (select round_seconds from rps_tournaments where status = 'active' limit 1) t;
  if v_secs is null then v_secs := rps_round_seconds(); end if;
  select * into cur from rps_rounds order by id desc limit 1;
  if cur.id is null then
    insert into rps_rounds(status, started_at, ends_at, win_move)
      values ('betting', now(), now() + make_interval(secs => v_secs), 'rock') returning * into cur;
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
      values ('betting', now(), now() + make_interval(secs => v_secs), nextw) returning * into cur;
  end if;
  if cur.status = 'betting' then perform rps_autofill(cur, 20); end if;
  return cur;
end; $function$;

-- ── 7. Адмін-список турнірів (зі ставкою/раундом/статусом) ─────────────────
create or replace function public.rps_admin_get_tournaments(p_token uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
begin
  if not rps_is_admin_token(p_token) then return null; end if;
  return (
    select coalesce(jsonb_agg(t order by t.created_at desc), '[]'::jsonb)
    from (
      select tr.id, tr.name, tr.description, tr.date, tr.end_date, tr.prepay_coins, tr.created_at,
        tr.stake, tr.round_seconds, tr.status,
        jsonb_build_object(
          'total', count(ti.id),
          'yes', count(ti.id) filter (where ti.status = 'yes'),
          'no', count(ti.id) filter (where ti.status = 'no'),
          'later', count(ti.id) filter (where ti.status = 'later'),
          'pending', count(ti.id) filter (where ti.status = 'pending')
        ) as responses,
        coalesce(jsonb_agg(
          jsonb_build_object('player_id', ti.player_id, 'nick', p.nickname, 'status', ti.status, 'invite_id', ti.id)
        ) filter (where ti.id is not null), '[]'::jsonb) as invites
      from rps_tournaments tr
      left join rps_tournament_invites ti on ti.tournament_id = tr.id
      left join rps_profiles p on p.id = ti.player_id
      group by tr.id, tr.name, tr.description, tr.date, tr.end_date, tr.prepay_coins, tr.created_at, tr.stake, tr.round_seconds, tr.status
    ) t
  );
end; $function$;

-- ── 8. Права + перезавантаження кешу PostgREST ────────────────────────────
grant execute on function public.rps_admin_create_tournament(uuid,text,text,text,text,int,uuid[],int,int) to anon, authenticated;
grant execute on function public.rps_admin_create_tournament(uuid,text,text,text,int,uuid[]) to anon, authenticated;
grant execute on function public.rps_admin_tournament_start(uuid,bigint) to anon, authenticated;
grant execute on function public.rps_admin_tournament_finish(uuid,bigint) to anon, authenticated;
grant execute on function public.rps_admin_tournament_delete(uuid,bigint) to anon, authenticated;
grant execute on function public.rps_admin_tournament_update(uuid,bigint,text,text,text,text,int,int,int) to anon, authenticated;
grant execute on function public.rps_tournament_info(bigint) to anon, authenticated;
grant execute on function public.rps_tournament_join(uuid,bigint) to anon, authenticated;
grant execute on function public.rps_my_tournament_status(uuid) to anon, authenticated;
grant execute on function public.rps_tournament_leaderboard(bigint) to anon, authenticated;
grant execute on function public.rps_admin_get_tournaments(uuid) to anon, authenticated;

commit;

notify pgrst, 'reload schema';
