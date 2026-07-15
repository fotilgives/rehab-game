-- Причина «Could not find the function ... in the schema cache»: у PostgREST
-- висіло з'єднання-слухач віком ~98 днів зі старим знімком схеми (до
-- турнірного движка 0031), тож усі NOTIFY reload ігнорувались і нові функції
-- (create/start/finish/update/delete/leaderboard/status) були невидимі.
--
-- Остаточний фікс зроблено на боці БД — примусовий розрив завислих з'єднань
-- PostgREST (pg_terminate_backend по application_name='postgrest'), після чого
-- він перепідключився з чистим знімком схеми. Ця міграція лише фіксує стан:
-- функція перевстановлюється й надсилається сигнал reload.
drop function if exists public.rps_admin_create_tournament(uuid, text, text, text, integer, uuid[], integer, integer);

create function public.rps_admin_create_tournament(
  p_token uuid, p_name text, p_desc text, p_date text, p_prepay integer, p_player_ids uuid[],
  p_stake integer default 100, p_round_seconds integer default 30
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
notify pgrst, 'reload schema';
