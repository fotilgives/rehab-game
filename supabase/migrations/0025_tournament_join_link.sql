-- =============================================================================
-- Реєстрація / приєднання до турніру за прямим посиланням
-- =============================================================================

create or replace function public.rps_tournament_join(
  p_player_id uuid,
  p_tournament_id bigint
)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_prepay int;
  v_balance int;
  v_invite_id bigint;
  v_status text;
begin
  -- перевірка турніру
  select prepay_coins into v_prepay from public.rps_tournaments where id = p_tournament_id;
  if not found then
    return 'tournament_not_found';
  end if;

  select balance into v_balance from public.rps_profiles where id = p_player_id;
  if not found then
    return 'player_not_found';
  end if;

  -- перевіряємо, чи є вже запис
  select id, status into v_invite_id, v_status from public.rps_tournament_invites 
    where tournament_id = p_tournament_id and player_id = p_player_id;

  if found then
    if v_status = 'yes' then
      return 'already_joined';
    end if;
  else
    -- створюємо новий запис
    insert into public.rps_tournament_invites(tournament_id, player_id, status)
      values (p_tournament_id, p_player_id, 'pending')
      returning id into v_invite_id;
  end if;

  -- списуємо передоплату, якщо є
  if v_prepay > 0 then
    if v_balance < v_prepay then
      return 'insufficient';
    end if;
    update public.rps_profiles
      set balance = balance - v_prepay
      where id = p_player_id;
  end if;

  update public.rps_tournament_invites
    set status = 'yes', responded_at = now()
    where id = v_invite_id;

  return 'ok';
end; $function$;

grant execute on function public.rps_tournament_join(uuid, bigint) to anon, authenticated;
