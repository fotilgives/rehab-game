-- Остаточний фікс створення турніру + захист від застряглого схема-кешу
-- PostgREST. Тримаємо ДВА підписи rps_admin_create_tournament:
--   • 8-арг (з власними ставкою й тривалістю раунду) — основний виклик фронту;
--   • 6-арг — сумісність зі старим кешем PostgREST (цей підпис існував ще з
--     міграції 0023, тож PostgREST його гарантовано «бачить»). Фронт падає на
--     нього, якщо кеш ще не підхопив 8-арг. Делегує на 8-арг із дефолтами.
-- Defaults на 8-арг НЕ ставимо — щоб 6-арг і 8-арг не конфліктували при резолві.

-- 8-арг (основний)
drop function if exists public.rps_admin_create_tournament(uuid, text, text, text, integer, uuid[], integer, integer);
create function public.rps_admin_create_tournament(
  p_token uuid, p_name text, p_desc text, p_date text, p_prepay integer, p_player_ids uuid[],
  p_stake integer, p_round_seconds integer
) returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare v_tid bigint; v_pid uuid; v_date timestamptz;
begin
  if not rps_is_admin_token(p_token) then return jsonb_build_object('error','forbidden'); end if;
  begin v_date := nullif(trim(p_date), '')::timestamptz; exception when others then v_date := null; end;
  insert into rps_tournaments(name, description, date, prepay_coins, stake, round_seconds)
    values (p_name, p_desc, v_date, coalesce(p_prepay,0), coalesce(p_stake,100), coalesce(p_round_seconds,30))
    returning id into v_tid;
  if p_player_ids is not null then
    foreach v_pid in array p_player_ids loop
      insert into rps_tournament_invites(tournament_id, player_id) values (v_tid, v_pid)
        on conflict (tournament_id, player_id) do nothing;
    end loop;
  end if;
  return jsonb_build_object('tournament_id', v_tid, 'invited', array_length(p_player_ids,1));
end; $function$;
grant execute on function public.rps_admin_create_tournament(uuid, text, text, text, integer, uuid[], integer, integer) to anon, authenticated;

-- 6-арг (сумісність зі старим схема-кешем; делегує на 8-арг)
create or replace function public.rps_admin_create_tournament(
  p_token uuid, p_name text, p_desc text, p_date text, p_prepay integer, p_player_ids uuid[]
) returns jsonb language plpgsql security definer set search_path to 'public' as $function$
begin
  return public.rps_admin_create_tournament(
    p_token, p_name, p_desc, p_date, p_prepay, p_player_ids, 100, 30
  );
end; $function$;
grant execute on function public.rps_admin_create_tournament(uuid, text, text, text, integer, uuid[]) to anon, authenticated;

notify pgrst, 'reload schema';
