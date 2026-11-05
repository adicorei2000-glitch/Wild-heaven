-- Wild Haven: `bookings` jadvali uchun xavfsizlik qoidalari va band kunlar cheklovi.
--
-- QANDAY ISHLATILADI:
--   Supabase paneli -> SQL Editor -> New query -> shu faylni joylab "Run" bosing.
--   Fayl qayta ishga tushirilsa ham xavfsiz (mavjud qoidalarni almashtiradi).
--
-- OLDINDAN TEKSHIRING:
--   * `check_in` va `check_out` ustunlari `date` turida bo'lishi kerak.
--   * Jadvalda allaqachon bir-biriga kesishuvchi bronlar bo'lsa, 3-qadam xato beradi.
--     Avval ularni qo'lda tuzating yoki o'chiring.

-- 1) Qatorlar darajasidagi himoya (Row Level Security)
alter table public.bookings enable row level security;

-- 2) Har bir foydalanuvchi faqat O'Z bronlarini ko'ra, qo'sha va o'chira oladi
drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own" on public.bookings
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "bookings_delete_own" on public.bookings;
create policy "bookings_delete_own" on public.bookings
  for delete to authenticated
  using (auth.uid() = user_id);

-- 3) Bitta villani kesishuvchi sanalarga ikki marta bron qilib bo'lmasin.
--    Chiqish kuni band hisoblanmaydi: [check_in, check_out)
create extension if not exists btree_gist;

alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    villa_id with =,
    daterange(check_in, check_out, '[)') with &&
  );

-- 4) Chiqish sanasi kirish sanasidan keyin bo'lsin
alter table public.bookings drop constraint if exists bookings_dates_valid;
alter table public.bookings
  add constraint bookings_dates_valid
  check (check_out > check_in);
