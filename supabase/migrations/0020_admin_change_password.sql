-- =============================================================================
-- Зміна пароля адміна (версія з uuid токеном)
-- =============================================================================
-- Адмін може змінити власний пароль через панель (після входу за токеном).
-- rps_admin_change_password(p_token, p_old_password, p_new_password)
--   → 'ok' | 'bad_token' | 'bad_old_password' | 'password_short'
-- =============================================================================

create or replace function public.rps_admin_change_password(
  p_token        uuid,
  p_old_password text,
  p_new_password text
)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_admin_id uuid;
  v_login    text;
  v_pass_hash text;
begin
  -- перевірка токена
  select a.id, a.login, a.pass_hash
    into v_admin_id, v_login, v_pass_hash
    from rps_admin_sessions s
    join rps_accounts a on a.id = s.account_id
    where s.token = p_token
      and s.created_at > now() - interval '30 days'
      and a.is_admin;
  if not found then
    return 'bad_token';
  end if;

  -- перевірка старого пароля
  if v_pass_hash <> md5(p_old_password || v_admin_id::text) then
    return 'bad_old_password';
  end if;

  -- валідація нового
  if length(p_new_password) < 4 then
    return 'password_short';
  end if;

  -- оновлення
  update rps_accounts
    set pass_hash = md5(p_new_password || v_admin_id::text)
    where id = v_admin_id;

  -- інвалідуємо всі старі сесії (крім поточної)
  delete from rps_admin_sessions
    where account_id = v_admin_id
      and token <> p_token;

  return 'ok';
end; $function$;

grant execute on function public.rps_admin_change_password(uuid, text, text) to anon, authenticated;
