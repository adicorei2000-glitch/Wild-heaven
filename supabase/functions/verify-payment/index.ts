// To'lovni Stripe'dan tekshiradi va to'langan bo'lsa broni tasdiqlaydi (webhook kerak emas).
// Secrets: STRIPE_SECRET_KEY
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return json({ error: "not_configured" }, 503);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: u } = await supabase.auth.getUser();
  const user = u.user;
  if (!user) return json({ error: "unauthorized" }, 401);

  let body: { booking_id?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const id = Number(body.booking_id);
  if (!Number.isInteger(id)) return json({ error: "bad request" }, 400);

  // Faqat o'z broni (RLS)
  const { data: b } = await supabase
    .from("bookings")
    .select("id, status, paid_at, stripe_session_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!b) return json({ error: "not found" }, 404);
  if (b.paid_at) return json({ paid: true });
  if (!b.stripe_session_id) return json({ paid: false });

  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(b.stripe_session_id)}`,
    { headers: { Authorization: `Bearer ${stripeKey}` } },
  );
  const s = await res.json();
  if (!res.ok) return json({ paid: false, error: "stripe_error" }, 502);
  if (s.payment_status !== "paid" || String(s.metadata?.booking_id) !== String(id)) {
    return json({ paid: false });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const patch: Record<string, unknown> = { paid_at: new Date().toISOString() };
  if (b.status === "pending") patch.status = "confirmed";
  await admin.from("bookings").update(patch).eq("id", id);
  return json({ paid: true });
});
