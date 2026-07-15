-- Фікс: помилка «Помилка при створенні турніру» була через застаріле
-- перевантаження rps_admin_create_tournament(text,...) з p_token TEXT (мало
-- бути UUID) — PostgREST не міг однозначно обрати функцію серед двох
-- перевантажень. Прибираємо зайве.
drop function if exists public.rps_admin_create_tournament(text, text, text, text, integer, uuid[]);

-- Видалення турніру (звільняє прив'язані ставки, щоб не впертись у FK).
create or replace function public.rps_admin_tournament_delete(p_token uuid, p_id bigint)
returns text language plpgsql security definer set search_path to 'public' as $function$
begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  update rps_bets set tournament_id = null where tournament_id = p_id;
  delete from rps_tournaments where id = p_id;
  if not found then return 'not_found'; end if;
  return 'ok';
end; $function$;

-- Редагування турніру (не можна редагувати активний, щоб не ламати гру на льоту).
create or replace function public.rps_admin_tournament_update(
  p_token uuid, p_id bigint, p_name text, p_desc text, p_date text,
  p_prepay int, p_stake int, p_round_seconds int
) returns text language plpgsql security definer set search_path to 'public' as $function$
declare v_status text; v_date timestamptz;
begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  select status into v_status from rps_tournaments where id = p_id;
  if not found then return 'not_found'; end if;
  if v_status = 'active' then return 'is_active'; end if;
  begin v_date := nullif(trim(p_date), '')::timestamptz; exception when others then v_date := null; end;
  update rps_tournaments set
    name = coalesce(nullif(trim(p_name), ''), name),
    description = p_desc,
    date = v_date,
    prepay_coins = coalesce(p_prepay, prepay_coins),
    stake = coalesce(p_stake, stake),
    round_seconds = coalesce(p_round_seconds, round_seconds)
  where id = p_id;
  return 'ok';
end; $function$;

grant execute on function public.rps_admin_tournament_delete(uuid, bigint) to anon, authenticated;
grant execute on function public.rps_admin_tournament_update(uuid, bigint, text, text, text, int, int, int) to anon, authenticated;
notify pgrst, 'reload schema';
