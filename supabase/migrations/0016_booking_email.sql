-- Email у записах на послуги + версія rps_book з поштою (для листів-підтверджень).
alter table public.rps_bookings add column if not exists email text;

create or replace function public.rps_book(p_name text, p_phone text, p_service text, p_note text, p_email text)
returns bigint language plpgsql security definer set search_path to 'public'
as $function$
declare v_id bigint;
begin
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'name required'; end if;
  if length(trim(coalesce(p_phone, ''))) < 5 then raise exception 'phone required'; end if;
  insert into rps_bookings(name, phone, service, note, email)
    values (trim(p_name), trim(p_phone), nullif(trim(p_service), ''), nullif(trim(p_note), ''),
            nullif(lower(trim(coalesce(p_email,''))), ''))
    returning id into v_id;
  return v_id;
end; $function$;

grant execute on function public.rps_book(text, text, text, text, text) to anon, authenticated;
