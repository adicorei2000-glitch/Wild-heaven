-- 07: sharhlar va reyting. Idempotent.
-- Faqat yakunlangan (confirmed va chiqish sanasi o'tgan) broni bor mehmon sharh yoza oladi, har bron uchun bitta.
-- Villa reytingi sharhlar o'rtachasidan avtomatik hisoblanadi.
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  villa_id integer not null references public.villas (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  booking_id bigint not null unique references public.bookings (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists reviews_villa_idx on public.reviews (villa_id, created_at desc);
alter table public.reviews enable row level security;

drop policy if exists reviews_select_own on public.reviews;
create policy reviews_select_own on public.reviews
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists reviews_insert_guest on public.reviews;
create policy reviews_insert_guest on public.reviews
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.bookings b
       where b.id = booking_id
         and b.user_id = (select auth.uid())
         and b.villa_id = reviews.villa_id
         and b.status = 'confirmed'
         and b.check_out <= current_date
    )
  );

drop policy if exists reviews_delete on public.reviews;
create policy reviews_delete on public.reviews
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- Hamma o'qiy oladi (faqat ism boshi ko'rinadi, email emas)
create or replace function public.get_villa_reviews(p_villa_id integer)
returns table (id bigint, rating smallint, comment text, created_at timestamptz, author text, mine boolean)
language sql stable security definer
set search_path = public, auth
as $$
  select r.id, r.rating, r.comment, r.created_at,
         split_part(trim(coalesce(u.raw_user_meta_data->>'full_name', '')), ' ', 1) as author,
         (r.user_id = auth.uid()) as mine
    from public.reviews r
    left join auth.users u on u.id = r.user_id
   where r.villa_id = p_villa_id
   order by r.created_at desc
$$;
revoke execute on function public.get_villa_reviews(integer) from public;
grant execute on function public.get_villa_reviews(integer) to anon, authenticated;

create or replace function public.reviews_update_rating()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  vid integer := coalesce(new.villa_id, old.villa_id);
  avg_r numeric;
begin
  select round(avg(rating)::numeric, 1) into avg_r from public.reviews where villa_id = vid;
  if avg_r is not null then
    update public.villas set rating = avg_r where id = vid;
  end if;
  return null;
end;
$$;
revoke execute on function public.reviews_update_rating() from public, anon, authenticated;

drop trigger if exists reviews_rating_aiud on public.reviews;
create trigger reviews_rating_aiud
  after insert or delete on public.reviews
  for each row execute function public.reviews_update_rating();
