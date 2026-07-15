-- Telegram-сесії для діалогу запису через бота + видалення учасника адміном.
create table if not exists public.rps_tg_sessions (
  chat_id bigint primary key,
  step text not null default 'idle',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.rps_tg_session_get(p_chat bigint)
returns jsonb language sql security definer set search_path to 'public'
as $function$
  select coalesce(
    (select jsonb_build_object('step', step, 'data', data) from public.rps_tg_sessions where chat_id = p_chat),
    jsonb_build_object('step','idle','data','{}'::jsonb)
  );
$function$;

create or replace function public.rps_tg_session_set(p_chat bigint, p_step text, p_data jsonb)
returns void language plpgsql security definer set search_path to 'public'
as $function$
begin
  insert into public.rps_tg_sessions(chat_id, step, data, updated_at)
  values (p_chat, p_step, coalesce(p_data, '{}'::jsonb), now())
  on conflict (chat_id) do update set step = excluded.step, data = excluded.data, updated_at = now();
end; $function$;

-- Повне видалення учасника (акаунт, баланс, ставки, історія).
create or replace function public.rps_admin_delete_user(p_token uuid, p_player uuid)
returns void language plpgsql security definer set search_path to 'public'
as $function$
declare t text; tbls text[] := array['rps_secret','rps_bets','rps_redemptions','rps_wfp_orders','rps_course_orders','rps_reviews','rps_tg_sessions'];
begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  foreach t in array tbls loop
    begin execute format('delete from public.%I where player_id = $1', t) using p_player;
    exception when undefined_table or undefined_column then null; end;
  end loop;
  begin delete from public.rps_admin_sessions where account_id = p_player; exception when others then null; end;
  delete from public.rps_accounts where id = p_player;
  delete from public.rps_profiles where id = p_player;
end; $function$;
