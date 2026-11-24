// To'langan bron uchun pulni Stripe orqali to'liq qaytaradi va bronni bekor qiladi. FAQAT admin.
// Secrets: STRIPE_SECRET_KEY
import { createClient } from "npm:@supabase/supabase-js@2";

// CORS: faqat ruxsat etilgan saytlar (ALLOWED_ORIGINS secret yoki standart ro'yxat)
const ALLOWED = (
  Deno.env.get("ALLOWED_ORIGINS") ??
  "https://adicorei2000-glitch.github.io,http://localhost:5173,http://localhost:4173"
).split(",").map((s) => s.trim());
function corsFor(req: Request) {
  const o = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED.includes(o) ? o : ALLOWED[0],
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return json({ error: "not_configured" }, 503);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return json({ error: "unauthorized" }, 401);
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) return json({ error: "forbidden" }, 403);

  let body: { booking_id?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const id = Number(body.booking_id);
  if (!Number.isInteger(id)) return json({ error: "bad request" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: b } = await admin
    .from("bookings")
    .select("id, paid_at, refunded_at, stripe_session_id")
    .eq("id", id)
    .maybeSingle();
  if (!b) return json({ error: "not found" }, 404);
  if (!b.paid_at || !b.stripe_session_id) return json({ error: "not paid" }, 409);
  if (b.refunded_at) return json({ error: "already refunded" }, 409);

  const sRes = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(b.stripe_session_id)}`,
    { headers: { Authorization: `Bearer ${stripeKey}` } },
  );
  const session = await sRes.json();
  if (!sRes.ok || !session.payment_intent) return json({ error: "stripe_error" }, 502);

  const rRes = await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      // Qayta bosilsa ham pul faqat bir marta qaytadi
      "Idempotency-Key": `refund-booking-${id}`,
    },
    body: new URLSearchParams({ payment_intent: String(session.payment_intent), "metadata[booking_id]": String(id) }),
  });
  const refund = await rRes.json();
  if (!rRes.ok) return json({ error: "stripe_error", detail: refund?.error?.message ?? "" }, 502);

  await admin
    .from("bookings")
    .update({
      refunded_at: new Date().toISOString(),
      stripe_refund_id: refund.id,
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", id);
  return json({ ok: true, refund_id: refund.id });
});
