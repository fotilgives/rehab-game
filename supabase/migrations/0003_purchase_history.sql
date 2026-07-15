-- =============================================================================
-- Історія покупок гравця: поповнення (rps_wfp_orders) + викупи (rps_redemptions)
-- =============================================================================
-- Повертає єдиний список (jsonb), відсортований за датою (нові згори).
--   kind='topup'  -> поповнення балансу: +coins монет за uah грн
--   kind='redeem' -> викуп призу/курсу за монети: -coins монет, status
-- =============================================================================
create or replace function public.rps_my_history(p_id uuid)
returns jsonb
language sql
security definer
set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(row order by at desc), '[]'::jsonb)
  from (
    select created_at as at,
           jsonb_build_object(
             'kind', 'topup',
             'title', 'Поповнення балансу',
             'coins', coins,
             'uah', amount,
             'status', status,
             'at', created_at
           ) as row
    from rps_wfp_orders
    where player_id = p_id

    union all

    select created_at as at,
           jsonb_build_object(
             'kind', 'redeem',
             'title', reward,
             'coins', cost,
             'uah', null,
             'status', status,
             'at', created_at
           ) as row
    from rps_redemptions
    where player_id = p_id
  ) q;
$function$;

grant execute on function public.rps_my_history(uuid) to anon, authenticated;
