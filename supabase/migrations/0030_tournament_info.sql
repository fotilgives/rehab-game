-- Публічна інфа про турнір для екрана згоди перед приєднанням (НЕ списує завдаток).
create or replace function public.rps_tournament_info(p_tournament_id bigint)
returns jsonb language sql security definer set search_path to 'public'
stable as $function$
  select case when t.id is null then null else jsonb_build_object(
    'id', t.id, 'name', t.name, 'description', t.description,
    'date', t.date, 'prepay_coins', t.prepay_coins
  ) end
  from (select * from public.rps_tournaments where id = p_tournament_id) t;
$function$;
grant execute on function public.rps_tournament_info(bigint) to anon, authenticated;
