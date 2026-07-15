-- =============================================================================
-- Кабінет гравця: профіль + покупки + ігрова активність одним запитом
-- =============================================================================
create or replace function public.rps_cabinet(p_id uuid)
returns jsonb
language sql
security definer
set search_path to 'public'
as $function$
  select jsonb_build_object(
    'profile', (
      select jsonb_build_object(
        'nickname',   p.nickname,
        'balance',    p.balance,
        'wins',       coalesce(p.wins, 0),
        'donated',    coalesce(p.donated, 0),
        'created_at', p.created_at,
        'referrals',  (select count(*) from rps_profiles r where r.referred_by = p_id)
      )
      from rps_profiles p where p.id = p_id
    ),
    'purchases', coalesce((
      select jsonb_agg(x order by at desc)
      from (
        select created_at as at,
               jsonb_build_object('kind','topup','title','Поповнення балансу',
                 'coins',coins,'uah',amount,'status',status,'at',created_at) as x
        from rps_wfp_orders where player_id = p_id
        union all
        select created_at as at,
               jsonb_build_object('kind','redeem','title',reward,
                 'coins',cost,'uah',null,'status',status,'at',created_at) as x
        from rps_redemptions where player_id = p_id
      ) q
    ), '[]'::jsonb),
    'activity', coalesce((
      select jsonb_agg(x order by at desc)
      from (
        select b.created_at as at,
               jsonb_build_object('move',b.move,'stake',b.stake,'payout',b.payout,
                 'net',b.payout - b.stake,'at',b.created_at,'round_id',b.round_id) as x
        from rps_bets b
        join rps_rounds r on r.id = b.round_id and r.status = 'settled'
        where b.player_id = p_id
        order by b.id desc
        limit 30
      ) q
    ), '[]'::jsonb)
  );
$function$;

grant execute on function public.rps_cabinet(uuid) to anon, authenticated;
