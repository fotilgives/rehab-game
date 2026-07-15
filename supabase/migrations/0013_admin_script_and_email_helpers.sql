-- =============================================================================
-- Редагована таблиця виплат в адмінці + хелпери для листів після оплати
-- =============================================================================

-- Email гравця за id (для листів-квитанцій після оплати).
create or replace function public.rps_player_email(p_id uuid)
returns text language sql security definer set search_path to 'public'
as $function$ select email from public.rps_accounts where id = p_id $function$;

-- Адмін: отримати таблицю гри — виплати (res_*) + к-сть ботів на хід (rock/scissors/paper).
create or replace function public.rps_admin_get_script(p_token uuid)
returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object(
            'round_no', round_no,
            'rk', res_rock, 'sc', res_scissors, 'pp', res_paper,
            'br', rock, 'bs', scissors, 'bp', paper
          ) order by round_no), '[]'::jsonb)
          from public.rps_bot_script where round_no between 1 and 35);
end; $function$;

-- Адмін: зберегти виплати + к-сть ботів. «Переходи» обнуляємо, щоб видиме
-- розкладання у пулах точно дорівнювало заданим числам (передбачувано).
create or replace function public.rps_admin_set_script(p_token uuid, p_rows jsonb)
returns void language plpgsql security definer set search_path to 'public'
as $function$
declare r jsonb;
begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  for r in select * from jsonb_array_elements(p_rows)
  loop
    update public.rps_bot_script
       set res_rock     = greatest(0, (r->>'rk')::int),
           res_scissors = greatest(0, (r->>'sc')::int),
           res_paper    = greatest(0, (r->>'pp')::int),
           rock     = greatest(0, coalesce((r->>'br')::int, rock)),
           scissors = greatest(0, coalesce((r->>'bs')::int, scissors)),
           paper    = greatest(0, coalesce((r->>'bp')::int, paper)),
           r2s = 0, r2p = 0, s2r = 0, s2p = 0, p2r = 0, p2s = 0
     where round_no = (r->>'round_no')::int;
  end loop;
end; $function$;

-- Прапорець «лист поповнення надіслано» (щоб не дублювати при колбек+return).
alter table public.rps_wfp_orders add column if not exists emailed_at timestamptz;

create or replace function public.rps_wfp_claim_email(p_order_ref text)
returns boolean language plpgsql security definer set search_path to 'public'
as $function$
declare n int;
begin
  update public.rps_wfp_orders set emailed_at = now()
   where order_ref = p_order_ref and emailed_at is null and status = 'credited';
  get diagnostics n = row_count;
  return n > 0;
end; $function$;
