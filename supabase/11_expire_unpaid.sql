-- To'lanmagan "pending" bronlar 12 soatdan keyin avtomatik bekor bo'ladi (sanalar bo'shaydi).
-- Muddatni o'zgartirish: expire_unpaid_bookings() ichidagi interval va MyBookings.tsx dagi 12.
create extension if not exists pg_cron;

create or replace function public.expire_unpaid_bookings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  update public.bookings
     set status = 'cancelled', cancelled_at = now()
   where status = 'pending'
     and paid_at is null
     and created_at < now() - interval '12 hours';
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.expire_unpaid_bookings() from public, anon, authenticated;

-- bookings_before_insert() ichida, tekshiruvlardan keyin quyidagi qator qo'shilgan:
--   perform public.expire_unpaid_bookings();
-- (to'liq funksiya: Supabase'dagi joriy bookings_before_insert)

select cron.schedule('expire-unpaid-bookings', '*/5 * * * *', $$select public.expire_unpaid_bookings()$$);
