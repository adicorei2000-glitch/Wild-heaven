-- =====================================================================
-- Wild Haven: bron statusi (2-bosqich)
--
-- QANDAY ISHLATILADI:
--   setup.sql dan KEYIN: Supabase paneli -> SQL Editor -> New query -> shu
--   faylning HAMMASINI joylab "Run" bosing. Qayta ishga tushirsa ham xavfsiz.
--   (Agar keyin setup.sql ni qayta ishga tushirsangiz, bu faylni ham qayta
--   ishga tushiring: setup.sql eski funksiya va siyosatlarni tiklab yuboradi.)
--
-- NIMA QILADI:
--   1) bookings.status ('pending' | 'confirmed' | 'cancelled') va cancelled_at.
--      Mavjud bronlar 'confirmed' bo'ladi.
--   2) Bekor qilingan bron sanani band qilib turmaydi: kesishmaslik cheklovi
--      va get_booked_ranges() faqat bekor qilinmagan bronlarni hisoblaydi.
--   3) Bekor qilish qatorni o'chirmaydi: cancel_booking() statusni
--      'cancelled' ga o'zgartiradi. Foydalanuvchi bronini to'g'ridan-to'g'ri
--      o'zgartira olmaydi (UPDATE siyosati yo'q), shuning uchun narx, sana
--      yoki statusni qo'lda o'zgartirib bo'lmaydi.
--   4) Foydalanuvchi bronni o'chira olmaydi (delete siyosati olib tashlanadi),
--      shunda bronlar tarixi saqlanadi.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) STATUS USTUNLARI
-- ---------------------------------------------------------------------
alter table public.bookings
  add column if not exists status text not null default 'confirmed',
  add column if not exists cancelled_at timestamptz;

alter table public.bookings drop constraint if exists bookings_status_valid;
alter table public.bookings
  add constraint bookings_status_valid
  check (status in ('pending', 'confirmed', 'cancelled'));

-- ---------------------------------------------------------------------
-- 2) Kesishmaslik cheklovi: bekor qilingan bronlar hisobga olinmaydi
-- ---------------------------------------------------------------------
alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    villa_id with =,
    daterange(check_in, check_out, '[)') with &&
  ) where (check_in >= date '2026-11-01' and status <> 'cancelled');

-- Kalendar uchun band sanalar: bekor qilinganlari chiqmaydi
create or replace function public.get_booked_ranges(p_villa_id integer)
returns table (check_in date, check_out date)
language sql
stable
security definer
set search_path = public
as $$
  select b.check_in, b.check_out
  from public.bookings b
  where b.villa_id = p_villa_id
    and b.status <> 'cancelled'
    and b.check_out >= current_date
  order by b.check_in;
$$;

revoke all on function public.get_booked_ranges(integer) from public;
grant execute on function public.get_booked_ranges(integer) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) Yangi bron har doim 'confirmed' bo'lib boshlanadi (brauzer statusni
--    o'zi tanlay olmaydi). 'pending' keyinchalik to'lov qo'shilganda kerak.
-- ---------------------------------------------------------------------
create or replace function public.bookings_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

  -- 1 kun zaxira: foydalanuvchi vaqt mintaqasi UTC dan orqada bo'lishi mumkin
  if new.check_in < current_date - 1 then
    raise exception 'O''tgan sanaga bron qilib bo''lmaydi' using errcode = '22007';
  end if;

  new.villa_name   := v.name;
  new.total_price  := (new.check_out - new.check_in) * v.price;
  new.status       := 'confirmed';
  new.cancelled_at := null;
  return new;
end;
$$;

revoke execute on function public.bookings_before_insert() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) Bekor qilish: faqat o'zining, tugamagan, hali bekor qilinmagan broni
-- ---------------------------------------------------------------------
create or replace function public.cancel_booking(p_booking_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings
     set status = 'cancelled',
         cancelled_at = now()
   where id = p_booking_id
     and user_id = auth.uid()
     and status <> 'cancelled'
     and check_out > current_date;

  if not found then
    raise exception 'Bronni bekor qilib bo''lmadi';
  end if;
end;
$$;

revoke all on function public.cancel_booking(bigint) from public, anon;
grant execute on function public.cancel_booking(bigint) to authenticated;

-- ---------------------------------------------------------------------
-- 5) Bronni o'chirish taqiqlanadi (tarix saqlansin)
-- ---------------------------------------------------------------------
drop policy if exists "bookings_delete_own" on public.bookings;
