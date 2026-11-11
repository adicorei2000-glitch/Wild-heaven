-- 08: villa xaritasi uchun koordinatalar (taxminiy, shahar darajasida). Idempotent.
alter table public.villas add column if not exists lat double precision;
alter table public.villas add column if not exists lng double precision;
alter table public.villas drop constraint if exists villas_coords_valid;
alter table public.villas add constraint villas_coords_valid check (
  (lat is null and lng is null) or (lat between -90 and 90 and lng between -180 and 180)
);
update public.villas set lat = v.lat, lng = v.lng
  from (values (1, 46.0037, 8.9511), (2, 45.8081, 9.0852), (3, 36.5101, -4.8825), (4, 43.9115, 5.2002),
               (5, 36.4618, 25.3753), (6, -8.5069, 115.2625), (7, 33.4996, 126.5312), (8, 41.5333, 70.0167)) as v(id, lat, lng)
 where public.villas.id = v.id and public.villas.lat is null;
