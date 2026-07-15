-- Реферал при реєстрації: новий акаунт може ввести код запрошення (uuid того,
-- хто запросив). Якщо код валідний — обом нараховується бонус і фіксується звʼязок.
create or replace function public.rps_signup(p_login text, p_password text, p_nick text, p_ref text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_email text := lower(trim(p_login));
  v_id uuid := gen_random_uuid();
  v_nick text;
  v_ref uuid;
  v_bonus int := 500;
  v_referred boolean := false;
begin
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'bad email'; end if;
  if length(p_password) < 4 then raise exception 'password short'; end if;
  if exists (select 1 from rps_accounts where login = v_email) then raise exception 'login taken'; end if;
  v_nick := coalesce(nullif(trim(p_nick), ''), split_part(v_email, '@', 1));

  insert into rps_accounts(id, login, email, pass_hash) values (v_id, v_email, v_email, md5(p_password || v_id::text));
  insert into rps_profiles(id, nickname, balance) values (v_id, v_nick, 0) on conflict (id) do nothing;

  -- розбір коду запрошення (приймаємо чистий uuid; ігноруємо некоректний)
  begin
    v_ref := nullif(trim(p_ref), '')::uuid;
  exception when others then
    v_ref := null;
  end;

  if v_ref is not null and v_ref <> v_id and exists (select 1 from rps_profiles where id = v_ref) then
    update rps_profiles set referred_by = v_ref, balance = balance + v_bonus
      where id = v_id and referred_by is null;
    if found then
      update rps_profiles set balance = balance + v_bonus where id = v_ref;
      perform rps_touch_activity(v_ref); -- запросив учасника -> таймер скинуто
      v_referred := true;
    end if;
  end if;

  return jsonb_build_object('id', v_id, 'nickname', v_nick, 'referred', v_referred, 'bonus', case when v_referred then v_bonus else 0 end);
end; $function$;
