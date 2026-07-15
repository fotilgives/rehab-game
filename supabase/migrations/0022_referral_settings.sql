-- =============================================================================
-- Конфігурація реферальних settings та ліміту банку в rps_config
-- =============================================================================

-- Додаємо дефолтні налаштування в rps_config
update public.rps_config
   set data = data || jsonb_build_object(
     'referral_new_bonus', coalesce((data->>'referral_new_bonus')::int, 100),
     'referral_inviter_bonus', coalesce((data->>'referral_inviter_bonus')::int, 100),
     'daily_fund_limit', coalesce((data->>'daily_fund_limit')::int, 5000)
   )
 where id = 1;

-- Оновлення rps_daily_fund: читає з rps_config
create or replace function public.rps_daily_fund()
returns integer
language sql
security definer
set search_path to 'public'
stable as $$
  select rps_cfg('daily_fund_limit', 5000)::int;
$$;

-- Оновлення rps_signup: використовує налаштування реферальних бонусів з конфігу
create or replace function public.rps_signup(
  p_login    text,
  p_password text,
  p_nick     text,
  p_ref      text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_email         text := lower(trim(p_login));
  v_id            uuid := gen_random_uuid();
  v_nick          text;
  v_ref           uuid;
  v_new_bonus     int;
  v_inviter_bonus int;
  v_referred      boolean := false;
  v_start         int;
begin
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'bad email';
  end if;
  if length(p_password) < 4 then raise exception 'password short'; end if;
  if exists (select 1 from rps_accounts where login = v_email) then
    raise exception 'login taken';
  end if;

  v_nick := coalesce(nullif(trim(p_nick), ''), split_part(v_email, '@', 1));
  v_start := rps_cfg('starter_coins', 0)::int;
  v_new_bonus := rps_cfg('referral_new_bonus', 100)::int;
  v_inviter_bonus := rps_cfg('referral_inviter_bonus', 100)::int;

  insert into rps_accounts(id, login, email, pass_hash)
    values (v_id, v_email, v_email, md5(p_password || v_id::text));
  insert into rps_profiles(id, nickname, balance)
    values (v_id, v_nick, v_start)
    on conflict (id) do nothing;

  begin
    v_ref := nullif(trim(p_ref), '')::uuid;
  exception when others then
    v_ref := null;
  end;

  if v_ref is not null and v_ref <> v_id
    and exists (select 1 from rps_profiles where id = v_ref)
  then
    update rps_profiles
      set referred_by = v_ref, balance = balance + v_new_bonus
      where id = v_id and referred_by is null;
    if found then
      update rps_profiles set balance = balance + v_inviter_bonus where id = v_ref;
      perform rps_touch_activity(v_ref);
      v_referred := true;
    end if;
  end if;

  return jsonb_build_object(
    'id',       v_id,
    'nickname', v_nick,
    'referred', v_referred,
    'bonus',    case when v_referred then v_new_bonus else 0 end
  );
end; $function$;
