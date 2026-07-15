-- Код-ваучер для обміняних призів: видно в кабінеті та в листі, показується спеціалісту.
alter table public.rps_redemptions add column if not exists code text;
update public.rps_redemptions
   set code = 'RP-' || upper(substr(md5(random()::text || id::text), 1, 6))
 where code is null;

drop function if exists public.rps_redeem(uuid, text, text, integer);
create function public.rps_redeem(p_id uuid, p_nick text, p_reward text, p_cost integer)
returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare bal int; v_code text;
begin
  if p_cost <= 0 then raise exception 'bad cost'; end if;
  perform rps_register(p_id, p_nick);
  select balance into bal from rps_profiles where id = p_id for update;
  if bal < p_cost then raise exception 'insufficient balance'; end if;
  update rps_profiles set balance = balance - p_cost where id = p_id;
  v_code := 'RP-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  insert into rps_redemptions(player_id, nickname, reward, cost, code) values (p_id, p_nick, p_reward, p_cost, v_code);
  perform rps_touch_activity(p_id);
  return jsonb_build_object('balance', bal - p_cost, 'code', v_code);
end; $function$;

-- rps_cabinet тепер віддає code у покупках-обмінах (решта — без змін).
create or replace function public.rps_cabinet(p_id uuid)
returns jsonb language sql security definer set search_path to 'public'
as $function$
  select jsonb_build_object(
    'profile', (
      select jsonb_build_object(
        'nickname', p.nickname, 'balance', p.balance, 'wins', coalesce(p.wins,0),
        'donated', coalesce(p.donated,0), 'created_at', p.created_at,
        'referrals', (select count(*) from rps_profiles r where r.referred_by = p_id)
      ) from rps_profiles p where p.id = p_id
    ),
    'purchases', coalesce((
      select jsonb_agg(x order by at desc) from (
        select created_at as at,
               jsonb_build_object('kind','topup','title','Поповнення балансу','coins',coins,'uah',amount,'status',status,'at',created_at,'code',null) as x
        from rps_wfp_orders where player_id = p_id
        union all
        select created_at as at,
               jsonb_build_object('kind','redeem','title',reward,'coins',cost,'uah',null,'status',status,'at',created_at,'code',code) as x
        from rps_redemptions where player_id = p_id
      ) q
    ), '[]'::jsonb),
    'activity', coalesce((
      select jsonb_agg(x order by at desc) from (
        select b.created_at as at,
               jsonb_build_object('move',b.move,'stake',b.stake,'payout',b.payout,'net',b.payout-b.stake,'at',b.created_at,'round_id',b.round_id) as x
        from rps_bets b join rps_rounds r on r.id = b.round_id and r.status='settled'
        where b.player_id = p_id order by b.id desc limit 30
      ) q
    ), '[]'::jsonb)
  );
$function$;
