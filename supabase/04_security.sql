-- 04: xavfsizlik. rls_auto_enable() ichki funksiya, API orqali chaqirilmasligi kerak.
-- (Idempotent: qayta ishga tushirsa ham zarar yo'q.)
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
