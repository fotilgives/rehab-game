-- =============================================================================
-- Система турнірних запрошень (версія з uuid токеном)
-- =============================================================================

-- Турніри
create table if not exists public.rps_tournaments (
  id           bigserial primary key,
  name         text not null,
  description  text,
  date         timestamptz,
  prepay_coins int not null default 0,
  created_at   timestamptz default now()
);

-- Запрошення
create table if not exists public.rps_tournament_invites (
  id            bigserial primary key,
  tournament_id bigint not null references rps_tournaments(id) on delete cascade,
  player_id     uuid not null references rps_profiles(id) on delete cascade,
  status        text not null default 'pending'
                  check (status in ('pending', 'yes', 'no', 'later')),
  responded_at  timestamptz,
  created_at    timestamptz default now(),
  unique(tournament_id, player_id)
);

-- Адмін: створити турнір та надіслати запрошення
create or replace function public.rps_admin_create_tournament(
  p_token      uuid,
  p_name       text,
  p_desc       text,
  p_date       text,    -- ISO timestamp або null
  p_prepay     int,
  p_player_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tid  bigint;
  v_pid  uuid;
  v_date timestamptz;
begin
  if not rps_is_admin_token(p_token) then
    return jsonb_build_object('error', 'forbidden');
  end if;

  begin
    v_date := nullif(trim(p_date), '')::timestamptz;
  exception when others then
    v_date := null;
  end;

  insert into rps_tournaments(name, description, date, prepay_coins)
    values (p_name, p_desc, v_date, coalesce(p_prepay, 0))
    returning id into v_tid;

  if p_player_ids is not null then
    foreach v_pid in array p_player_ids
    loop
      insert into rps_tournament_invites(tournament_id, player_id)
        values (v_tid, v_pid)
        on conflict (tournament_id, player_id) do nothing;
    end loop;
  end if;

  return jsonb_build_object(
    'tournament_id', v_tid,
    'invited',       array_length(p_player_ids, 1)
  );
end; $function$;

-- Адмін: список турнірів з відповідями
create or replace function public.rps_admin_get_tournaments(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not rps_is_admin_token(p_token) then
    return null;
  end if;

  return (
    select coalesce(jsonb_agg(t order by t.created_at desc), '[]'::jsonb)
    from (
      select
        tr.id,
        tr.name,
        tr.description,
        tr.date,
        tr.prepay_coins,
        tr.created_at,
        jsonb_build_object(
          'total',   count(ti.id),
          'yes',     count(ti.id) filter (where ti.status = 'yes'),
          'no',      count(ti.id) filter (where ti.status = 'no'),
          'later',   count(ti.id) filter (where ti.status = 'later'),
          'pending', count(ti.id) filter (where ti.status = 'pending')
        ) as responses,
        coalesce(
          jsonb_agg(
            jsonb_build_object(
              'player_id', ti.player_id,
              'nick',      p.nickname,
              'status',    ti.status,
              'invite_id', ti.id
            )
          ) filter (where ti.id is not null),
          '[]'::jsonb
        ) as invites
      from rps_tournaments tr
      left join rps_tournament_invites ti on ti.tournament_id = tr.id
      left join rps_profiles p on p.id = ti.player_id
      group by tr.id, tr.name, tr.description, tr.date, tr.prepay_coins, tr.created_at
    ) t
  );
end; $function$;

-- Гравець: відповісти на запрошення
create or replace function public.rps_tournament_respond(
  p_player_id uuid,
  p_invite_id bigint,
  p_status    text   -- 'yes' | 'no' | 'later'
)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_prepay int;
  v_balance int;
begin
  if p_status not in ('yes', 'no', 'later') then
    return 'bad_status';
  end if;

  -- перевірка запрошення
  select tr.prepay_coins, pr.balance
    into v_prepay, v_balance
    from rps_tournament_invites ti
    join rps_tournaments tr on tr.id = ti.tournament_id
    join rps_profiles pr on pr.id = p_player_id
    where ti.id = p_invite_id and ti.player_id = p_player_id
      and ti.status in ('pending', 'later');

  if not found then
    return 'bad_invite';
  end if;

  -- якщо "так" і є передоплата — списати монети
  if p_status = 'yes' and v_prepay > 0 then
    if v_balance < v_prepay then
      return 'insufficient';
    end if;
    update rps_profiles
      set balance = balance - v_prepay
      where id = p_player_id;
  end if;

  update rps_tournament_invites
    set status = p_status, responded_at = now()
    where id = p_invite_id and player_id = p_player_id;

  return 'ok';
end; $function$;

-- Гравець: отримати свої активні запрошення
create or replace function public.rps_my_invites(p_player_id uuid)
returns jsonb
language sql
security definer
set search_path to 'public'
stable as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'invite_id',    ti.id,
        'tournament_id', tr.id,
        'name',         tr.name,
        'description',  tr.description,
        'date',         tr.date,
        'prepay_coins', tr.prepay_coins,
        'status',       ti.status,
        'created_at',   ti.created_at
      )
      order by ti.created_at desc
    ),
    '[]'::jsonb
  )
  from rps_tournament_invites ti
  join rps_tournaments tr on tr.id = ti.tournament_id
  where ti.player_id = p_player_id
    and ti.status in ('pending', 'later');
$$;

grant execute on function public.rps_admin_create_tournament(uuid, text, text, text, int, uuid[]) to anon, authenticated;
grant execute on function public.rps_admin_get_tournaments(uuid) to anon, authenticated;
grant execute on function public.rps_tournament_respond(uuid, bigint, text) to anon, authenticated;
grant execute on function public.rps_my_invites(uuid) to anon, authenticated;
