-- =============================================================================
-- Курс: збереження метаданих замовлення для підтверджувальних email
-- =============================================================================

create table if not exists public.rps_course_orders (
  order_reference text primary key,
  player_id uuid not null references public.rps_profiles(id) on delete cascade,
  email text not null,
  name text,
  phone text,
  course_name text not null default 'Курс з йоги (онлайн)',
  amount_uah integer not null default 2500,
  telegram_url text not null default 'https://t.me/+o9i9tJpoj4A3MTcy',
  status text not null default 'created',
  approved_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rps_course_orders_status_check check (status in ('created', 'approved', 'emailed'))
);

create index if not exists rps_course_orders_player_id_idx on public.rps_course_orders(player_id);
create index if not exists rps_course_orders_email_idx on public.rps_course_orders(email);

create or replace function public.rps_course_order_upsert(
  p_order_reference text,
  p_player_id uuid,
  p_email text,
  p_name text,
  p_phone text,
  p_course_name text default 'Курс з йоги (онлайн)',
  p_amount_uah integer default 2500,
  p_telegram_url text default 'https://t.me/+o9i9tJpoj4A3MTcy'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row public.rps_course_orders;
begin
  if p_order_reference is null or length(btrim(p_order_reference)) < 8 then
    raise exception 'bad order reference';
  end if;
  if p_player_id is null then
    raise exception 'bad player id';
  end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'bad email';
  end if;

  insert into public.rps_course_orders (
    order_reference, player_id, email, name, phone, course_name, amount_uah, telegram_url, status, updated_at
  )
  values (
    p_order_reference, p_player_id, lower(btrim(p_email)), nullif(btrim(coalesce(p_name, '')), ''), nullif(btrim(coalesce(p_phone, '')), ''),
    coalesce(nullif(btrim(coalesce(p_course_name, '')), ''), 'Курс з йоги (онлайн)'),
    coalesce(p_amount_uah, 2500),
    coalesce(nullif(btrim(coalesce(p_telegram_url, '')), ''), 'https://t.me/+o9i9tJpoj4A3MTcy'),
    'created',
    now()
  )
  on conflict (order_reference) do update set
    player_id = excluded.player_id,
    email = excluded.email,
    name = excluded.name,
    phone = excluded.phone,
    course_name = excluded.course_name,
    amount_uah = excluded.amount_uah,
    telegram_url = excluded.telegram_url,
    updated_at = now();

  select * into v_row from public.rps_course_orders where order_reference = p_order_reference;
  return jsonb_build_object(
    'order_reference', v_row.order_reference,
    'player_id', v_row.player_id,
    'email', v_row.email,
    'name', v_row.name,
    'phone', v_row.phone,
    'course_name', v_row.course_name,
    'amount_uah', v_row.amount_uah,
    'telegram_url', v_row.telegram_url,
    'status', v_row.status,
    'approved_at', v_row.approved_at,
    'emailed_at', v_row.emailed_at,
    'created_at', v_row.created_at,
    'updated_at', v_row.updated_at
  );
end;
$function$;

create or replace function public.rps_course_order_by_ref(p_order_reference text)
returns jsonb
language sql
security definer
set search_path to 'public'
as $function$
  select coalesce(
    (
      select jsonb_build_object(
        'order_reference', order_reference,
        'player_id', player_id,
        'email', email,
        'name', name,
        'phone', phone,
        'course_name', course_name,
        'amount_uah', amount_uah,
        'telegram_url', telegram_url,
        'status', status,
        'approved_at', approved_at,
        'emailed_at', emailed_at,
        'created_at', created_at,
        'updated_at', updated_at
      )
      from public.rps_course_orders
      where order_reference = p_order_reference
    ),
    null
  );
$function$;

create or replace function public.rps_course_order_mark_paid(p_order_reference text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row public.rps_course_orders;
begin
  update public.rps_course_orders
     set status = case when status = 'emailed' then 'emailed' else 'approved' end,
         approved_at = coalesce(approved_at, now()),
         updated_at = now()
   where order_reference = p_order_reference
   returning * into v_row;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'order_reference', v_row.order_reference,
    'player_id', v_row.player_id,
    'email', v_row.email,
    'name', v_row.name,
    'phone', v_row.phone,
    'course_name', v_row.course_name,
    'amount_uah', v_row.amount_uah,
    'telegram_url', v_row.telegram_url,
    'status', v_row.status,
    'approved_at', v_row.approved_at,
    'emailed_at', v_row.emailed_at,
    'created_at', v_row.created_at,
    'updated_at', v_row.updated_at
  );
end;
$function$;

create or replace function public.rps_course_order_mark_emailed(p_order_reference text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row public.rps_course_orders;
begin
  update public.rps_course_orders
     set status = 'emailed',
         emailed_at = coalesce(emailed_at, now()),
         updated_at = now()
   where order_reference = p_order_reference
   returning * into v_row;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'order_reference', v_row.order_reference,
    'player_id', v_row.player_id,
    'email', v_row.email,
    'name', v_row.name,
    'phone', v_row.phone,
    'course_name', v_row.course_name,
    'amount_uah', v_row.amount_uah,
    'telegram_url', v_row.telegram_url,
    'status', v_row.status,
    'approved_at', v_row.approved_at,
    'emailed_at', v_row.emailed_at,
    'created_at', v_row.created_at,
    'updated_at', v_row.updated_at
  );
end;
$function$;

grant execute on function public.rps_course_order_upsert(text, uuid, text, text, text, text, integer, text) to anon, authenticated;
grant execute on function public.rps_course_order_by_ref(text) to anon, authenticated;
grant execute on function public.rps_course_order_mark_paid(text) to anon, authenticated;
grant execute on function public.rps_course_order_mark_emailed(text) to anon, authenticated;
