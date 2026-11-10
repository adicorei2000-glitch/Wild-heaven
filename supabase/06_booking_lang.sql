-- 06: email bildirishnomalar uchun mehmon tili. Idempotent.
alter table public.bookings add column if not exists lang text not null default 'uz';
alter table public.bookings drop constraint if exists bookings_lang_valid;
alter table public.bookings add constraint bookings_lang_valid check (lang in ('uz','en','ru','ko'));

drop function if exists public.admin_list_bookings();
create function public.admin_list_bookings()
returns table (
  id bigint, villa_id bigint, villa_name text, user_email text,
  check_in date, check_out date, guests bigint, total_price numeric,
  status text, created_at timestamptz, lang text
)
language plpgsql stable security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Ruxsat yo''q' using errcode = '42501';
  end if;
  return query
    select b.id, b.villa_id, b.villa_name, u.email::text, b.check_in, b.check_out,
           b.guests, b.total_price, b.status, b.created_at, b.lang
      from public.bookings b
      left join auth.users u on u.id = b.user_id
     order by b.created_at desc;
end;
$$;
revoke execute on function public.admin_list_bookings() from public, anon;
grant execute on function public.admin_list_bookings() to authenticated;
