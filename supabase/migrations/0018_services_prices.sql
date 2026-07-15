-- Послуги та прайс у базі (редагуються в адмінці; сайт і бот читають звідси).
-- Сіди не входять у міграцію — фронт має статичні фолбеки, якщо таблиці порожні.
create table if not exists public.rps_services (
  id bigserial primary key,
  title text not null,
  category text,
  short text,
  details text,
  cases text,
  cases_title text,
  image_url text,
  video_url text,
  poster_url text,
  sort int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.rps_prices (
  id bigserial primary key,
  group_title text not null,
  name text not null,
  price text not null,
  meta text,
  sort int not null default 0,
  active boolean not null default true
);

create or replace function public.rps_services_list()
returns jsonb language sql security definer set search_path to 'public'
as $function$ select coalesce(jsonb_agg(to_jsonb(s) order by s.sort, s.id), '[]'::jsonb) from public.rps_services s where s.active; $function$;

create or replace function public.rps_prices_list()
returns jsonb language sql security definer set search_path to 'public'
as $function$ select coalesce(jsonb_agg(to_jsonb(p) order by p.sort, p.id), '[]'::jsonb) from public.rps_prices p where p.active; $function$;

create or replace function public.rps_admin_services(p_token uuid)
returns jsonb language plpgsql security definer set search_path to 'public'
as $function$ begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(s) order by s.sort, s.id), '[]'::jsonb) from public.rps_services s);
end; $function$;

create or replace function public.rps_admin_prices(p_token uuid)
returns jsonb language plpgsql security definer set search_path to 'public'
as $function$ begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(p) order by p.sort, p.id), '[]'::jsonb) from public.rps_prices p);
end; $function$;

create or replace function public.rps_admin_service_upsert(
  p_token uuid, p_id bigint, p_title text, p_category text, p_short text, p_details text,
  p_cases text, p_cases_title text, p_image_url text, p_video_url text, p_poster_url text, p_sort int, p_active boolean)
returns bigint language plpgsql security definer set search_path to 'public'
as $function$ declare v_id bigint; begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  if p_id is null then
    insert into public.rps_services(title, category, short, details, cases, cases_title, image_url, video_url, poster_url, sort, active)
    values (p_title, p_category, p_short, p_details, p_cases, p_cases_title, p_image_url, p_video_url, p_poster_url, coalesce(p_sort,0), coalesce(p_active,true))
    returning id into v_id;
  else
    update public.rps_services set title=p_title, category=p_category, short=p_short, details=p_details, cases=p_cases, cases_title=p_cases_title,
      image_url=p_image_url, video_url=p_video_url, poster_url=p_poster_url, sort=coalesce(p_sort,0), active=coalesce(p_active,true), updated_at=now()
    where id=p_id returning id into v_id;
  end if;
  return v_id;
end; $function$;

create or replace function public.rps_admin_service_delete(p_token uuid, p_id bigint)
returns void language plpgsql security definer set search_path to 'public'
as $function$ begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  delete from public.rps_services where id=p_id;
end; $function$;

create or replace function public.rps_admin_price_upsert(
  p_token uuid, p_id bigint, p_group_title text, p_name text, p_price text, p_meta text, p_sort int, p_active boolean)
returns bigint language plpgsql security definer set search_path to 'public'
as $function$ declare v_id bigint; begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  if p_id is null then
    insert into public.rps_prices(group_title, name, price, meta, sort, active)
    values (p_group_title, p_name, p_price, p_meta, coalesce(p_sort,0), coalesce(p_active,true)) returning id into v_id;
  else
    update public.rps_prices set group_title=p_group_title, name=p_name, price=p_price, meta=p_meta, sort=coalesce(p_sort,0), active=coalesce(p_active,true)
    where id=p_id returning id into v_id;
  end if;
  return v_id;
end; $function$;

create or replace function public.rps_admin_price_delete(p_token uuid, p_id bigint)
returns void language plpgsql security definer set search_path to 'public'
as $function$ begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  delete from public.rps_prices where id=p_id;
end; $function$;

grant execute on function public.rps_services_list() to anon, authenticated;
grant execute on function public.rps_prices_list() to anon, authenticated;
