// To'lovni Stripe'dan tekshiradi va to'langan bo'lsa broni tasdiqlaydi (webhook kerak emas).
// Birinchi marta to'lov tasdiqlanganda mehmonga (va adminga) email yuboradi.
// Secrets: STRIPE_SECRET_KEY, RESEND_API_KEY, ADMIN_EMAIL, FROM_EMAIL (ixtiyoriy)
import { createClient } from "npm:@supabase/supabase-js@2";

type Lang = "uz" | "en" | "ru" | "ko";
const LANGS: Lang[] = ["uz", "en", "ru", "ko"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// [mavzu, sarlavha, matn]
const T: Record<Lang, [string, string, string]> = {
  uz: ["To'lov qabul qilindi, bron tasdiqlandi", "To'lov qabul qilindi", "To'lovingiz uchun rahmat! Broningiz tasdiqlandi. Sizni kutib qolamiz!"],
  en: ["Payment received, booking confirmed", "Payment received", "Thank you for your payment! Your booking is confirmed. We look forward to hosting you!"],
  ru: ["Оплата получена, бронирование подтверждено", "Оплата получена", "Спасибо за оплату! Ваше бронирование подтверждено. Будем рады вас видеть!"],
  ko: ["결제가 완료되어 예약이 확정되었습니다", "결제 완료", "결제해 주셔서 감사합니다! 예약이 확정되었습니다. 방문을 기다리겠습니다!"],
};
const LABELS: Record<Lang, [string, string, string]> = {
  uz: ["Sanalar", "Mehmonlar", "To'langan"],
  en: ["Dates", "Guests", "Paid"],
  ru: ["Даты", "Гостей", "Оплачено"],
  ko: ["날짜", "인원", "결제액"],
};

async function send(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return;
  const from = Deno.env.get("FROM_EMAIL") ?? "Wild Haven <onboarding@resend.dev>";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
  } catch (_) {
    // email xatosi to'lovni buzmasligi kerak
  }
}

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
    .select("id, status, paid_at, stripe_session_id, villa_name, check_in, check_out, guests, total_price, lang")
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
  // paid_at hali bo'sh bo'lsagina yangilanadi — email faqat bir marta ketadi
  const { data: updated } = await admin
    .from("bookings")
    .update(patch)
    .eq("id", id)
    .is("paid_at", null)
    .select("id");

  if (updated && updated.length > 0) {
    const lang: Lang = LANGS.includes(b.lang) ? b.lang : "uz";
    const [subject, title, text] = T[lang];
    const [d, g, paid] = LABELS[lang];
    const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
<h2>${esc(title)}</h2><p>${esc(text)}</p>
<p><b>${esc(b.villa_name)}</b></p>
<p>${d}: ${esc(b.check_in)} — ${esc(b.check_out)}<br>${g}: ${b.guests}<br>${paid}: $${b.total_price}</p>
<p style="color:#888;font-size:12px">Wild Haven</p></div>`;
    const tasks: Promise<void>[] = [];
    if (user.email) tasks.push(send(user.email, `Wild Haven: ${subject}`, html));
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    if (adminEmail) {
      const ah = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto"><h2>Yangi to'lov</h2>
<p><b>${esc(b.villa_name)}</b><br>${esc(b.check_in)} — ${esc(b.check_out)}<br>$${b.total_price}<br>${esc(user.email ?? "")}</p></div>`;
      tasks.push(send(adminEmail, "Wild Haven: Yangi to'lov", ah));
    }
    await Promise.all(tasks);
  }
  return json({ paid: true });
});
