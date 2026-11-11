-- 10: Stripe to'lov. Idempotent.
-- paid_at / stripe_session_id ni faqat stripe-webhook funksiyasi (service role) yozadi;
-- mehmon bron yaratganda trigger ularni tozalaydi.
alter table public.bookings add column if not exists paid_at timestamptz;
alter table public.bookings add column if not exists stripe_session_id text;

drop function if exists public.admin_list_bookings();
create function public.admin_list_bookings()
returns table (
  id bigint, villa_id bigint, villa_name text, user_email text,
  check_in date, check_out date, guests bigint, total_price numeric,
  status text, created_at timestamptz, lang text, paid_at timestamptz
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
           b.guests, b.total_price, b.status, b.created_at, b.lang, b.paid_at
      from public.bookings b
      left join auth.users u on u.id = b.user_id
     order by b.created_at desc;
end;
$$;
revoke execute on function public.admin_list_bookings() from public, anon;
grant execute on function public.admin_list_bookings() to authenticated;

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

  new.villa_name        := v.name;
  new.total_price       := (new.check_out - new.check_in) * v.price;
  new.status            := 'pending';
  new.cancelled_at      := null;
  new.paid_at           := null;
  new.stripe_session_id := null;
  return new;
end;
$function$;
