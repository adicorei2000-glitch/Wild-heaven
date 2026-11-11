-- 09: sana bo'yicha bo'sh villalar qidiruvi va villa rasmlari uchun storage. Idempotent.
create or replace function public.get_available_villa_ids(p_check_in date, p_check_out date)
returns setof integer
language sql stable security definer
set search_path = public
as $$
  select v.id
    from public.villas v
   where p_check_out > p_check_in
     and not exists (
       select 1 from public.bookings b
        where b.villa_id = v.id
          and b.status <> 'cancelled'
          and daterange(b.check_in, b.check_out, '[)') && daterange(p_check_in, p_check_out, '[)')
     )
$$;
revoke execute on function public.get_available_villa_ids(date, date) from public;
grant execute on function public.get_available_villa_ids(date, date) to anon, authenticated;

-- Ochiq bucket: rasmlarni hamma ko'radi, yuklash/o'chirish faqat admin
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('villa-images', 'villa-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists villa_images_admin_insert on storage.objects;
create policy villa_images_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'villa-images' and public.is_admin());
drop policy if exists villa_images_admin_delete on storage.objects;
create policy villa_images_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'villa-images' and public.is_admin());
