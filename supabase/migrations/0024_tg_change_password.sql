-- =============================================================================
-- Зміна пароля адміна через Telegram-бота
-- =============================================================================

create or replace function public.rps_tg_change_admin_password(p_new_password text)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_admin_id uuid;
begin
  if length(p_new_password) < 4 then
    return 'password_short';
  end if;

  select id into v_admin_id from rps_accounts where login = 'admin' and is_admin limit 1;
  if not found then
    select id into v_admin_id from rps_accounts where is_admin limit 1;
  end if;

  if v_admin_id is null then
    return 'no_admin_found';
  end if;

  update rps_accounts
    set pass_hash = md5(p_new_password || v_admin_id::text)
    where id = v_admin_id;

  -- інвалідуємо всі сесії
  delete from rps_admin_sessions where account_id = v_admin_id;

  return 'ok';
end; $function$;

grant execute on function public.rps_tg_change_admin_password(text) to anon, authenticated;
