-- 12: Refund. bookings.refunded_at / stripe_refund_id ustunlari, admin_list_bookings() ga refunded_at,
-- bookings_before_insert() bu maydonlarni tozalaydi. (Joriy funksiya matni Supabase'da.)
alter table public.bookings add column if not exists refunded_at timestamptz;
alter table public.bookings add column if not exists stripe_refund_id text;
-- Edge Function: supabase/functions/refund-booking (faqat admin; Stripe /v1/refunds, Idempotency-Key)
