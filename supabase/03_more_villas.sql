-- =====================================================================
-- Wild Haven: yangi villalar (3-bosqich)
--
-- QANDAY ISHLATILADI:
--   Supabase paneli -> SQL Editor -> New query -> shu faylning HAMMASINI
--   joylab "Run" bosing. Qayta ishga tushirsa ham xavfsiz (id 5-8 bor bo'lsa,
--   o'tkazib yuboriladi).
--
-- NIMA QILADI:
--   4 ta yangi villa qo'shadi (id 5-8): Gretsiya, Indoneziya, Janubiy Koreya
--   va O'zbekiston. Reyting va narxlar namunaviy (demo) ma'lumot.
--   Rasmlar Unsplash'dan, vaqtincha: o'zingiznikiga almashtirish mumkin.
-- =====================================================================

insert into public.villas
  (id, name, location, country, price, rating, max_guests, image, images, description, amenities)
values
  (5, 'Oq qirg''oq villasi', 'Gretsiya, Santorini', 'Gretsiya', 410, 4.8, 6,
   'https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1200',
   array[
     'https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1200',
     'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200',
     'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?q=80&w=1200'],
   'Santorinining mashhur oq uylari uslubidagi villa. Keng terasa, quyosh botishi manzarasi va tinch hovli sizni kutmoqda.',
   array['Wi-Fi', 'Konditsioner', 'Oshxona', 'Manzarali balkon', 'Avtoturargoh']),
  (6, 'Tropik jannat', 'Indoneziya, Bali', 'Indoneziya', 290, 4.9, 6,
   'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200',
   array[
     'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200',
     'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200',
     'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?q=80&w=1200'],
   'Bali orolidagi palmalar orasida joylashgan shaxsiy basseynli villa. Tropik bog'', sokin tong va dengizga yaqin joylashuv.',
   array['Basseyn', 'Wi-Fi', 'Konditsioner', 'Oshxona', 'Barbekyu', 'Avtoturargoh']),
  (7, 'Jeju orolidagi uy', 'Janubiy Koreya, Jeju', 'Janubiy Koreya', 260, 4.7, 4,
   'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200',
   array[
     'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200',
     'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=1200',
     'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1200'],
   'Jeju orolidagi yog''och bezakli zamonaviy uy. Dengizga yaqin, sokin hovli va qulay joylashuv.',
   array['Wi-Fi', 'Konditsioner', 'Oshxona', 'Barbekyu', 'Avtoturargoh']),
  (8, 'Chimyon tog'' uyi', 'O''zbekiston, Chimyon', 'O''zbekiston', 180, 4.6, 8,
   'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1200',
   array[
     'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1200',
     'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1200',
     'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200'],
   'Chimyon tog''lari bag''ridagi yog''och uy. Toza havo, o''rmon manzarasi, kamin va oilaviy dam olish uchun keng hovli.',
   array['Wi-Fi', 'Kamin', 'Oshxona', 'Barbekyu', 'Sauna', 'Avtoturargoh'])
on conflict (id) do nothing;

-- Keyingi qo'shiladigan villalar id si 9 dan boshlansin
select setval(
  pg_get_serial_sequence('public.villas', 'id'),
  greatest((select max(id) from public.villas), 1)
);
