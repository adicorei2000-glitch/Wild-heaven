-- Applied to the live project as migration "villa_min_nights".
-- villas.min_nights (1..30, default 1); bookings_before_insert() and change_booking_dates()
-- reject stays shorter than the villa's minimum (SQLSTATE WH001). Paid bookings keep their nights.
alter table public.villas add column if not exists min_nights integer not null default 1;
alter table public.villas drop constraint if exists villas_min_nights_range;
alter table public.villas add constraint villas_min_nights_range check (min_nights between 1 and 30);
-- (function bodies: see the live database; they add the min_nights check after the villa lookup)
