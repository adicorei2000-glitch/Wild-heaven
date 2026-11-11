// Stripe Checkout sessiyasini yaratadi. Summani mijozdan EMAS, bazadagi total_price'dan oladi.
// Secrets: STRIPE_SECRET_KEY, ALLOWED_ORIGINS (ixtiyoriy, vergul bilan)
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

  let body: { booking_id?: number; return_url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const id = Number(body.booking_id);
  if (!Number.isInteger(id) || typeof body.return_url !== "string") return json({ error: "bad request" }, 400);

  // Faqat ruxsat etilgan saytlarga qaytaramiz
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://adicorei2000-glitch.github.io,http://localhost:5173")
    .split(",").map((s) => s.trim());
  let base: URL;
  try {
    base = new URL(body.return_url);
  } catch {
    return json({ error: "bad return_url" }, 400);
  }
  if (!allowed.includes(base.origin)) return json({ error: "origin not allowed" }, 400);
  const baseStr = base.origin + (base.pathname.endsWith("/") ? base.pathname : base.pathname + "/");

  const { data: b } = await supabase
    .from("bookings")
    .select("id, villa_name, check_in, check_out, total_price, status, paid_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!b) return json({ error: "not found" }, 404);
  if (b.status !== "pending" || b.paid_at) return json({ error: "not payable" }, 409);

  const cents = Math.round(Number(b.total_price) * 100);
  if (!(cents >= 50)) return json({ error: "bad amount" }, 400);

  const params = new URLSearchParams({
    mode: "payment",
    success_url: `${baseStr}my-bookings?paid=1`,
    cancel_url: `${baseStr}my-bookings?cancelled=1`,
    client_reference_id: String(b.id),
    "metadata[booking_id]": String(b.id),
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(cents),
    "line_items[0][price_data][product_data][name]": `${b.villa_name} (${b.check_in} — ${b.check_out})`,
  });
  if (user.email) params.set("customer_email", user.email);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const session = await res.json();
  if (!res.ok || !session.url) return json({ error: "stripe_error", detail: session?.error?.message ?? "" }, 502);
  return json({ url: session.url });
});
