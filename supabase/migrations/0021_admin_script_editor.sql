-- =============================================================================
-- Розширене редагування таблиці ботів/виплат/блефу через адмін-панель
-- =============================================================================

create or replace function public.rps_admin_get_script(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not rps_is_admin_token(p_token) then
    raise exception 'forbidden';
  end if;

  return (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'round_no',   round_no,
        'rock',       rock,
        'scissors',   scissors,
        'paper',      paper,
        'r2s',        r2s,
        'r2p',        r2p,
        's2r',        s2r,
        's2p',        s2p,
        'p2r',        p2r,
        'p2s',        p2s,
        'res_rock',     coalesce(res_rock, 100),
        'res_scissors', coalesce(res_scissors, 100),
        'res_paper',    coalesce(res_paper, 100)
      )
      order by round_no
    ), '[]'::jsonb)
    from rps_bot_script
    where round_no between 1 and 35
  );
end; $function$;

create or replace function public.rps_admin_set_script(p_token uuid, p_rows jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r jsonb;
begin
  if not rps_is_admin_token(p_token) then
    raise exception 'forbidden';
  end if;

  for r in select * from jsonb_array_elements(p_rows)
  loop
    update public.rps_bot_script set
      rock         = greatest(0, coalesce((r->>'rock')::int, rock)),
      scissors     = greatest(0, coalesce((r->>'scissors')::int, scissors)),
      paper        = greatest(0, coalesce((r->>'paper')::int, paper)),
      r2s          = greatest(0, coalesce((r->>'r2s')::int, r2s)),
      r2p          = greatest(0, coalesce((r->>'r2p')::int, r2p)),
      s2r          = greatest(0, coalesce((r->>'s2r')::int, s2r)),
      s2p          = greatest(0, coalesce((r->>'s2p')::int, s2p)),
      p2r          = greatest(0, coalesce((r->>'p2r')::int, p2r)),
      p2s          = greatest(0, coalesce((r->>'p2s')::int, p2s)),
      res_rock     = greatest(0, coalesce((r->>'res_rock')::int, res_rock)),
      res_scissors = greatest(0, coalesce((r->>'res_scissors')::int, res_scissors)),
      res_paper    = greatest(0, coalesce((r->>'res_paper')::int, res_paper))
    where round_no = (r->>'round_no')::int;
  end loop;
end; $function$;

grant execute on function public.rps_admin_get_script(uuid) to anon, authenticated;
grant execute on function public.rps_admin_set_script(uuid, jsonb) to anon, authenticated;
