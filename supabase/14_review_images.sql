-- 14: sharhlarga 3 tagacha rasm. Idempotent.
-- Rasm manzillari faqat o'zimizning review-images bucket'idan bo'lishi shart (check constraint).
create or replace function public.reviews_images_ok(p_images text[])
returns boolean
language sql immutable
set search_path = ''
as $$
  select coalesce(cardinality(p_images), 0) <= 3
     and coalesce(
           (select bool_and(u like 'https://cezfzevpmsrdllbmfgzl.supabase.co/storage/v1/object/public/review-images/%'
                            and u !~ '\.\.')
              from unnest(p_images) u),
           true)
$$;

alter table public.reviews add column if not exists images text[] not null default '{}';
alter table public.reviews drop constraint if exists reviews_images_valid;
alter table public.reviews add constraint reviews_images_valid check (public.reviews_images_ok(images));

drop function if exists public.get_villa_reviews(integer);
create function public.get_villa_reviews(p_villa_id integer)
returns table (id bigint, rating smallint, comment text, created_at timestamptz, author text, mine boolean, images text[])
language sql stable security definer
set search_path = public, auth
as $$
  select r.id, r.rating, r.comment, r.created_at,
         split_part(trim(coalesce(u.raw_user_meta_data->>'full_name', '')), ' ', 1) as author,
         (r.user_id = auth.uid()) as mine,
         r.images
    from public.reviews r
    left join auth.users u on u.id = r.user_id
   where r.villa_id = p_villa_id
   order by r.created_at desc
$$;
revoke execute on function public.get_villa_reviews(integer) from public;
grant execute on function public.get_villa_reviews(integer) to anon, authenticated;

-- Ochiq bucket (hamma ko'radi). Yuklash: faqat yakunlangan bronli mehmon, faqat o'z papkasiga (<user_id>/...)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-images', 'review-images', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists review_images_insert on storage.objects;
create policy review_images_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'review-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.bookings b
       where b.user_id = (select auth.uid()) and b.status = 'confirmed' and b.check_out <= current_date
    )
  );

drop policy if exists review_images_delete on storage.objects;
create policy review_images_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'review-images'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );
