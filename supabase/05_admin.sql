-- 05: admin panel. Idempotent.
-- Birinchi adminni qo'lda qo'shing (email'ni o'zingiznikiga almashtiring):
--   insert into public.admins (user_id)
--   select id from auth.users where email = '<ADMIN_EMAIL>'
--   on conflict do nothing;

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

drop policy if exists admins_select_own on public.admins;
create policy admins_select_own on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean
language sql stable security invoker
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()))
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Villalarni faqat admin o'zgartira oladi
drop policy if exists villas_admin_insert on public.villas;
create policy villas_admin_insert on public.villas
  for insert to authenticated with check (public.is_admin());
drop policy if exists villas_admin_update on public.villas;
create policy villas_admin_update on public.villas
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists villas_admin_delete on public.villas;
create policy villas_admin_delete on public.villas
  for delete to authenticated using (public.is_admin());

-- Barcha bronlar (mehmon emaili bilan) — faqat admin
create or replace function public.admin_list_bookings()
returns table (
  id bigint, villa_id bigint, villa_name text, user_email text,
  check_in date, check_out date, guests bigint, total_price numeric,
  status text, created_at timestamptz
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
           b.guests, b.total_price, b.status, b.created_at
      from public.bookings b
      left join auth.users u on u.id = b.user_id
     order by b.created_at desc;
end;
$$;

-- Bron statusini o'zgartirish — faqat admin
create or replace function public.admin_set_booking_status(p_booking_id bigint, p_status text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Ruxsat yo''q' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'confirmed', 'cancelled') then
    raise exception 'Noto''g''ri status' using errcode = '22023';
  end if;
  update public.bookings
     set status = p_status,
         cancelled_at = case when p_status = 'cancelled' then now() else null end
   where id = p_booking_id;
  if not found then
    raise exception 'Bron topilmadi' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.admin_list_bookings() from public, anon;
revoke execute on function public.admin_set_booking_status(bigint, text) from public, anon;
grant execute on function public.admin_list_bookings() to authenticated;
grant execute on function public.admin_set_booking_status(bigint, text) to authenticated;

-- Yangi bronlar admin tasdiqlashini kutadi (pending). Sanalar darhol band bo'ladi.
create or replace function public.bookings_before_insert()
returns trigger
language plpgsql security definer
set search_path to 'public'
as $function$
declare
  v public.villas%rowtype;
begin
  if new.check_in is null or new.check_out is null or new.guests is null then
    raise exception 'Sana va mehmonlar soni majburiy' using errcode = '23502';
  end if;

  select * into v from public.villas where id = new.villa_id;

  if not found then
    raise exception 'Villa topilmadi' using errcode = 'P0002';
  end if;

  if new.guests > v.max_guests then
    raise exception 'Bu villa ko''pi bilan % mehmon uchun', v.max_guests
      using errcode = '22023';
  end if;

  if new.check_in < current_date - 1 then
    raise exception 'O''tgan sanaga bron qilib bo''lmaydi' using errcode = '22007';
  end if;

  new.villa_name   := v.name;
  new.total_price  := (new.check_out - new.check_in) * v.price;
  new.status       := 'pending';
  new.cancelled_at := null;
  return new;
end;
$function$;

-- Yangi villa qo'shilganda id to'qnashmasligi uchun hisoblagichni mavjud eng katta id'ga tenglaymiz
select setval(pg_get_serial_sequence('public.villas', 'id'), (select max(id) from public.villas));
